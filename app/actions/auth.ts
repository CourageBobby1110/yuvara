"use server";

import { signOut, signIn } from "@/auth";

export async function handleSignOut() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    if ((error as Error).message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign out error:", error);
    throw error;
  }
}

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { AuthError } from "next-auth";

export async function handleSignIn(formData: FormData) {
  const email = formData.get("email") as string;
  
  try {
    if (email) {
      await dbConnect();
      const user = await User.findOne({ 
        email: { $regex: new RegExp(`^${email.trim()}$`, "i") } 
      });
      if (user && user.password && !user.emailVerified) {
        return { error: "Please verify your email before logging in." };
      }
    }
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong." };
      }
    }
    // Next.js Redirect throws an error, so we need to rethrow it
    if ((error as Error).message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign in error:", error);
    throw error;
  }
}
