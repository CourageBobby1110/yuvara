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
      giftCardCode,
      giftCardAmountUsed,
    } = body;

    if (!reference || !cartItems || !shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify transaction with Paystack
    let isFullDiscount = false;
    let verifyData: any = null;

    if (reference.startsWith("FULL_DISCOUNT_")) {
      isFullDiscount = true;
      // Ensure total is 0 or close to 0 (floating point safety)
      if (total > 0) {
        return NextResponse.json(
          { error: "Invalid full discount request" },
          { status: 400 }
        );
      }
    } else {
      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data.status !== "success") {
        return NextResponse.json(
          { error: "Payment verification failed" },
          { status: 400 }
        );
      }
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

    // Handle Gift Card Redemption
    if (giftCardCode && giftCardAmountUsed > 0) {
      try {
        const GiftCard = (await import("@/models/GiftCard")).default;
        const giftCard = await GiftCard.findOne({
          code: giftCardCode,
          isActive: true,
        });

        if (giftCard) {
          // We need an order ID to redeem, but we haven't created it yet.
          // Mongoose allows creating an ObjectId before saving.
          // Or we can create the order first, then redeem.
          // Let's create order first.
        }
      } catch (err) {
        console.error("Failed to process gift card", err);
      }
    }

    // Handle Affiliate Commission
    let affiliateId = null;
    let commissionAmount = 0;
    // Get affiliate code from Paystack metadata OR from request body (for full discount)
    const affiliateCode =
      verifyData?.data?.metadata?.affiliateCode || body.affiliateCode;

    if (affiliateCode) {
      try {
        const User = (await import("@/models/User")).default;
        const affiliateUser = await User.findOne({
          referralCode: affiliateCode,
        });

        if (
          affiliateUser &&
          affiliateUser._id.toString() !== userId?.toString()
        ) {
          affiliateId = affiliateUser._id;
          commissionAmount = total * 0.1; // 10% commission

          await User.findByIdAndUpdate(affiliateId, {
            $inc: {
              affiliateBalance: commissionAmount,
              totalEarnings: commissionAmount,
              referralCount: 1,
            },
          });
        }
      } catch (err) {
        console.error("Failed to process affiliate commission", err);
      }
    }

    const order = await Order.create({
      user: userId,
      items: cartItems.map((item: any) => ({
        product: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        cjVid: item.cjVid,
      })),
      total: total,
      status: "processing",
      shippingAddress,
      paymentReference: reference,
      paymentStatus: "paid",
      shippingFee: shippingFee || 0,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
      giftCardCode: giftCardCode || null,
      giftCardAmountUsed: giftCardAmountUsed || 0,
      affiliate: affiliateId,
      commissionAmount: commissionAmount,
    });

    // Redeem Gift Card
    if (giftCardCode && giftCardAmountUsed > 0) {
      try {
        const GiftCard = (await import("@/models/GiftCard")).default;
        const giftCard = await GiftCard.findOne({
          code: giftCardCode,
          isActive: true,
        });

        if (giftCard) {
          giftCard.redeem(giftCardAmountUsed, order._id);
          await giftCard.save();
        }
      } catch (err) {
        console.error("Failed to redeem gift card", err);
        // Note: Order is already created and paid. If redemption fails here,
        // we have a discrepancy. Ideally we should use a transaction.
        // For now, we log it.
      }
    }

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
