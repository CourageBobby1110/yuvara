import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware (Next.js 16 "proxy") — Pass-through.
 *
 * Edge authentication checking in middleware is completely bypassed to prevent
 * Netlify CDN Edge proxies from caching stale session tokens or intercepting
 * sign-out / Google account chooser redirects.
 *
 * Authentication & authorization are enforced cleanly in Node.js Server Components
 * (e.g. app/admin/layout.tsx using `await auth()`) and NextAuth API endpoints.
 */
export function proxy(req: NextRequest) {
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)"],
};
