import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { generateUniqueGiftCardCode } from "@/lib/giftCardUtils";
import { verifyPayment } from "@/lib/paystack";
import { sendGiftCardEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // Verify payment
    const paymentData = await verifyPayment(reference);

    if (!paymentData) {
      return NextResponse.json(
        { error: "Invalid or failed payment" },
        { status: 400 }
      );
    }

    // Check if gift card already exists for this reference (idempotency)
    const existingGiftCard = await GiftCard.findOne({
      paymentReference: reference,
    });

    if (existingGiftCard) {
      return NextResponse.json({
        success: true,
        giftCard: {
          code: existingGiftCard.code,
          amount: existingGiftCard.initialBalance,
          currency: existingGiftCard.currency,
          recipientEmail: existingGiftCard.recipientEmail,
        },
      });
    }

    // Extract metadata
    const { metadata, amount } = paymentData;

    if (metadata?.type !== "gift_card_purchase") {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Generate unique code
    const code = await generateUniqueGiftCardCode();

    // Create gift card
    const giftCard = await GiftCard.create({
      code,
      initialBalance: amount / 100, // Convert back from kobo
      currentBalance: amount / 100,
      currency: "NGN",
      purchasedBy: metadata.userId,
      recipientEmail:
        metadata.recipientEmail?.trim().toLowerCase() || undefined,
      recipientName: metadata.recipientName?.trim() || undefined,
      message: metadata.message?.trim() || undefined,
      status: "active",
      purchaseDate: new Date(),
      isActive: true,
      paymentReference: reference,
    });

    // Send email to recipient
    await sendGiftCardEmail(giftCard);

    return NextResponse.json({
      success: true,
      giftCard: {
        code: giftCard.code,
        amount: giftCard.initialBalance,
        currency: giftCard.currency,
        recipientEmail: giftCard.recipientEmail,
      },
    });
  } catch (error) {
    console.error("Complete purchase error:", error);
    return NextResponse.json(
      { error: "Failed to complete purchase" },
      { status: 500 }
    );
  }
}
