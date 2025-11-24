import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findById(session.user.id).select("referralCode referralCount");
    const coupons = await Coupon.find({ user: session.user.id }).sort({ createdAt: -1 });
    
    // Fetch referred users list
    const referredUsers = await User.find({ referredBy: session.user.id })
      .select("name email createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      coupons,
      referredUsers,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
  }
}
