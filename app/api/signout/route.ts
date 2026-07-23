import { signOut } from "@/auth";

/**
 * /api/signout — two modes:
 *
 *   GET  (browser navigation via `window.location.href`)
 *     → 302 redirect + Set-Cookie expire headers.
 *        The browser processes the Set-Cookie during the redirect, so the
 *        cookie is guaranteed to be gone when the sign-in page loads.
 *
 *   POST (client `fetch`)
 *     → 200 JSON + Set-Cookie expire headers.
 *
 * In both modes: calls NextAuth's `signOut()` first (handles the current
 * host), then manually expires every known cookie name across domain
 * variants (apex, www, .www) as a safety net.
 */

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function expireCookie(name: string, host: string): string[] {
  const expired =
    "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
  const results: string[] = [
    `${name}=; ${expired}; SameSite=Lax`,
    `${name}=; ${expired}; SameSite=Lax; Secure`,
  ];

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

async function signOutHandler(request: Request) {
  let to = "/auth/signin";
  let host = "";
  try {
    const url = new URL(request.url);
    to = url.searchParams.get("callbackUrl") || to;
    host = request.headers.get("host") || "";
  } catch {
    // request.url might be malformed in edge cases — use defaults
  }

  const headers = new Headers({
    "Cache-Control":
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  });

  // ── Mechanism 1: NextAuth's own signOut (handles current host) ──────
  try {
    await signOut({ redirect: false });
  } catch {
    // signOut() may throw in non-Server-Action contexts — fall through
  }

  // ── Mechanism 2: manual cookie scrub (cross-domain safety net) ──────
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

  // GET → 302 redirect (browser navigation); POST → JSON
  if (request.method === "GET") {
    headers.set("Location", to);
    return new Response(null, { status: 302, headers });
  }

  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify({ success: true, redirect: to }), {
    status: 200,
    headers,
  });
}

export async function GET(request: Request) {
  try {
    return await signOutHandler(request);
  } catch (err) {
    console.error("[/api/signout] GET error:", err);
    // Even on error, redirect so the user doesn't see a blank/error page.
    return new Response(null, {
      status: 302,
      headers: { Location: "/auth/signin" },
    });
  }
}

export async function POST(request: Request) {
  try {
    return await signOutHandler(request);
  } catch (err) {
    console.error("[/api/signout] POST error:", err);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
