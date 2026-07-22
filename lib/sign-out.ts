"use client";

import { signOut } from "next-auth/react";

/**
 * Fully clears the app session AND Google One Tap auto-select state,
 * then hard-navigates to the sign-in page so no stale React/Router
 * cache can resurrect the previous account in the navbar.
 */
export async function hardSignOut(callbackUrl = "/auth/signin") {
  try {
    // Prevent Google One Tap from immediately re-signing the previous account
    sessionStorage.setItem("yuvara_just_signed_out", String(Date.now()));
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore Google cleanup errors */
  }

  // Clear NextAuth session without redirecting first
  await signOut({ redirect: false });

  // Hard navigation wipes Next.js client Router Cache completely
  window.location.assign(callbackUrl);
}
