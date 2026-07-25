import { NextResponse } from "next/server";
import crypto from "crypto";

function hashSha256(val?: string | null): string | undefined {
  if (!val || typeof val !== "string") return undefined;
  const cleaned = val.trim().toLowerCase();
  if (!cleaned) return undefined;
  // If it's already a 64-character SHA-256 hex string, return as is
  if (/^[a-f0-9]{64}$/i.test(cleaned)) return cleaned;
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone || typeof phone !== "string") return undefined;
  // Keep only numbers
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return undefined;
  return hashSha256(digitsOnly);
}

export async function POST(req: Request) {
  try {
    const pixelId =
      process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.META_PIXEL_ID;
    const accessToken =
      process.env.FB_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

    const body = await req.json();
    const {
      eventName,
      eventId,
      eventSourceUrl,
      customData = {},
      userData = {},
      actionSource = "website",
    } = body;

    if (!eventName || !eventId) {
      return NextResponse.json(
        { error: "Missing eventName or eventId" },
        { status: 400 }
      );
    }

    // Extract headers and cookies for attribution match
    const reqHeaders = new Headers(req.headers);
    const forwardedFor = reqHeaders.get("x-forwarded-for");
    const realIp = reqHeaders.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || undefined;
    const userAgent = reqHeaders.get("user-agent") || undefined;

    // Parse cookies from Cookie header
    const cookieHeader = reqHeaders.get("cookie") || "";
    let fbp = userData.fbp;
    let fbc = userData.fbc;

    if (!fbp || !fbc) {
      const cookiesArr = cookieHeader.split(";");
      for (const cookie of cookiesArr) {
        const [k, v] = cookie.trim().split("=");
        if (k === "_fbp" && !fbp) fbp = v;
        if (k === "_fbc" && !fbc) fbc = v;
      }
    }

    // Prepare normalized user data with SHA-256 hashing
    const normalizedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      fbp: fbp || undefined,
      fbc: fbc || undefined,
      em: userData.email ? [hashSha256(userData.email)] : undefined,
      ph: userData.phone ? [hashPhone(userData.phone)] : undefined,
      fn: userData.firstName ? [hashSha256(userData.firstName)] : undefined,
      ln: userData.lastName ? [hashSha256(userData.lastName)] : undefined,
      ct: userData.city ? [hashSha256(userData.city)] : undefined,
      st: userData.state ? [hashSha256(userData.state)] : undefined,
      zp: userData.zip ? [hashSha256(userData.zip)] : undefined,
      country: userData.country ? [hashSha256(userData.country)] : undefined,
      external_id: userData.userId ? [hashSha256(userData.userId)] : undefined,
    };

    // Remove undefined fields from normalizedUserData
    Object.keys(normalizedUserData).forEach(
      (key) =>
        normalizedUserData[key] === undefined && delete normalizedUserData[key]
    );

    // If Pixel ID or Access Token is missing, log a warning and return early success
    if (!pixelId || !accessToken) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Meta CAPI] Skipped sending event. NEXT_PUBLIC_FB_PIXEL_ID or FB_ACCESS_TOKEN is missing in environment variables.",
          { eventName, eventId }
        );
      }
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Meta Pixel ID or Access Token missing in environment",
      });
    }

    // Construct Meta CAPI Payload
    const capiEvent: Record<string, any> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: actionSource,
      event_source_url: eventSourceUrl || undefined,
      user_data: normalizedUserData,
      custom_data: customData,
    };

    const testEventCode =
      process.env.FB_TEST_EVENT_CODE || process.env.META_TEST_EVENT_CODE;
    if (testEventCode) {
      capiEvent.test_event_code = testEventCode;
    }

    const graphApiUrl = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`;

    const capiResponse = await fetch(graphApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [capiEvent],
      }),
    });

    const capiResult = await capiResponse.json();

    if (!capiResponse.ok) {
      console.error("[Meta CAPI Error]", capiResult);
      return NextResponse.json(
        { error: "Failed to send Meta CAPI event", details: capiResult },
        { status: capiResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      events_received: capiResult.events_received,
      fbtrace_id: capiResult.fbtrace_id,
    });
  } catch (error: any) {
    console.error("[Meta CAPI Server Exception]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
