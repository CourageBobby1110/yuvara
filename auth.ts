import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import NodemailerProvider from "next-auth/providers/nodemailer";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    NodemailerProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
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
    async signIn({ user, account }) {
      // After email verification, redirect to homepage
      if (account?.provider === "nodemailer") {
        return "/";
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // Run the edge-safe jwt callback first
      if (authConfig.callbacks?.jwt) {
        token = await authConfig.callbacks.jwt({ token, user, trigger } as any);
      }

      // Always sync with DB if token.id is present to ensure latest roles and profile data
      if (token.id) {
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
