import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  findOrCreateGoogleUser,
  findUserByEmail,
  serializeAuthUser,
} from "@/lib/auth-helpers";
import { authConfig } from "./auth.config";

/**
 * NextAuth (Auth.js v5) — single source of truth for the web auth flow.
 *
 * Providers:
 *  1. "google"          — standard OAuth redirect flow (sign-in page button).
 *  2. "credentials"     — email + password.
 *  3. "google-one-tap"  — Google One Tap / GSI ID-token sign-in. Kept as a
 *                         SEPARATE credentials provider so it can never clash
 *                         with password logins.
 *
 * Sessions are stateless JWTs; the jwt callback below keeps them in sync with
 * MongoDB (role changes, deleted accounts, profile edits).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // ── 1. Google OAuth ────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // ── 2. Email + password ────────────────────────────────────────────
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const email = (credentials.email as string).toLowerCase().trim();
        const user = await User.findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") },
        }).select("+password");

        if (!user || !user.password) return null;

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isMatch) return null;

        // Defense in depth — the sign-in form surfaces a friendly message
        // via a pre-check; direct POSTs to the callback simply fail.
        if (!user.emailVerified) return null;

        return serializeAuthUser(user);
      },
    }),

    // ── 3. Google One Tap (ID token from the GSI client) ───────────────
    Credentials({
      id: "google-one-tap",
      name: "Google One Tap",
      credentials: {
        credential: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.credential) return null;

        try {
          // Verify the ID token with Google.
          const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${credentials.credential}`
          );
          if (!res.ok) return null;
          const payload = await res.json();

          // Audience check — reject tokens minted for a different client.
          const clientId =
            process.env.GOOGLE_CLIENT_ID ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
          if (!clientId || payload.aud !== clientId) {
            console.error("One Tap: audience mismatch");
            return null;
          }
          if (payload.email_verified !== "true" || !payload.email) {
            return null;
          }

          const dbUser = await findOrCreateGoogleUser({
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          });
          if (!dbUser) return null;

          return serializeAuthUser(dbUser);
        } catch (err) {
          console.error("Google One Tap authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // Resolve the DB identity for OAuth sign-ins so the JWT/session always
    // reflect the exact account that just signed in.
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Never trust an unverified Google email.
        if ((profile as any)?.email_verified === false) return false;

        const dbUser = await findOrCreateGoogleUser({
          email: profile?.email,
          name: profile?.name,
          picture: (profile as any)?.picture,
        });
        if (!dbUser) return false;

        const authUser = serializeAuthUser(dbUser);
        user.id = authUser.id;
        user.name = authUser.name;
        user.image = authUser.image;
        (user as any).role = authUser.role;
        (user as any).emailVerified = authUser.emailVerified;
        (user as any).referralCode = authUser.referralCode;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Base mapping (edge-safe) copies user fields onto the token on sign-in.
      if (authConfig.callbacks?.jwt) {
        token = (await authConfig.callbacks.jwt({ token, user, trigger } as any)) as typeof token;
      }

      // Fresh sign-in: resolve the DB user by the signing-in email so the
      // session ALWAYS matches whoever just signed in — never a stale account.
      const signInEmail = (user?.email || "").toLowerCase().trim();
      if (user && signInEmail) {
        try {
          const dbUser = await findUserByEmail(signInEmail);
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.name = dbUser.name || "";
            token.image = dbUser.image || "";
            token.emailVerified = dbUser.emailVerified;
            token.referralCode = dbUser.referralCode;
          }
        } catch (error) {
          // DB hiccup during sign-in — fall back to the provider's identity
          // rather than failing the login.
          console.error("JWT sign-in resolve error:", error);
        }
        return token;
      }

      // Subsequent requests (and explicit session updates): refresh from the
      // DB by id so role/profile changes propagate.
      if (token.id) {
        try {
          await dbConnect();
          const dbUser = (await User.findById(token.id).lean()) as any;
          if (dbUser) {
            token.role = dbUser.role;
            token.name = dbUser.name || "";
            token.image = dbUser.image || "";
            token.emailVerified = dbUser.emailVerified;
            token.referralCode = dbUser.referralCode;
          } else {
            // Account was deleted — invalidate the session token.
            delete token.id;
            delete token.role;
            delete token.email;
            delete token.name;
            delete token.image;
            delete token.emailVerified;
            delete token.referralCode;
          }
        } catch (error) {
          // Transient DB errors must NOT log the user out — keep the token.
          console.error("JWT sync error:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (authConfig.callbacks?.session) {
        session = (await authConfig.callbacks.session({ session, token } as any)) as typeof session;
      }
      return session;
    },
  },
});
