import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select(
      "isAffiliate affiliateBalance totalEarnings referralCode referralCount affiliateBankDetails"
    );

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch affiliate data" },
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

    // Check if already affiliate
    const user = await User.findById(session.user.id);
    if (user.isAffiliate) {
      return NextResponse.json({ message: "Already an affiliate" });
    }

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      // Ensure uniqueness (simplified for now, ideally check DB)
    }

    user.isAffiliate = true;
    user.referralCode = referralCode;
    await user.save();

    return NextResponse.json({
      message: "Affiliate account activated",
      isAffiliate: true,
      referralCode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to activate affiliate account" },
      { status: 500 }
    );
  }
}
