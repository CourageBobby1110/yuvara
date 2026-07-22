import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { authConfig } from "./auth.config";

function generateUserReferralCode(name: string) {
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${random}`;
}

// Find or create a user from a Google profile using Mongoose directly.
// This unifies Google OAuth with the rest of the app (One Tap, credentials)
// and avoids the MongoDB adapter's account-linking bugs entirely.
async function findOrCreateGoogleUser(profile: {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}) {
  const email = (profile.email || "").toLowerCase().trim();
  if (!email) return null;

  await dbConnect();
  let dbUser = await User.findOne({
    email: { $regex: new RegExp(`^${email}$`, "i") },
  });

  if (!dbUser) {
    dbUser = await User.create({
      email,
      name: profile.name || email.split("@")[0],
      image: profile.picture || "",
      role: "user",
      emailVerified: new Date(),
      referralCode: generateUserReferralCode(profile.name || email),
    });
  } else {
    // Keep the identity in sync with the Google account that just signed in.
    let changed = false;
    if (profile.name && dbUser.name !== profile.name) {
      dbUser.name = profile.name;
      changed = true;
    }
    if (profile.picture && dbUser.image !== profile.picture) {
      dbUser.image = profile.picture;
      changed = true;
    }
    if (!dbUser.emailVerified) {
      dbUser.emailVerified = new Date();
      changed = true;
    }
    if (changed) await dbUser.save();
  }

  return dbUser;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        credential: { label: "Credential", type: "text" },
      },
      async authorize(credentials) {
        await dbConnect();

        // 1. Check if it's Google One Tap Login
        if (credentials?.credential) {
          try {
            const tokeninfoRes = await fetch(
              `https://oauth2.googleapis.com/tokeninfo?id_token=${credentials.credential}`
            );
            if (!tokeninfoRes.ok) {
              console.error("Google One Tap verification failed at Google API");
              return null;
            }
            const payload = await tokeninfoRes.json();
            if (!payload.email) {
              console.error("Google token payload did not contain email");
              return null;
            }

            const email = payload.email.toLowerCase().trim();
            let user = await User.findOne({ email });

            if (!user) {
              const userName = payload.name || email.split("@")[0];
              const newReferralCode = generateUserReferralCode(userName);

              user = await User.create({
                email,
                name: userName,
                image: payload.picture || "",
                role: "user",
                referralCode: newReferralCode,
                emailVerified: new Date(), // verified by Google
              });
            }

            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.image,
              referralCode: user.referralCode,
            };
          } catch (err) {
            console.error("Google One Tap authorize exception:", err);
            return null;
          }
        }

        // 2. Standard credentials login
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim();

        const user = await User.findOne({ 
          email: { $regex: new RegExp(`^${email}$`, "i") } 
        }).select("+password");

        if (!user || !user.password) {
          return null;
        }

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isMatch) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          referralCode: user.referralCode,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Google OAuth: resolve the user by email via Mongoose and attach the
      // DB identity so the JWT/session always reflect the account just used.
      if (account?.provider === "google") {
        const dbUser = await findOrCreateGoogleUser(profile ?? {});
        if (!dbUser) return false;
        user.id = dbUser._id.toString();
        user.name = dbUser.name;
        user.image = dbUser.image;
        (user as any).role = dbUser.role;
        (user as any).emailVerified = dbUser.emailVerified;
        (user as any).referralCode = dbUser.referralCode;
        return true;
      }
      return true;
    },
    async jwt({ token, user, trigger, account }) {
      // Base config first (copies user fields onto the token on sign-in).
      if (authConfig.callbacks?.jwt) {
        token = await authConfig.callbacks.jwt({ token, user, trigger } as any);
      }

      // On a fresh sign-in, resolve the DB user by the account's email so the
      // session ALWAYS matches the identity that was just used to sign in.
      const signInEmail = (user?.email || (token.email as string) || "").toLowerCase();
      if (trigger === "signIn" && signInEmail) {
        try {
          await dbConnect();
          const dbUser = (await User.findOne({
            email: { $regex: new RegExp(`^${signInEmail}$`, "i") },
          }).lean()) as any;
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.name = dbUser.name || "";
            token.image = dbUser.image || "";
            token.emailVerified = dbUser.emailVerified;
            token.referralCode = dbUser.referralCode;
          }
        } catch (error) {
          console.error("JWT sign-in resolve error:", error);
        }
      } else if (token.id) {
        // Subsequent requests: refresh from DB by id.
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id).lean() as any;
          if (dbUser) {
            token.emailVerified = dbUser.emailVerified;
            token.referralCode = dbUser.referralCode;
            token.role = dbUser.role;
            token.image = dbUser.image || "";
            token.name = dbUser.name || "";
          }
        } catch (error) {
          console.error("JWT sync error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (authConfig.callbacks?.session) {
        session = await authConfig.callbacks.session({ session, token } as any);
      }
      return session;
    },
  },
});
