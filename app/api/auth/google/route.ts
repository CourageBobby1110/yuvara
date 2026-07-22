import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getAuthSecret, findOrCreateGoogleUser } from "@/lib/auth-helpers";

/** Mobile app (Flutter) — Google ID token sign-in. Returns a JWT. */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Google client not configured" },
        { status: 500 }
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "Invalid Google token payload" },
        { status: 401 }
      );
    }

    const dbUser = await findOrCreateGoogleUser({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "Could not resolve user" },
        { status: 401 }
      );
    }

    const secret = getAuthSecret();
    const token = jwt.sign(
      { id: dbUser._id, role: dbUser.role },
      secret,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        image: dbUser.image,
      },
    });
  } catch (error) {
    console.error("Mobile Google auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed. The token might be invalid or expired." },
      { status: 401 }
    );
  }
}
