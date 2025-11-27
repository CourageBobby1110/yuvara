import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      emailVerified?: Date;
      referralCode?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    emailVerified?: Date;
    referralCode?: string;
  }
}
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: string;
  }
}
