import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: Request) {
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

    // --- Fetch Global Settings for Profit Rate ---
    const GlobalSettings = require("@/models/GlobalSettings").default;
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({ investmentProfitRate: 50 });
    }
    const profitRate = settings.investmentProfitRate / 100;

    // --- Maturity Cycle & Rollover Logic ---
    const CYCLE_DURATION_DAYS = 30; // 30 Days Cycle
    const GRACE_PERIOD_DAYS = 7; // 1 Week Grace Period
    const TOTAL_CYCLE_DAYS = CYCLE_DURATION_DAYS + GRACE_PERIOD_DAYS;

    // Fix: Define 'now' here
    const now = new Date();

    let cycleStartDate = new Date(
      investor.cycleStartDate || investor.startDate
    );
    let activeCapital = investor.activeCapital || investor.initialAmount;

    // Lazy Rollover Check
    // If current time > cycleStartDate + 37 days, we need to rollover properly.
    // NOTE: This handles MULTIPLE missed cycles if user was away for months.
    let needsSave = false;
    let cyclesProcessed = 0;

    // We loop to handle if multiple cycles passed
    while (true) {
      const cycleEndTime = new Date(
        cycleStartDate.getTime() + TOTAL_CYCLE_DAYS * 24 * 60 * 60 * 1000
      );

      if (now >= cycleEndTime) {
        // Cycle + Grace period ended. Rollover!
        // Calculate profit for this finished cycle
        const profitForCycle = activeCapital * profitRate;

        // Deduct any amount withdrawn DURING this cycle?
        // Simplified: If they didn't withdraw in grace period, it's GONE into capital (Compounded).
        // Check withdrawnProfit. If `withdrawnProfit` > 0, it means they took some out.
        // But `withdrawnProfit` tracks TOTAL. We need cycle specific.
        // Current model tracks global `withdrawnProfit`.
        // To support compounding properly, we assume `withdrawnProfit` resets or we track "unwithdrawn".

        // REFINED LOGIC:
        // 1. We assume `withdrawnProfit` is reset on rollover in code (simulated).
        // Actually, we need to persist this change.
        const withdrawnInCurrentCycle = investor.withdrawnProfit || 0;
        const remainingProfit = Math.max(
          0,
          profitForCycle - withdrawnInCurrentCycle
        );

        // COMPOUND: Add remaining profit to Active Capital
        const previousCapital = activeCapital;
        activeCapital += remainingProfit;

        // MERGE PENDING TOP-UPS
        // If there's any pending top-up, it joins the capital NOW for the new cycle.
        const pending = investor.pendingTopUp || 0;
        if (pending > 0) {
          activeCapital += pending;
          investor.initialAmount = (investor.initialAmount || 0) + pending; // Increase initial base so it doesn't count as "profit"
          investor.pendingTopUp = 0; // Reset
        }

        // Log History (Rollover)
        investor.rolloverHistory.push({
          date: new Date(cycleEndTime),
          amountAdded: remainingProfit,
          newCapital: activeCapital,
          isTopUp: false, // This is a rollover event
        });
        // (Note: The Top Up itself was already logged in admin route when added)

        // Reset for next cycle
        cycleStartDate = cycleEndTime; // Start from where last ended
        investor.withdrawnProfit = 0; // Reset withdrawals for new cycle

        needsSave = true;
        cyclesProcessed++;
      } else {
        break; // Current cycle is still valid
      }
    }

    if (needsSave) {
      investor.cycleStartDate = cycleStartDate;
      investor.activeCapital = activeCapital;
      await investor.save();
    }

    // --- Current Cycle Calculation ---
    // Recalculate diff based on current cycle start
    const currentDiffTime = Math.abs(now.getTime() - cycleStartDate.getTime());
    const daysElapsed = Math.min(
      Math.floor(currentDiffTime / (1000 * 60 * 60 * 24)),
      CYCLE_DURATION_DAYS // Cap visual growth at 30 days
    );

    // Profit Calculation
    const totalGrowth = activeCapital * profitRate; // Dynamic rate
    const growthPerDay = totalGrowth / CYCLE_DURATION_DAYS;
    const currentGrowth = growthPerDay * daysElapsed;
    const currentValue = activeCapital + currentGrowth;

    // Grace Period Logic
    const daysSinceStart = Math.floor(currentDiffTime / (1000 * 60 * 60 * 24));
    const isMatured = daysSinceStart >= 30;
    const isGracePeriod = daysSinceStart >= 30 && daysSinceStart < 37;
    const daysRemainingInGrace = isGracePeriod ? 37 - daysSinceStart : 0;

    // Available Profit Logic
    // Users can ONLY withdraw during Grace Period
    const withdrawnProfit = investor.withdrawnProfit || 0;
    let availableProfit = 0;

    if (isGracePeriod) {
      // Full profit available during grace period (minus what they already took this week)
      availableProfit = Math.max(0, currentGrowth - withdrawnProfit);
    } else {
      // Locked outside grace period
      availableProfit = 0;
    }

    // --- Fetch Withdrawals ---
    const Withdrawal = require("@/models/Withdrawal").default;
    const withdrawals = await Withdrawal.find({ investor: investor._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      investor: {
        name: investor.name,
        email: investor.email,
        initialAmount: investor.initialAmount,
        activeCapital: activeCapital, // Send active capital
        startDate: investor.startDate, // Original start
        cycleStartDate: cycleStartDate, // Current cycle start
        status: investor.status,
        messages: investor.messages,
        withdrawnProfit: withdrawnProfit,
        bankDetails: investor.bankDetails,
        rolloverHistory: investor.rolloverHistory.reverse(), // Send history (newest first)
        pendingTopUp: investor.pendingTopUp, // Send pending
      },
      withdrawals: withdrawals, // Send withdrawals
      growth: {
        currentValue: currentValue,
        daysElapsed: daysElapsed,
        daysRemaining: Math.max(0, 30 - daysElapsed),
        percentage: (daysElapsed / 30) * 100,
        isMatured: isMatured,
        isGracePeriod: isGracePeriod,
        gracePeriodDaysRemaining: daysRemainingInGrace,
        totalProfit: currentGrowth,
        availableProfit: availableProfit,
        accumulatedProfit: Math.max(0, activeCapital - investor.initialAmount),
        profitRate: settings.investmentProfitRate, // Send rate to frontend
      },
    });
  } catch (error) {
    console.error("Investor Data Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
