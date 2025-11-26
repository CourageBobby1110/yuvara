"use server";

import { signOut, signIn } from "@/auth";

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}

import { AuthError } from "next-auth";

export async function handleSignIn(formData: FormData) {
  try {
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
