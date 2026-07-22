import { NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = [
  // next-auth v5 (current)
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  // next-auth v4 legacy
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

/**
 * Server-side sign-out redirect.
 *
 * The browser NAVIGATES here (not a fetch), so Set-Cookie headers in the
 * redirect response are guaranteed to be processed by the browser before
 * the destination page loads.
 *
 * This avoids the race where a client-side fetch + useSession revalidation
 * beats the cookie-clearing response back to the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const res = NextResponse.redirect(callbackUrl);

  const isProd = process.env.NODE_ENV === "production";

  for (const name of AUTH_COOKIE_NAMES) {
    const secure = name.startsWith("__Secure-") || name.startsWith("__Host-") || isProd;

    let cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    if (secure) cookie += "; Secure";
    // Intentionally no Domain attribute so the cookie is scoped to the exact
    // origin — matches how next-auth sets it by default.

    res.headers.append("Set-Cookie", cookie);
  }

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
