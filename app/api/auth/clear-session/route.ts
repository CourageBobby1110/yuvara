import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

/**
 * Server-side session wipe. HttpOnly cookies can ONLY be cleared from the server.
 * Called by hardSignOut on the client after NextAuth signOut.
 */
export async function POST() {
  const store = await cookies();
  const res = NextResponse.json({ ok: true });

  const isProd = process.env.NODE_ENV === "production";

  for (const name of AUTH_COOKIE_NAMES) {
    try {
      store.delete(name);
    } catch {
      /* ignore */
    }

    // Explicit Set-Cookie expire headers (belt-and-suspenders for proxies/CDNs)
    const secure = name.startsWith("__Secure-") || name.startsWith("__Host-") || isProd;
    const hostOnly = name.startsWith("__Host-");

    let cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    if (secure) cookie += "; Secure";
    if (hostOnly) {
      // __Host- cookies must not set Domain
    }
    res.headers.append("Set-Cookie", cookie);
  }

  // Also expire any auth-looking cookies currently present
  for (const c of store.getAll()) {
    const lower = c.name.toLowerCase();
    if (
      lower.includes("authjs") ||
      lower.includes("next-auth") ||
      lower.includes("session-token")
    ) {
      try {
        store.delete(c.name);
      } catch {
        /* ignore */
      }
      let cookie = `${c.name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      if (isProd) cookie += "; Secure";
      res.headers.append("Set-Cookie", cookie);
    }
  }

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
