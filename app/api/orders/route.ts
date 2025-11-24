import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/auth";
import {
  sendAdminNewOrderNotification,
  sendCustomerOrderConfirmation,
} from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // Find orders for the current user
    // Assuming session.user.id is available. If not, we might need to find User by email first.
    // For safety, let's try to find by user ID if present, or fallback to email lookup if needed (but Order stores ObjectId)

    // Ideally session.user.id should be populated by NextAuth callbacks
    const orders = await Order.find({ user: session.user.id }).sort({
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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

      // Create Order
      const order = await Order.create({
        user: session.user.id,
        items,
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

      // Send email notifications
      try {
        await sendAdminNewOrderNotification(order);
        await sendCustomerOrderConfirmation(order);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

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
