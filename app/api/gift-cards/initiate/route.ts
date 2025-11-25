import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { initializePayment } from "@/lib/paystack";
import { GIFT_CARD_LIMITS } from "@/lib/giftCardUtils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { amount, recipientEmail, recipientName, message } = await req.json();

    // Validate amount
    if (!amount || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (
      amount < GIFT_CARD_LIMITS.MIN_AMOUNT ||
      amount > GIFT_CARD_LIMITS.MAX_AMOUNT
    ) {
      return NextResponse.json(
        {
          error: `Amount must be between ₦${GIFT_CARD_LIMITS.MIN_AMOUNT.toLocaleString()} and ₦${GIFT_CARD_LIMITS.MAX_AMOUNT.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Initialize Paystack payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin");
    const callbackUrl = `${appUrl}/gift-cards/verify`;

    let userId = (session.user as any).id;

    // If userId is missing from session, fetch it from DB
    if (!userId && session.user.email) {
      const User = (await import("@/models/User")).default;
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        userId = user._id;
      }
    }

    const metadata = {
      type: "gift_card_purchase",
      userId: userId,
      recipientEmail,
      recipientName,
      message,
    };

    const paymentData = await initializePayment(
      session.user.email,
      amount * 100, // Convert to kobo
      callbackUrl,
      metadata
    );

    return NextResponse.json({
      success: true,
      authorizationUrl: paymentData.authorization_url,
      reference: paymentData.reference,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
