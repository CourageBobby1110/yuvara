import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use require for models as seen in other working routes
    const Investor = require("@/models/Investor").default;

    const email = "mosesruth7028@gmail.com";
    const investor = await Investor.findOne({ email });

    if (!investor) {
      return NextResponse.json({
        error: "Investor not found",
        searched: email,
      });
    }

    const currentActive = investor.activeCapital || 0;
    const currentInitial = investor.initialAmount || 0;
    const currentPending = investor.pendingTopUp || 0;

    // Check if we need to fix
    // If Active is > 30000, we assume the 50k top up was applied incorrectly
    if (currentActive > 30000) {
      // Revert 50k
      const activeRevert = currentActive - 50000;
      const initialRevert = currentInitial - 50000;
      const pendingAdd = currentPending + 50000;

      investor.activeCapital = activeRevert;
      investor.initialAmount = initialRevert;
      investor.pendingTopUp = pendingAdd;

      await investor.save();

      return NextResponse.json({
        success: true,
        message: "FIX APPLIED",
        moved: 50000,
        newState: {
          active: activeRevert,
          initial: initialRevert,
          pending: pendingAdd,
        },
      });
    }

    return NextResponse.json({
      success: false,
      message: "No fix needed (capital low)",
      currentState: {
        active: currentActive,
        initial: currentInitial,
        pending: currentPending,
      },
    });
  } catch (error: any) {
    console.error("Fix Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
