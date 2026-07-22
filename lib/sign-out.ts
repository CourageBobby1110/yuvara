"use client";

import { signOut } from "next-auth/react";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Server-side cookie deletion — HttpOnly cookies can ONLY be cleared from the
 * server.  This runs BEFORE `signOut()` so that by the time useSession
 * background-revalidates, the stale __Secure- cookie is already gone.
 *
 * Root cause: next-auth v5 beta.30 may not clear __Secure-authjs.session-token
 * on HTTPS (production), which causes useSession to restore the old session.
 */
async function clearServerCookies(): Promise<void> {
  try {
    await fetch("/api/auth/clear-session", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    /* ignore */
  }
}

/**
 * Sign out in place (no redirect to login):
 * 1. Block Google One Tap so it cannot silently re-login the old account
 * 2. Clear HttpOnly cookies on the server FIRST (before signOut triggers revalidation)
 * 3. Clear NextAuth session (navbar updates immediately)
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

  // 1. Clear server cookies FIRST so useSession revalidation finds nothing
  await clearServerCookies();

  // 2. NextAuth session → null (navbar shows Sign In immediately)
  try {
    await signOut({ redirect: false });
  } catch {
    /* continue */
  }

  // 3. Cancel One Tap again
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
