import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const affiliates = await User.find({ isAffiliate: true })
      .select("-password")
      .sort({ totalEarnings: -1 })
      .lean();

    const withdrawals = await Withdrawal.find({ status: "pending" }).lean();
    const pendingWithdrawalUserIds = new Set(
      withdrawals.map((w: any) => w.user.toString())
    );

    const affiliatesWithStatus = affiliates.map((affiliate: any) => ({
      ...affiliate,
      hasPendingWithdrawal: pendingWithdrawalUserIds.has(
        affiliate._id.toString()
      ),
    }));

    return NextResponse.json(affiliatesWithStatus);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch affiliates" },
      { status: 500 }
    );
  }
}
