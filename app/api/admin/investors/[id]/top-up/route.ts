import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    // Parse body for amount
    const body = await req.json();
    const { amount } = body;

    // Validation
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const investor = await Investor.findById(id);
    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    // Top Up Logic
    // REVISED: Add to pendingTopUp so it waits for next cycle (rollover)
    // This prevents immediate withdrawal or profit calculation mid-cycle.

    investor.pendingTopUp = (investor.pendingTopUp || 0) + amount;

    // Log this action
    investor.rolloverHistory.push({
      date: new Date(),
      amountAdded: amount,
      newCapital: investor.activeCapital, // Remains same for now
      isTopUp: true, // It is a top up
    });

    await investor.save();

    return NextResponse.json({
      success: true,
      message: "Top-up added to pending balance. It will activate next cycle.",
      investor: {
        pendingTopUp: investor.pendingTopUp,
        activeCapital: investor.activeCapital,
      },
    });
  } catch (error) {
    console.error("Error creating top-up:", error);
    return NextResponse.json(
      { error: "Failed to process top-up" },
      { status: 500 }
    );
  }
}
