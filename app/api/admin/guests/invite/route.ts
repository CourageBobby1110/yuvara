import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendClaimAccountEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await dbConnect();
    const guest = await User.findById(userId);

    if (!guest || !guest.isGuest) {
      return NextResponse.json({ error: "Invalid guest user" }, { status: 400 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);

    // Set token on user (valid for 3 days)
    guest.resetPasswordToken = hashedToken;
    guest.resetPasswordExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 72 hours
    await guest.save();

    // Send the claim account email
    await sendClaimAccountEmail(guest.email, token);

    return NextResponse.json({ success: true, message: "Invite sent successfully" });
  } catch (error) {
    console.error("Failed to send guest invite:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
