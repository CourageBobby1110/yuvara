import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import NodemailerProvider from "next-auth/providers/nodemailer";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      },
      async authorize(credentials) {
        await dbConnect();

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

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

      // Refresh emailVerified status on session update
      if (trigger === "update" && token.id) {
        await dbConnect();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.emailVerified = dbUser.emailVerified;
          token.referralCode = dbUser.referralCode;
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
