import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { sendInvestmentWelcomeEmail } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const investors = await Investor.find({}).sort({ createdAt: -1 });
    return NextResponse.json(investors);
  } catch (error) {
    console.error("Fetch Investors Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch investors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { name, email, password, accessPin, initialAmount, status } = body;

    // Check uniqueness
    const existingEmail = await Investor.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const existingPin = await Investor.findOne({ accessPin });
    if (existingPin) {
      return NextResponse.json(
        { error: "Access Pin already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newInvestor = await Investor.create({
      name,
      email,
      password: hashedPassword,
      accessPin,
      initialAmount,
      status,
      startDate: new Date(),
    });

    // Send Welcome Email
    await sendInvestmentWelcomeEmail(
      email,
      name,
      accessPin,
      initialAmount,
      password
    );

    return NextResponse.json(newInvestor, { status: 201 });
  } catch (error) {
    console.error("Create Investor Error:", error);
    return NextResponse.json(
      { error: "Failed to create investor" },
      { status: 500 }
    );
  }
}
