import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

// Use the web client ID for verifying tokens sent by Flutter's Google Sign-In
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "996596779540-n9qq24oq6orlspb0dirmam4e3efq64mo.apps.googleusercontent.com");

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID || "996596779540-n9qq24oq6orlspb0dirmam4e3efq64mo.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "Invalid Google token payload" },
        { status: 401 }
      );
    }

    const { email, name, picture } = payload;

    // Check if user exists in the database
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") } 
    });

    // If user does not exist, create a new one
    if (!user) {
      // Create user without a password since they use Google Auth
      user = await User.create({
        email: email.trim(),
        name: name || "Google User",
        image: picture || "",
        emailVerified: new Date(),
        role: "user",
      });
    } else if (!user.image && picture) {
      // Update missing picture
      user.image = picture;
      await user.save();
    }

    // Create JWT token for mobile app session
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.NEXTAUTH_SECRET || "fallback_secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Google Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed. The token might be invalid or expired." },
      { status: 401 }
    );
  }
}
