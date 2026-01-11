import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { auth } from "@/auth";

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const params = await props.params;
    const { id } = params;
    const { status, adminNote } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const Withdrawal = require("@/models/Withdrawal").default;
    const Investor = require("@/models/Investor").default;

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { error: "Withdrawal already processed" },
        { status: 400 }
      );
    }

    // Identify Investor
    const investor = await Investor.findById(withdrawal.investor);
    if (!investor) {
      return NextResponse.json(
        { error: "Associated investor not found" },
        { status: 404 }
      );
    }

    if (status === "approved") {
      // Logic for approval:
      // 1. Update Withdrawal Status
      // 2. Increment `withdrawnProfit` in Investor model to cut the money visually and logically from available profit.

      withdrawal.status = "approved";
      withdrawal.adminNote = adminNote;
      await withdrawal.save();

      investor.withdrawnProfit =
        (investor.withdrawnProfit || 0) + withdrawal.amount;
      await investor.save();
    } else {
      // Rejection
      withdrawal.status = "rejected";
      withdrawal.adminNote = adminNote;
      await withdrawal.save();
      // No change to investor balance
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${status}`,
    });
  } catch (error) {
    console.error("Admin Withdrawal Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update withdrawal" },
      { status: 500 }
    );
  }
}
