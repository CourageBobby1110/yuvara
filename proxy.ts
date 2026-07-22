import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Middleware (Next.js 16 "proxy").
 *
 * Runs on the edge-safe authConfig only — no database access here.
 * Responsibilities:
 *  - /admin/*   → require a session; require admin/worker role.
 *  - /auth/signin & /auth/signup → bounce already-authenticated users home.
 *  - everything else (incl. /api/auth/*) → pass through untouched.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

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
