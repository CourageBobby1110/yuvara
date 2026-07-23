import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Middleware (Next.js 16 "proxy").
 *
 * Runs at the edge (CDN level), before any route handler. This is the ONLY
 * place where Set-Cookie response headers are guaranteed to reach the
 * browser — a route handler sitting behind the CDN may have its Set-Cookie
 * headers stripped by Netlify's proxy layer.
 *
 * For this reason the `/api/signout` endpoint is handled HERE instead of
 * in a route handler.
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

/**
 * Build the raw Set-Cookie header strings that expire a cookie.
 * Middleware must use `response.headers.append("Set-Cookie", ...)` instead
 * of `response.cookies.set()` because the latter overwrites cookies with
 * the *same name* — we need MULTIPLE expiring Set-Cookie entries per name
 * (different domain/secure combinations) to cover www / apex / .apex.
 */
function expireCookieStrings(name: string, host: string): string[] {
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

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, searchParams } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // ── Signout at the edge ─────────────────────────────────────────────
  // The CDN sets the cookie directly — it cannot strip its own Set-Cookie.
  if (pathname === "/api/signout") {
    const callbackUrl = searchParams.get("callbackUrl") || "/auth/signin";
    const host = req.headers.get("host") || "";
    const response = NextResponse.redirect(
      new URL(callbackUrl, req.nextUrl.origin)
    );

    for (const name of AUTH_COOKIE_NAMES) {
      for (const cs of expireCookieStrings(name, host)) {
        response.headers.append("Set-Cookie", cs);
      }
    }

    return response;
  }

  // ── Admin area ───────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    if (role !== "admin" && role !== "worker") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    if (role === "worker" && pathname.startsWith("/admin/settings")) {
      return NextResponse.redirect(
        new URL("/admin/worker-settings", req.nextUrl.origin)
      );
    }
    return NextResponse.next();
  }

  // ── Auth pages: already signed-in users go home ──────────────────────
  if (
    isLoggedIn &&
    (pathname === "/auth/signin" || pathname === "/auth/signup")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
