import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isAffiliate) {
      return NextResponse.json(
        { error: "User is not an affiliate" },
        { status: 403 }
      );
    }

    if (
      !user.affiliateBankDetails ||
      !user.affiliateBankDetails.accountNumber
    ) {
      return NextResponse.json(
        { error: "Please save your bank details first" },
        { status: 400 }
      );
    }

    const amount = user.affiliateBalance;

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal request
    await Withdrawal.create({
      user: user._id,
      amount,
      bankDetails: user.affiliateBankDetails,
      status: "pending",
    });

    // Deduct from user balance
    user.affiliateBalance = 0;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
