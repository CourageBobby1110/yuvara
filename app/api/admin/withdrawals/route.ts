import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Dynamic import to avoid issues, though direct is fine if consistent
    const Withdrawal = require("@/models/Withdrawal").default;
    const Investor = require("@/models/Investor").default;

    // Fetch withdrawals and populate investor details
    const withdrawals = await Withdrawal.find()
      .populate("investor", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error("Admin Withdrawals Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
