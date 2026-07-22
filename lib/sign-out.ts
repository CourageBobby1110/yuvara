"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Perform a clean hard sign-out:
 * 1. Disable Google GSI auto-select & cancel any pending prompt.
 * 2. Set One-Tap block flag.
 * 3. Clear sessionStorage.
 * 4. NextAuth client signOut (clears SessionProvider state, POST to
 *    /api/auth/signout to remove the session cookie on the current host).
 * 5. Hit the fallback /api/signout which scrubs auth cookies across every
 *    domain variant (apex, www, .apex) so sign-out works regardless of
 *    which host the user is on (production www vs apex).
 * 6. Hard-navigate to `targetUrl` to flush React context and router cache.
 */
export async function hardSignOut(targetUrl: string = "/auth/signin") {
  // 1. Disable Google GSI
  try {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // 2. Block One Tap
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

  // 4. Native NextAuth signout
  try {
    await nextAuthSignOut({ redirect: false });
  } catch (err) {
    console.error("NextAuth signOut error:", err);
  }

  // 5. Fallback cookie scrub (cross-domain safety net)
  try {
    await fetch("/api/signout", {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    /* ignore */
  }

  // 6. Full page navigation
  window.location.href = targetUrl;
}
