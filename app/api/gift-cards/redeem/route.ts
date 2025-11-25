import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { isValidGiftCardCodeFormat } from "@/lib/giftCardUtils";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { code, amount, orderId } = await req.json();

    // Validate inputs
    if (!code || !amount || !orderId) {
      return NextResponse.json(
        { error: "Code, amount, and order ID are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
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
      return NextResponse.json(
        { error: "Gift card is not valid for redemption" },
        { status: 400 }
      );
    }

    // Check if sufficient balance
    if (amount > giftCard.currentBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: ₦${giftCard.currentBalance.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Redeem gift card
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const redeemed = giftCard.redeem(amount, orderObjectId);

    if (!redeemed) {
      return NextResponse.json(
        { error: "Failed to redeem gift card" },
        { status: 500 }
      );
    }

    // Save updated gift card
    await giftCard.save();

    return NextResponse.json({
      success: true,
      amountRedeemed: amount,
      remainingBalance: giftCard.currentBalance,
      code: giftCard.code,
    });
  } catch (error) {
    console.error("Gift card redemption error:", error);
    return NextResponse.json(
      { error: "Failed to redeem gift card" },
      { status: 500 }
    );
  }
}
