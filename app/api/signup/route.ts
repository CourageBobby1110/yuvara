import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import ReferralBatch from "@/models/ReferralBatch";
import Coupon from "@/models/Coupon";
import Token from "@/models/Token";
import { sendVerificationEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

function generateUserReferralCode(name: string) {
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email, password, name, referralCode } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userName = name || email.split("@")[0];
    const newReferralCode = generateUserReferralCode(userName);

    let referredBy = null;

    // Handle Referral Logic
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
        referrer.referralCount += 1;

        // Check for Coupon Reward (Threshold: 20)
        if (referrer.referralCount === 20) {
          const now = new Date();
          const activeBatch = await ReferralBatch.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ["$currentWinners", "$maxWinners"] },
          });

          if (activeBatch) {
            // Generate Coupon
            const couponCode = `WIN-${crypto
              .randomBytes(4)
              .toString("hex")
              .toUpperCase()}`;
            await Coupon.create({
              code: couponCode,
              user: referrer._id,
              batch: activeBatch._id,
              maxAmount: 5000,
            });

            // Update Batch
            activeBatch.currentWinners += 1;
            await activeBatch.save();
          }
        }
        await referrer.save();
      }
    }

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name: userName,
      role: "user",
      referralCode: newReferralCode,
      referredBy: referredBy,
    });

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await Token.create({
      userId: user._id,
      token: verificationToken,
    });

    // Send Verification Email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // We don't fail the signup if email fails, but we should log it
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.NEXTAUTH_SECRET || "fallback_secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          referralCode: user.referralCode,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
