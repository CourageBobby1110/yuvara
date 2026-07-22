import { DefaultSession } from "next-auth";

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
    id?: string;
    role?: string;
    emailVerified?: Date;
    referralCode?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    image?: string;
    emailVerified?: Date;
    referralCode?: string;
  }
}
