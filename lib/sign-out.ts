"use client";

import { signIn, signOut } from "next-auth/react";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Switch account helper — triggers Google's account chooser directly or redirects to sign-in with switch=1
 */
export async function switchAccount(callbackUrl: string = "/") {
  try {
    localStorage.setItem(BLOCK_ONE_TAP_KEY, "1");
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  // Triggers OAuth loop with Google's prompt=select_account
  await signIn("google", { callbackUrl });
}

/**
 * Perform a clean, direct sign-out.
 *
 * Clears local state, disables Google One Tap, and removes the session directly
 * using NextAuth's client-side signOut without proxy routing.
 */
export async function hardSignOut(targetUrl: string = "/auth/signin") {
  // ── 1. Disable Google GSI & cancel pending prompts ───────────────────
  try {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
      (window as any).google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // ── 2. Block One Tap until the user signs in again ───────────────────
  try {
    localStorage.setItem(BLOCK_ONE_TAP_KEY, "1");
  } catch {
    /* ignore */
  }

  // ── 3. Clear session storage ────────────────────────────────────────
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  // ── 4. Direct NextAuth sign out ─────────────────────────────────────
  await signOut({ callbackUrl: targetUrl });
}
