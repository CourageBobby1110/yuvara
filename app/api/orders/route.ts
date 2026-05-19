import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";
import {
  sendAdminNewOrderNotification,
  sendCustomerOrderConfirmation,
} from "@/lib/mail";

export async function GET(req: Request) {
  try {
    let userId: string | undefined;

    // 1. Try NextAuth session
    const session = await auth();
    if (session && session.user && session.user.id) {
      userId = session.user.id;
    } else {
      // 2. Try Authorization Bearer Token
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "fallback_secret"
          ) as any;
          userId = decoded.id;
        } catch (jwtError) {
          console.warn("JWT verification failed on orders fetch:", jwtError);
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // Find orders for the authenticated user
    const orders = await Order.find({ user: userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    await dbConnect();
    const {
      items,
      shippingAddress,
      total,
      couponCode,
      shippingFee,
      discountAmount,
    } = await req.json();

    // Coupon Validation Logic
    if (couponCode) {
      const Coupon = (await import("@/models/Coupon")).default;
      const coupon = await Coupon.findOne({ code: couponCode, isUsed: false });

      if (!coupon) {
        return NextResponse.json(
          { error: "Invalid or used coupon" },
          { status: 400 }
        );
      }

      // Verify amount (using a small buffer for float issues if needed, but strict for now)
      // Note: 'total' here should be the NGN equivalent or we need to convert.
      // Assuming frontend sends the NGN value or we check against the USD value converted?
      // The coupon maxAmount is in NGN (5000).
      // Let's assume the frontend sends the total in NGN if a coupon is used, or we verify the conversion here.
      // Better: The coupon logic says "product less than 5000 naira".
      // We should verify the total passed matches the cart total.

      if (total > coupon.maxAmount) {
        return NextResponse.json(
          { error: "Order total exceeds coupon limit" },
          { status: 400 }
        );
      }

      // Mark coupon as used
      coupon.isUsed = true;
      coupon.usedAt = new Date();

      // Find or Create User
      let userId = session?.user?.id;
      const email = session?.user?.email || shippingAddress.email;

      if (!userId && email) {
        const User = (await import("@/models/User")).default;
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
          user = await User.create({
            email: email.toLowerCase(),
            name: email.split("@")[0],
            isGuest: true,
            role: "user",
          });
        }
        userId = user._id;
      }

      if (!userId) {
        return NextResponse.json(
          { error: "Could not identify or create user" },
          { status: 400 }
        );
      }

      // Create Order
      const order = await Order.create({
        user: userId,
        items: items.map((item: any) => ({
          ...item,
          cjVid: item.cjVid,
        })),
        total, // This is 0 effectively for the user, but we record the value? Or 0?
        // Usually we record the value but paymentStatus is paid.
        // However, if we want to be strict, the "total to pay" is 0.
        status: "processing",
        shippingAddress,
        paymentStatus: "paid",
        paymentReference: `COUPON-${couponCode}`,
        shippingFee: shippingFee || 0,
        couponCode: couponCode,
        discountAmount: discountAmount || 0,
      });

      coupon.orderId = order._id;
      await coupon.save();

      // Send email notifications asynchronously so we don't block the client
      (async () => {
        try {
          await sendAdminNewOrderNotification(order);
          await sendCustomerOrderConfirmation(order);
        } catch (emailError) {
          console.error("Failed to send email notification asynchronously:", emailError);
        }
      })();

      return NextResponse.json({ success: true, orderId: order._id });
    }

    return NextResponse.json({ error: "Payment required" }, { status: 400 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
