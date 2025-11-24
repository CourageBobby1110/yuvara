import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

const MAX_COUPON_ORDER_AMOUNT = 30000; // 30,000 NGN limit

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { code, amount } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Check if order amount exceeds coupon usage limit
    if (amount > MAX_COUPON_ORDER_AMOUNT) {
      return NextResponse.json(
        {
          error: `Coupons can only be used on orders up to ₦${MAX_COUPON_ORDER_AMOUNT.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // Check expiration
    if (coupon.expirationDate && new Date() > new Date(coupon.expirationDate)) {
      return NextResponse.json(
        { error: "Coupon has expired" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Coupon usage limit reached" },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (amount * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed total amount
    discountAmount = Math.min(discountAmount, amount);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discountAmount: discountAmount,
      },
    });
  } catch (error) {
    console.error("Coupon verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify coupon" },
      { status: 500 }
    );
  }
}
