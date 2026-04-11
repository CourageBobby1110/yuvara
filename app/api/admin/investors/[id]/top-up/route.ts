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

    // Parse body for amount and type
    const body = await req.json();
    const { amount, type } = body;

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

    let message = "";

    // Handle different adjustment types
    if (type === "top_up" || !type) {
      // Top Up Logic
      // REVISED: Add to pendingTopUp so it waits for next cycle (rollover)
      investor.pendingTopUp = (investor.pendingTopUp || 0) + amount;
      message = "Top-up added to pending balance. It will activate next cycle.";

      // Log this action
      investor.rolloverHistory.push({
        date: new Date(),
        amountAdded: amount,
        newCapital: investor.activeCapital, // Remains same for now
        isTopUp: true,
      });
    } else if (type === "deduct_profit") {
      // Immediate logic for profit deduction
      if (investor.activeCapital < amount) {
        return NextResponse.json(
          { error: "Insufficient capital for deduction" },
          { status: 400 }
        );
      }
      investor.activeCapital -= amount;
      message = "Profit deduction applied immediately.";

      // Log this action
      investor.rolloverHistory.push({
        date: new Date(),
        amountAdded: -amount,
        newCapital: investor.activeCapital,
        isTopUp: true,
      });
    } else if (type === "deduct_principal") {
      // Immediate logic for principal deduction
      if (investor.activeCapital < amount) {
        return NextResponse.json(
          { error: "Insufficient capital for deduction" },
          { status: 400 }
        );
      }
      investor.activeCapital -= amount;
      // Also reduce the initial investment base
      investor.initialAmount = Math.max(0, investor.initialAmount - amount);
      message = "Principal deduction applied immediately.";

      // Log this action
      investor.rolloverHistory.push({
        date: new Date(),
        amountAdded: -amount,
        newCapital: investor.activeCapital,
        isTopUp: true,
      });
    }

    await investor.save();

    return NextResponse.json({
      success: true,
      message,
      investor: {
        pendingTopUp: investor.pendingTopUp,
        activeCapital: investor.activeCapital,
        initialAmount: investor.initialAmount,
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
