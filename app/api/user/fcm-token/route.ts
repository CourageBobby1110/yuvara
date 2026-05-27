import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    let userId: string | undefined;

    // Resolve user authentication
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Check Bearer Token (for the Flutter app)
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "fallback_secret"
          ) as any;
          userId = decoded.id;
        } catch (jwtError) {
          console.warn("JWT verification failed on FCM token registration:", jwtError);
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fcmToken } = await req.json();
    if (!fcmToken) {
      return NextResponse.json({ error: "FCM token is required" }, { status: 400 });
    }

    await dbConnect();

    // Use $addToSet to prevent duplicate tokens in the user's array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: fcmToken },
    });

    return NextResponse.json({ success: true, message: "FCM Token registered successfully" });
  } catch (error) {
    console.error("FCM Token registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    let userId: string | undefined;

    // Resolve user authentication
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Check Bearer Token (for the Flutter app)
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "fallback_secret"
          ) as any;
          userId = decoded.id;
        } catch (jwtError) {
          console.warn("JWT verification failed on FCM token removal:", jwtError);
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fcmToken } = await req.json();
    if (!fcmToken) {
      return NextResponse.json({ error: "FCM token is required" }, { status: 400 });
    }

    await dbConnect();

    // Remove the fcmToken from the user's fcmTokens array
    await User.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: fcmToken },
    });

    return NextResponse.json({ success: true, message: "FCM Token unregistered successfully" });
  } catch (error) {
    console.error("FCM Token unregistration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
