"use client";

import { signIn } from "next-auth/react";

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
 * Perform a clean hard sign-out that works on localhost AND production.
 *
 * Strategy:
 *   1. Disable Google GSI and cancel any pending One Tap prompt.
 *   2. Set the One-Tap block flag in localStorage so the user isn't
 *      immediately re-authenticated by GSI on the next page load.
 *   3. Clear sessionStorage.
 *   4. Navigate directly to `/api/signout?callbackUrl=<targetUrl>`.
 *
 *      ⚠️  This is a FULL-PAGE NAVIGATION, NOT a fetch call.
 *      The browser sends a GET to `/api/signout`, our server returns a 302
 *      redirect + Set-Cookie headers that expire every known auth cookie
 *      across all domain variants.
 *
 *      Key advantages over the old fetch‑based approach:
 *        - CDNs (Netlify) forward Set-Cookie on navigation responses — they
 *          DO strip them from `fetch` responses in many configurations.
 *        - The 302 redirect guarantees the browser processes the expire
 *          cookies BEFORE landing on the sign‑in page.
 *        - No CSRF token required.
 *        - No race condition between cookie‑clearing and `window.location.href`.
 */
export async function hardSignOut(targetUrl: string = "/auth/signin?switch=1") {
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

  // ── 4. Full-page navigation: GET → /api/signout → 302 + Set-Cookie → targetUrl ───
  // The browser processes the Set-Cookie during the redirect, so the cookie
  // is guaranteed to be gone when /auth/signin loads.
  const params = new URLSearchParams({ callbackUrl: targetUrl });
  window.location.href = `/api/signout?${params}`;
}
