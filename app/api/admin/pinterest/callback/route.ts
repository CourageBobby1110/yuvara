import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import {
  exchangePinterestCode,
  getPinterestUserAccount,
} from "@/lib/pinterest";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const host = req.headers.get("host") || "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const defaultOrigin = `${proto}://${host}`;
  const configuredBaseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    defaultOrigin;

  const adminSettingsUrl = `${configuredBaseUrl.replace(
    /\/$/,
    ""
  )}/admin/settings`;

  if (errorParam) {
    const errorMsg = errorDescription || errorParam;
    return NextResponse.redirect(
      `${adminSettingsUrl}?pinterest_error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${adminSettingsUrl}?pinterest_error=${encodeURIComponent(
        "No authorization code returned from Pinterest"
      )}`
    );
  }

  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.redirect(
        `${configuredBaseUrl}/auth/login?callbackUrl=${encodeURIComponent(
          "/admin/settings"
        )}`
      );
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get("pinterest_oauth_state")?.value;
    cookieStore.delete("pinterest_oauth_state");

    if (storedState && state && storedState !== state) {
      console.warn("State mismatch during Pinterest OAuth verification");
    }

    await dbConnect();
    const settings = await SiteSettings.findOne().lean();

    const appId = (
      settings?.pinterestAppId ||
      process.env.PINTEREST_APP_ID ||
      ""
    ).trim();

    const appSecret = (
      settings?.pinterestAppSecret ||
      process.env.PINTEREST_APP_SECRET ||
      ""
    ).trim();

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        `${adminSettingsUrl}?pinterest_error=${encodeURIComponent(
          "Pinterest App ID and App Secret must be configured before completing authorization"
        )}`
      );
    }

    const redirectUri = `${configuredBaseUrl.replace(
      /\/$/,
      ""
    )}/api/admin/pinterest/callback`;

    // Exchange authorization code for tokens
    const tokenData = await exchangePinterestCode(
      code,
      appId,
      appSecret,
      redirectUri
    );

    // Fetch account info
    let username = "";
    try {
      const userAccount = await getPinterestUserAccount(tokenData.access_token);
      username = userAccount.username || "";
    } catch (userErr) {
      console.warn("Could not retrieve Pinterest username:", userErr);
    }

    // Save tokens and account status to SiteSettings
    await SiteSettings.findOneAndUpdate(
      {},
      {
        $set: {
          pinterestAccessToken: tokenData.access_token,
          pinterestRefreshToken: tokenData.refresh_token || "",
          pinterestAccountUsername: username,
          pinterestLastSyncStatus: "Connected",
        },
      },
      { upsert: true }
    );

    return NextResponse.redirect(
      `${adminSettingsUrl}?pinterest=connected${
        username ? `&user=${encodeURIComponent(username)}` : ""
      }`
    );
  } catch (error: any) {
    console.error("Pinterest OAuth callback error:", error);
    const msg =
      error?.message ||
      "Failed to exchange Pinterest authorization code for access token";
    return NextResponse.redirect(
      `${adminSettingsUrl}?pinterest_error=${encodeURIComponent(msg)}`
    );
  }
}
