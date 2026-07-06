"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import { sendVerificationEmail as sendMail } from "@/lib/mail";
import crypto from "crypto";

export async function sendVerificationEmail(email: string) {
  try {
    await dbConnect();

    // 1. Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // 2. Find existing token or create a new one
    let tokenDoc = await Token.findOne({ userId: user._id });
    let tokenValue;

    if (tokenDoc) {
      tokenValue = tokenDoc.token;
    } else {
      tokenValue = crypto.randomBytes(32).toString("hex");
      await Token.create({
        userId: user._id,
        token: tokenValue,
      });
    }

    // 3. Send email using the custom mail sender
    await sendMail(user.email, tokenValue);

    return { success: true };
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}
