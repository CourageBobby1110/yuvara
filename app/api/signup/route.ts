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
import { generateReferralCode, getAuthSecret } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    let { email, password, name, referralCode } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    email = email.trim();

    // Normalize email to lowercase for consistent storage format
    email = email.toLowerCase().trim();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userName = name || email.split("@")[0];
    const newReferralCode = generateReferralCode(userName);

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
              maxAmount: 1000,
            });

            // Update Batch
            activeBatch.currentWinners += 1;
            await activeBatch.save();
          }
        }
        await referrer.save();
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, "i") } 
    });

    let user;

    if (existingUser) {
      // If user already has a password, they are registered. Block signup.
      if (existingUser.password) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }

      // Promote existing shadow guest account to fully registered user
      existingUser.password = hashedPassword;
      existingUser.name = userName;
      existingUser.isGuest = false;
      if (!existingUser.emailVerified) {
        existingUser.emailVerified = new Date();
      }
      if (!existingUser.referralCode) {
        existingUser.referralCode = newReferralCode;
      }
      if (!existingUser.referredBy && referredBy) {
        existingUser.referredBy = referredBy;
      }
      user = await existingUser.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        password: hashedPassword,
        name: userName,
        role: "user",
        emailVerified: new Date(),
        referralCode: newReferralCode,
        referredBy: referredBy,
      });
    }

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
      console.error("Failed to send verification email during signup:", emailError);
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      getAuthSecret(),
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
          role: user.role || "user",
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
