import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.emailVerified = (user as any).emailVerified;
        token.referralCode = (user as any).referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).referralCode = token.referralCode;
      }
      return session;
    },
    authorized({ auth, request: nextUrl }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.nextUrl.pathname.startsWith("/admin");
      const isAuthPage = nextUrl.nextUrl.pathname.startsWith("/auth");
      const isApiAuthRoute = nextUrl.nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuthRoute) {
        return true;
      }

      if (isAuthPage) {
        return true;
      }

      if (isOnDashboard) {
        if (!isLoggedIn) {
          return false; // Redirect to login
        }
        if ((auth?.user as any)?.role !== "admin") {
          return Response.redirect(new URL("/", nextUrl.nextUrl));
        }
      }

      return true;
    },
  },
  providers: [], // Providers are configured in auth.ts
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
