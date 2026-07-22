"use client";

import { signOut } from "next-auth/react";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Sign out in place (no redirect to login):
 * 1. Block Google One Tap so it cannot silently re-login the old account
 * 2. Clear NextAuth session (navbar updates immediately)
 * 3. Clear HttpOnly cookies on the server
 * 4. Stay on the current page — account stays gone, including after refresh
 */
export async function hardSignOut() {
  try {
    // PERMANENT until next intentional sign-in — this is what stops the bounce-back
    localStorage.setItem(BLOCK_ONE_TAP_KEY, "1");
    sessionStorage.setItem("yuvara_just_signed_out", String(Date.now()));

    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // 1. NextAuth session → null (navbar shows Sign In immediately)
  try {
    await signOut({ redirect: false });
  } catch {
    /* continue */
  }

  // 2. Server must clear HttpOnly cookies (JS cannot)
  try {
    await fetch("/api/auth/clear-session", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    /* continue */
  }

  // 3. Cancel One Tap again after status flips to unauthenticated
  try {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // NO reload, NO redirect — stay put. Session is gone. One Tap is blocked.
}
