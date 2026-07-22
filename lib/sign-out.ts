"use client";

import { signOut } from "next-auth/react";

/**
 * Sign out in place:
 * - clears the NextAuth session (navbar updates immediately via useSession)
 * - clears HttpOnly cookies via a server route (JS cannot delete those)
 * - disables Google One Tap auto-select
 * - does NOT redirect to login
 * - reloads the current page so a refresh stays signed-out
 */
export async function hardSignOut() {
  try {
    sessionStorage.setItem("yuvara_just_signed_out", String(Date.now()));
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // 1. NextAuth: invalidate session + update React SessionProvider → navbar goes to "Sign In"
  try {
    await signOut({ redirect: false });
  } catch {
    /* continue */
  }

  // 2. Server: expire HttpOnly session cookies (document.cookie cannot touch these)
  try {
    await fetch("/api/auth/clear-session", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    /* continue */
  }

  // 3. Stay on the same page, full reload so server auth() also returns null
  window.location.reload();
}
