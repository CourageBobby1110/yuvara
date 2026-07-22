import { signOut } from "@/auth";

/**
 * /api/signout — clears all auth cookies so sign-out works everywhere.
 *
 * Uses TWO mechanisms for reliability:
 *   1. Calls NextAuth's internal `signOut()` (the proper way to clear the
 *      current host's session cookie).
 *   2. Manually expires every known cookie name across domain variants
 *      (apex, www, .apex) as a safety net for cross-www/apex scenarios.
 */

const AUTH_COOKIE_NAMES = [
  // Auth.js v5
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  // Legacy next-auth v4 (some cookies may still linger)
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

/** Generate Set-Cookie strings that expire `name` for the given host. */
function expireCookie(name: string, host: string): string[] {
  const expired =
    "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
  const results: string[] = [
    `${name}=; ${expired}; SameSite=Lax`,
    `${name}=; ${expired}; SameSite=Lax; Secure`,
  ];

  // For production hosts, also expire with Domain so subdomain / sibling
  // cookies (e.g. www vs apex) get nuked too.
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const clean = host.split(":")[0];
    results.push(
      `${name}=; ${expired}; Domain=${clean}; SameSite=Lax`,
      `${name}=; ${expired}; Domain=${clean}; SameSite=Lax; Secure`
    );
    if (clean.startsWith("www.")) {
      const root = clean.replace(/^www\./, "");
      results.push(
        `${name}=; ${expired}; Domain=${root}; SameSite=Lax`,
        `${name}=; ${expired}; Domain=${root}; SameSite=Lax; Secure`,
        `${name}=; ${expired}; Domain=.${root}; SameSite=Lax`,
        `${name}=; ${expired}; Domain=.${root}; SameSite=Lax; Secure`
      );
    } else {
      results.push(
        `${name}=; ${expired}; Domain=.${clean}; SameSite=Lax`,
        `${name}=; ${expired}; Domain=.${clean}; SameSite=Lax; Secure`
      );
    }
  }

  return results;
}

async function handleSignOut(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("callbackUrl") || "/auth/signin";
  const host = request.headers.get("host") || "";

  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  });

  // ── Mechanism 1: NextAuth's own signOut (handles the current host) ──
  try {
    await signOut({ redirect: false });
  } catch (e) {
    // signOut() may throw "DYNAMIC_SERVER_USAGE" or similar in certain
    // runtimes — ignore and fall through to the manual scrub below.
    console.error("[/api/signout] signOut() threw:", e);
  }

  // ── Mechanism 2: manual cookie scrubbing (cross-domain safety net) ──
  const toClear = new Set<string>(AUTH_COOKIE_NAMES);
  const cookieHeader = request.headers.get("cookie") || "";
  for (const pair of cookieHeader.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (
      lower.includes("authjs") ||
      lower.includes("next-auth") ||
      lower.includes("session") ||
      lower.includes("csrf") ||
      lower.includes("callback-url")
    ) {
      toClear.add(name);
    }
  }

  for (const name of toClear) {
    for (const cookieStr of expireCookie(name, host)) {
      headers.append("Set-Cookie", cookieStr);
    }
  }

  return new Response(JSON.stringify({ success: true, redirect: to }), {
    status: 200,
    headers,
  });
}

export async function GET(request: Request) {
  try {
    return await handleSignOut(request);
  } catch (err) {
    console.error("[/api/signout] GET error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    return await handleSignOut(request);
  } catch (err) {
    console.error("[/api/signout] POST error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
