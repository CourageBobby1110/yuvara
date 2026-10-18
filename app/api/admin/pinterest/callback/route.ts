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
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const proto =
    req.headers.get("x-forwarded-proto") || (isLocal ? "http" : "https");
  const baseUrl = isLocal
    ? `${proto}://${host}`
    : process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      `${proto}://${host}`;

  const adminSettingsUrl = `${baseUrl.replace(/\/$/, "")}/admin/settings`;
  const redirectUri = `${baseUrl.replace(
    /\/$/,
    ""
  )}/api/admin/pinterest/callback`;

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
    console.log("[Pinterest OAuth Callback] Incoming redirect with code:", !!code, "state:", state);

    const cookieStore = await cookies();
    const storedState = cookieStore.get("pinterest_oauth_state")?.value;
    const storedRedirectUri = cookieStore.get("pinterest_redirect_uri")?.value;
    cookieStore.delete("pinterest_oauth_state");
    cookieStore.delete("pinterest_redirect_uri");

    if (storedState && state && storedState !== state) {
      console.warn("[Pinterest OAuth] State parameter mismatch during verification");
    }

    const effectiveRedirectUri = storedRedirectUri || redirectUri;
    console.log("[Pinterest OAuth Callback] Using redirectUri:", effectiveRedirectUri);

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

    // Exchange authorization code for tokens
    const tokenData = await exchangePinterestCode(
      code,
      appId,
      appSecret,
      effectiveRedirectUri
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
    console.log("[Pinterest OAuth] Saved tokens successfully to SiteSettings! Account:", username || "(no username)");

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
