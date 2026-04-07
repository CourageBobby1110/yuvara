import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthPage) {
    return null;
  }

  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
    }
    const role = (req.auth?.user as any)?.role;
    const isMainSettingsPage = req.nextUrl.pathname.startsWith("/admin/settings");

    if (role === "worker" && isMainSettingsPage) {
      return NextResponse.redirect(new URL("/admin/worker-settings", req.nextUrl));
    }

    if (role !== "admin" && role !== "worker") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return null;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
