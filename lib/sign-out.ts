"use client";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Sign out using a server-side redirect that clears cookies during navigation.
 *
 * This is the most reliable approach because:
 * 1. Set-Cookie headers in the redirect response are processed by the browser
 *    BEFORE the new page loads — no race with useSession revalidation.
 * 2. The new page has zero auth cookies → useSession immediately returns null.
 * 3. Google One Tap reads the localStorage flag on the new page and stays
 *    suppressed.
 *
 * Root cause of "account comes back after sign-out":
 *   On HTTPS (production), next-auth's built-in signOut may fail to clear
 *   __Secure-authjs.session-token. A client-side fetch to clear cookies
 *   has a race condition where useSession revalidates before the Set-Cookie
 *   response is processed by the browser.
 */
export async function hardSignOut() {
  // Block Google One Tap immediately
  try {
    localStorage.setItem(BLOCK_ONE_TAP_KEY, "1");
  } catch {
    /* ignore */
  }

  // Navigate to the force-signout endpoint which:
  // 1. Clears ALL auth cookies server-side
  // 2. Redirects back to the current page (just the path, no query params to avoid encoding issues)
  // 3. The fresh page load has no cookies → user is signed out
  // Navigate to /api/signout (NOT under /api/auth/ — next-auth's [...nextauth] catch-all
  // would swallow that route and error).  The server clears all auth cookies via
  // Set-Cookie in the 302 response, then the browser redirects back here clean.
  window.location.href = `/api/signout?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
}
