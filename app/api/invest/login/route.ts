import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Ensure this is in .env

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { password, accessPin } = await req.json();

    if (!password || !accessPin) {
      return NextResponse.json(
        { error: "Password and Access Pin are required" },
        { status: 400 }
      );
    }

    // Find investor by Access Pin (Serial Number)
    const investor = await Investor.findOne({ accessPin });

    if (!investor) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, investor.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: investor._id, email: investor.email, name: investor.name },
      JWT_SECRET,
      { expiresIn: "1d" } // Token valid for 1 day
    );

    // Return token and basic user info
    return NextResponse.json({
      success: true,
      token,
      user: {
        name: investor.name,
        email: investor.email,
        accessPin: investor.accessPin,
      },
    });
  } catch (error) {
    console.error("Investor Login Error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
