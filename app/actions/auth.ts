"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * Credentials sign-in server action.
 *
 * Pre-checks the account so the UI can show precise messages (e.g. email not
 * verified), then delegates to NextAuth. On success NextAuth throws a
 * NEXT_REDIRECT which must be re-thrown.
 */
export async function handleSignIn(formData: FormData) {
  const email = (formData.get("email") as string | null)?.toLowerCase().trim();

  try {
    if (email) {
      await dbConnect();
      const user = await User.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
      });
      if (user && user.password && !user.emailVerified) {
        return { error: "Please verify your email before logging in." };
      }
    }

    await signIn("credentials", formData);
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        case "CallbackRouteError":
          return { error: "Couldn't complete sign-in. Please try again." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    // Successful sign-in triggers a redirect which surfaces as an error here.
    if ((error as Error)?.message?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Sign in error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
