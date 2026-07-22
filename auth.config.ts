import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth configuration.
 *
 * This file MUST stay free of Node-only imports (mongoose, bcrypt, fetch to
 * Google, ...) because it is bundled into the middleware (proxy.ts).
 * The full provider list and DB-backed callbacks live in auth.ts.
 *
 * The jwt/session callbacks below are pure token <-> session mappers with no
 * database access, so `req.auth.user` carries id/role inside the middleware.
 */
export const authConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy the resolved user's fields onto the token.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name ?? "";
        token.image = user.image ?? "";
        token.emailVerified = (user as any).emailVerified;
        token.referralCode = (user as any).referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).referralCode = token.referralCode;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.image as string) ?? session.user.image;
      }
      return session;
    },
  },
  providers: [], // Providers are configured in auth.ts
} satisfies NextAuthConfig;
