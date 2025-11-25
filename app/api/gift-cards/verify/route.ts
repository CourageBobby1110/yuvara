import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { isValidGiftCardCodeFormat } from "@/lib/giftCardUtils";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Gift card code is required" },
        { status: 400 }
      );
    }

    // Validate code format
    const normalizedCode = code.toUpperCase().trim();
    if (!isValidGiftCardCodeFormat(normalizedCode)) {
      return NextResponse.json(
        { error: "Invalid gift card code format" },
        { status: 400 }
      );
    }

    // Find gift card
    const giftCard = await GiftCard.findOne({
      code: normalizedCode,
      isActive: true,
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: "Gift card not found or inactive" },
        { status: 404 }
      );
    }

    // Check if valid
    if (!giftCard.isValid()) {
      let reason = "Gift card is not valid";

      if (giftCard.status === "used") {
        reason = "Gift card has been fully used";
      } else if (giftCard.status === "expired") {
        reason = "Gift card has expired";
      } else if (giftCard.status === "cancelled") {
        reason = "Gift card has been cancelled";
      } else if (giftCard.currentBalance <= 0) {
        reason = "Gift card has no remaining balance";
      } else if (
        giftCard.expirationDate &&
        giftCard.expirationDate < new Date()
      ) {
        reason = "Gift card has expired";
      }

      return NextResponse.json(
        { error: reason, valid: false },
        { status: 400 }
      );
    }

    // Return gift card details
    return NextResponse.json({
      valid: true,
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      initialBalance: giftCard.initialBalance,
      currency: giftCard.currency,
      expirationDate: giftCard.expirationDate,
    });
  } catch (error) {
    console.error("Gift card verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify gift card" },
      { status: 500 }
    );
  }
}
