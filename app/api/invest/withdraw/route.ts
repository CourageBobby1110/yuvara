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

    // Check Maturity
    const startDate = new Date(investor.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysElapsed < 30) {
      return NextResponse.json(
        {
          error: `Investment not yet matured. ${
            30 - daysElapsed
          } days remaining.`,
        },
        { status: 400 }
      );
    }

    if (investor.status !== "active") {
      return NextResponse.json(
        { error: "Withdrawal already requested or completed." },
        { status: 400 }
      );
    }

    // Update Status
    investor.status = "withdrawal_requested";
    await investor.save();

    // Send Email to Admin and User
    await sendWithdrawalRequestEmail(
      investor.name,
      investor.email,
      investor.initialAmount, // Assuming full withdrawal for now, or calculate current value
      investor.bankDetails
    );

    console.log(
      `[Withdrawal] Request from ${investor.name} (${investor.email})`
    );

    return NextResponse.json({
      success: true,
      message:
        "Withdrawal request submitted successfully. Admin will process it shortly.",
    });
  } catch (error) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
