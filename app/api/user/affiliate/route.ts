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
    const user = await User.findById(session.user.id);

    // Parse body to check if it's an activation or update
    const body = await req.json().catch(() => ({}));

    if (body.bankDetails) {
      // Update bank details
      user.affiliateBankDetails = body.bankDetails;
      await user.save();
      return NextResponse.json({
        message: "Bank details updated",
        bankDetails: user.affiliateBankDetails,
      });
    }

    // Activation logic
    if (user.isAffiliate) {
      return NextResponse.json({ message: "Already an affiliate" });
    }

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
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
    console.error("Affiliate API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
