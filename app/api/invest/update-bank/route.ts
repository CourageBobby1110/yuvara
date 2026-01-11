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

    const { bankName, accountNumber, accountName } = await req.json();

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "All bank details are required" },
        { status: 400 }
      );
    }

    const investor = await Investor.findByIdAndUpdate(
      decoded.id,
      {
        bankDetails: {
          bankName,
          accountNumber,
          accountName,
        },
      },
      { new: true }
    );

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bank details updated successfully",
      bankDetails: investor.bankDetails,
    });
  } catch (error) {
    console.error("Update Bank Details Error:", error);
    return NextResponse.json(
      { error: "Failed to update bank details" },
      { status: 500 }
    );
  }
}
