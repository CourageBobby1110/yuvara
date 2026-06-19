import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import jwt from "jsonwebtoken";
import { sendWithdrawalRequestEmail } from "@/lib/mail";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Verify Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const investor = await Investor.findById(decoded.id);
    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    const { amount, isWithdrawAll } = await req.json();

    if (isWithdrawAll && !investor.allowWithdrawAll) {
      return NextResponse.json(
        { error: "Withdraw All is not activated for your account." },
        { status: 403 }
      );
    }

    // --- Validation ---

    // Check Grace Period
    const now = new Date();
    const cycleStartDate = new Date(
      investor.cycleStartDate || investor.startDate
    );
    const diffTime = Math.abs(now.getTime() - cycleStartDate.getTime());
    const daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isGracePeriod = daysSinceStart >= 30 && daysSinceStart < 37;

    // Allow admin testing or override? For now strict.
    if (!isWithdrawAll && !isGracePeriod) {
      return NextResponse.json(
        {
          error:
            "Withdrawals are only allowed during the 7-day grace period after maturity (Day 30-37).",
        },
        { status: 403 }
      );
    }

    const withdrawnProfit = investor.withdrawnProfit || 0;
    let withdrawalAmount = amount;

    if (isWithdrawAll) {
      // Calculate total amount: activeCapital + currentGrowth - withdrawnProfit + pendingTopUp
      const GlobalSettings = require("@/models/GlobalSettings").default;
      let settings = await GlobalSettings.findOne();
      if (!settings) {
        settings = await GlobalSettings.create({ investmentProfitRate: 50 });
      }
      const globalRate = settings.investmentProfitRate / 100;
      const profitRate =
        investor.customProfitRate !== null &&
        investor.customProfitRate !== undefined
          ? investor.customProfitRate / 100
          : globalRate;

      const CYCLE_DURATION_DAYS = 30;
      const currentDiffTime = Math.abs(now.getTime() - cycleStartDate.getTime());
      const daysElapsed = Math.min(
        Math.floor(currentDiffTime / (1000 * 60 * 60 * 24)),
        CYCLE_DURATION_DAYS,
      );

      const activeCapital = investor.activeCapital || investor.initialAmount;
      const totalGrowth = activeCapital * profitRate;
      const growthPerDay = totalGrowth / CYCLE_DURATION_DAYS;
      const currentGrowth = growthPerDay * daysElapsed;
      const pendingTopUp = investor.pendingTopUp || 0;

      const accumulatedProfit = investor.accumulatedProfit || 0;
      withdrawalAmount = activeCapital + accumulatedProfit + currentGrowth - withdrawnProfit + pendingTopUp;

      if (withdrawalAmount <= 0) {
        return NextResponse.json(
          { error: "No funds available to withdraw" },
          { status: 400 }
        );
      }
    } else {
      if (!withdrawalAmount || withdrawalAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid withdrawal amount" },
          { status: 400 }
        );
      }

      // Check Available Profit
      const GlobalSettings = require("@/models/GlobalSettings").default;
      let settings = await GlobalSettings.findOne();
      if (!settings) {
        settings = await GlobalSettings.create({ investmentProfitRate: 50 });
      }
      const globalRate = settings.investmentProfitRate / 100;
      const profitRate =
        investor.customProfitRate !== null &&
        investor.customProfitRate !== undefined
          ? investor.customProfitRate / 100
          : globalRate;

      const activeCapital = investor.activeCapital || investor.initialAmount;
      const currentGrowth = activeCapital * profitRate;
      const availableProfit = Math.max(0, currentGrowth - withdrawnProfit);

      if (withdrawalAmount > availableProfit) {
        return NextResponse.json(
          { error: "Insufficient available profit" },
          { status: 400 }
        );
      }
    }

    // Create Withdrawal Request
    const Withdrawal = require("@/models/Withdrawal").default; // Dynamic import to avoid circular dep issues if any
    await Withdrawal.create({
      investor: investor._id,
      amount: withdrawalAmount,
      status: "pending",
      bankDetails: investor.bankDetails,
      isWithdrawAll: isWithdrawAll || false,
    });

    // Send Email notification
    try {
      await sendWithdrawalRequestEmail(
        investor.name,
        investor.email,
        withdrawalAmount,
        investor.bankDetails
      );
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Continue execution even if email fails
    }

    return NextResponse.json({
      success: true,
      message:
        "Withdrawal request submitted successfully. Waiting for admin approval.",
    });
  } catch (error) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
