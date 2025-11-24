
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin")
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")

  if (isApiAuthRoute) {
    return null
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
    return null
  }

  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.nextUrl))
    }
    if ((req.auth?.user as any)?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
  }

  return null
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
