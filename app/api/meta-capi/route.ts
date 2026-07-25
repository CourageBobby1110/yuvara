import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Normalizes and hashes values according to Meta Parameter Builder Library rules.
 * Values are normalized first, then SHA-256 hashed.
 */
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
  // Keep digits only per Parameter Builder standard
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return undefined;
  return hashSha256(digitsOnly);
}

function hashZip(zip?: string | null): string | undefined {
  if (!zip || typeof zip !== "string") return undefined;
  // Strip spaces and hyphens
  const cleaned = zip.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!cleaned) return undefined;
  return hashSha256(cleaned);
}

function hashCity(city?: string | null): string | undefined {
  if (!city || typeof city !== "string") return undefined;
  // Strip spaces and punctuation
  const cleaned = city.trim().toLowerCase().replace(/[\s\d\p{P}]/gu, "");
  if (!cleaned) return undefined;
  return hashSha256(cleaned);
}

/**
 * Extracts client IP prioritizing IPv6 addresses per Meta Parameter Builder best practice.
 */
function extractBestIp(reqHeaders: Headers): string | undefined {
  const cfIp = reqHeaders.get("cf-connecting-ip");
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const realIp = reqHeaders.get("x-real-ip");

  const candidates: string[] = [];

  if (cfIp) candidates.push(...cfIp.split(",").map((s) => s.trim()));
  if (forwardedFor) candidates.push(...forwardedFor.split(",").map((s) => s.trim()));
  if (realIp) candidates.push(...realIp.split(",").map((s) => s.trim()));

  // 1. Look for IPv6 candidate first (contains ':')
  const ipv6 = candidates.find((ip) => ip.includes(":"));
  if (ipv6) return ipv6;

  // 2. Fall back to first IPv4 candidate
  return candidates[0] || undefined;
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
    const clientIp = extractBestIp(reqHeaders);
    const userAgent = reqHeaders.get("user-agent") || undefined;

    // Parse cookies from Cookie header preserving case sensitivity for _fbc
    const cookieHeader = reqHeaders.get("cookie") || "";
    let fbp = userData.fbp;
    let fbc = userData.fbc;

    if (!fbp || !fbc) {
      const cookiesArr = cookieHeader.split(";");
      for (const cookie of cookiesArr) {
        const [k, v] = cookie.trim().split("=");
        if (k === "_fbp" && !fbp) fbp = v;
        if (k === "_fbc" && !fbc) fbc = v; // Preserving case
      }
    }

    // Prepare normalized user data per Meta Parameter Builder standards
    const normalizedUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      fbp: fbp || undefined,
      fbc: fbc || undefined, // Case-sensitive Meta Click ID
      em: userData.email ? [hashSha256(userData.email)] : undefined,
      ph: userData.phone ? [hashPhone(userData.phone)] : undefined,
      fn: userData.firstName ? [hashSha256(userData.firstName)] : undefined,
      ln: userData.lastName ? [hashSha256(userData.lastName)] : undefined,
      ct: userData.city ? [hashCity(userData.city)] : undefined,
      st: userData.state ? [hashSha256(userData.state)] : undefined,
      zp: userData.zip ? [hashZip(userData.zip)] : undefined,
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
          "[Meta CAPI Parameter Builder] Skipped sending event. NEXT_PUBLIC_FB_PIXEL_ID or FB_ACCESS_TOKEN is missing in environment variables.",
          { eventName, eventId }
        );
      }
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Meta Pixel ID or Access Token missing in environment",
      });
    }

    // Construct Meta CAPI Payload with Parameter Builder partner agent attribution tag
    const capiEvent: Record<string, any> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: actionSource,
      event_source_url: eventSourceUrl || undefined,
      user_data: normalizedUserData,
      custom_data: customData,
      partner_agent: "param_builder_nodejs_v1.0",
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
      console.error("[Meta CAPI Parameter Builder Error]", capiResult);
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
