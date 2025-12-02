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

    // Calculate Growth
    const startDate = new Date(investor.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Note: Math.ceil might give 1 day even if just created.
    // Better to use floor or exact calculation depending on requirement.
    // "per day the amount will increase" -> Let's use fractional days for smoother update or integer days?
    // User said "per day", usually implies integer days. Let's stick to integer days for simplicity but maybe floor?
    // If created now, diff is 0.

    const daysElapsed = Math.min(
      Math.floor(diffTime / (1000 * 60 * 60 * 24)),
      30
    );

    const initialAmount = investor.initialAmount;
    const totalGrowth = initialAmount * 0.5; // 50%
    const growthPerDay = totalGrowth / 30;

    const currentGrowth = growthPerDay * daysElapsed;
    const currentValue = initialAmount + currentGrowth;

    return NextResponse.json({
      investor: {
        name: investor.name,
        email: investor.email,
        initialAmount: investor.initialAmount,
        startDate: investor.startDate,
        status: investor.status,
        messages: investor.messages,
      },
      growth: {
        currentValue: currentValue,
        daysElapsed: daysElapsed,
        daysRemaining: Math.max(0, 30 - daysElapsed),
        percentage: (daysElapsed / 30) * 100,
        isMatured: daysElapsed >= 30,
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
