import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import jwt from "jsonwebtoken";
import { sendIssueReportEmail } from "@/lib/mail";

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

    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Save Report to DB (Investor History)
    investor.reports.push({
      subject,
      message,
      date: new Date(),
      status: "pending",
    });
    await investor.save();

    // Create ContactMessage for Admin Dashboard
    const ContactMessage = require("@/models/ContactMessage").default;
    await ContactMessage.create({
      name: `${investor.name} (Investor)`,
      email: investor.email,
      message: `[Subject: ${subject}]\n\n${message}`,
      status: "unread",
    });

    // Send Email to Admin
    await sendIssueReportEmail(investor.name, investor.email, subject, message);

    console.log(`[Issue Report] From ${investor.name}: ${subject}`);

    return NextResponse.json({
      success: true,
      message: "Issue reported successfully. Admin has been notified.",
    });
  } catch (error) {
    console.error("Issue Report Error:", error);
    return NextResponse.json(
      { error: "Failed to report issue" },
      { status: 500 }
    );
  }
}
