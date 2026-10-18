import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { getPinterestAuthUrl } from "@/lib/pinterest";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const settings = await SiteSettings.findOne().lean();

    const appId = (
      settings?.pinterestAppId ||
      process.env.PINTEREST_APP_ID ||
      ""
    ).trim();

    if (!appId) {
      return NextResponse.json(
        {
          error:
            "Pinterest App ID is not configured. Please save your Pinterest App ID in Settings first.",
        },
        { status: 400 }
      );
    }

    const host = req.headers.get("host") || "localhost:3000";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const proto =
      req.headers.get("x-forwarded-proto") || (isLocal ? "http" : "https");
    const baseUrl = isLocal
      ? `${proto}://${host}`
      : process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        `${proto}://${host}`;

    const redirectUri = `${baseUrl.replace(
      /\/$/,
      ""
    )}/api/admin/pinterest/callback`;

    const state = crypto.randomBytes(16).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set("pinterest_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
      path: "/",
    });
    cookieStore.set("pinterest_redirect_uri", redirectUri, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    console.log(
      `[Pinterest OAuth Init] Redirecting to Pinterest: appId=${appId}, redirectUri=${redirectUri}`
    );

    const authUrl = getPinterestAuthUrl(appId, redirectUri, state);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Error initiating Pinterest OAuth:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initiate Pinterest authorization" },
      { status: 500 }
    );
  }
}
