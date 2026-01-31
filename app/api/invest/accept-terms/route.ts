import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import jwt from "jsonwebtoken";

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
        { status: 404 },
      );
    }

    // Check if already accepted
    if (investor.termsAccepted) {
      return NextResponse.json({
        message: "Terms already accepted",
        termsAccepted: true,
      });
    }

    // Update terms acceptance
    investor.termsAccepted = true;
    investor.termsAcceptedDate = new Date();
    await investor.save();

    return NextResponse.json({
      message: "Terms accepted successfully",
      termsAccepted: true,
    });
  } catch (error) {
    console.error("Accept Terms Error:", error);
    return NextResponse.json(
      { error: "Failed to accept terms" },
      { status: 500 },
    );
  }
}
