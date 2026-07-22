"use client";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Perform a clean hard sign-out that works on localhost AND production.
 *
 * Strategy:
 *   1. Synchronously disable Google GSI and block One Tap.
 *   2. Clear sessionStorage.
 *   3. POST to our own `/api/signout` (no CSRF required, always works) —
 *      it returns Set-Cookie headers that expire every known auth cookie
 *      across every domain variant (apex, www, .www).
 *   4. Short delay to guarantee the browser has processed the Set-Cookie
 *      headers before the page unloads.
 *   5. Full `window.location.href` navigation to flush React/Next.js cache.
 *
 * We deliberately do NOT call next-auth/react `signOut()` here:
 *   - It requires a CSRF token fetch that can fail in production (host
 *     header mismatches behind Netlify/CDN proxies).
 *   - The SessionProvider state update it performs is irrelevant because
 *     step 5 destroys the React app anyway.
 *   - Our `/api/signout` clears the *exact* same cookies.
 */
export async function hardSignOut(targetUrl: string = "/auth/signin") {
  // ── 1. Disable Google GSI & cancel pending prompts ───────────────────
  try {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
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

  // ── 4. Cookie scrub (primary mechanism, no CSRF needed) ─────────────
  try {
    await fetch("/api/signout", {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    /* ignore */
  }

  // ── 5. Wait for the browser to process Set-Cookie headers ───────────
  // Without this delay the navigation can outrun the cookie store update,
  // causing the sign-in page to see the old session cookie.
  await new Promise((resolve) => setTimeout(resolve, 400));

  // ── 6. Destroy React app & force a clean server-rendered page ──────
  window.location.href = targetUrl;
}
