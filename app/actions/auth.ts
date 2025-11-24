"use server";

import { signOut, signIn } from "@/auth";

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}

export async function handleSignIn(formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if ((error as Error).message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign in error:", error);
    throw error;
  }
}
