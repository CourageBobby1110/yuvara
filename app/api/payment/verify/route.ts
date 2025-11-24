import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/auth";
import {
  sendAdminNewOrderNotification,
  sendCustomerOrderConfirmation,
} from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      reference,
      cartItems,
      shippingAddress,
      total,
      shippingFee,
      couponCode,
      discountAmount,
    } = body;

    if (!reference || !cartItems || !shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Payment is valid, create order
    await dbConnect();

    // Find user or use session
    let userId = session.user.id;

    // If session.user.id is missing (sometimes happens), try to find by email
    if (!userId && session.user.email) {
      const User = (await import("@/models/User")).default;
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        userId = user._id;
      }
    }

    // If still no userId, we can't link to a user profile easily.
    // But for now, let's assume we found it or fail if strict.
    // For guest checkout (future), we might relax this.

    const order = await Order.create({
      user: userId,
      items: cartItems.map((item: any) => ({
        product: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: total,
      status: "processing",
      shippingAddress,
      paymentReference: reference,
      paymentStatus: "paid",
      shippingFee: shippingFee || 0,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
    });

    // Increment Coupon Usage
    if (couponCode) {
      try {
        const Coupon = (await import("@/models/Coupon")).default;
        await Coupon.findOneAndUpdate(
          { code: couponCode },
          { $inc: { usedCount: 1 } }
        );
      } catch (err) {
        console.error("Failed to increment coupon usage", err);
      }
    }

    // Send email notification
    try {
      console.log("Sending order confirmation to:", shippingAddress.email);
      await sendAdminNewOrderNotification(order);
      await sendCustomerOrderConfirmation(order);
      console.log("Order confirmation sent successfully");
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      orderId: order._id,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
