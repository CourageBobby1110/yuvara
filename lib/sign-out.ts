"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Perform a clean hard sign-out:
 * 1. Disables Google One Tap auto-select.
 * 2. Invokes NextAuth's native client signOut() via 200 OK POST request.
 * 3. Hits fallback custom /api/signout for domain cookie deletion.
 * 4. Forces full window navigation to clear React context & router cache.
 */
export async function hardSignOut(targetUrl: string = "/auth/signin") {
  // 1. Disable Google GSI auto-select immediately
  try {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // 2. Block Google One Tap immediately
  try {
    localStorage.setItem(BLOCK_ONE_TAP_KEY, "1");
  } catch {
    /* ignore */
  }

  // 3. Clear session storage
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  // 4. Call NextAuth built-in client signout via POST request to /api/auth/signout
  try {
    await nextAuthSignOut({ redirect: false });
  } catch (err) {
    console.error("NextAuth signOut error:", err);
  }

  // 5. Call custom signout endpoint as additional cleanup fallback
  try {
    await fetch("/api/signout", {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    /* ignore */
  }

  // 6. Force full browser window navigation to clear React context & Next.js router cache
  window.location.href = targetUrl;
}
