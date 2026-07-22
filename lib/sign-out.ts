"use client";

/** localStorage key — blocks Google One Tap until the user explicitly signs in again */
export const BLOCK_ONE_TAP_KEY = "yuvara_block_onetap";

/**
 * Sign out using a server-side redirect that clears cookies during navigation.
 * Also disables Google GSI auto-select to prevent instant re-login.
 */
export async function hardSignOut() {
  // Disable Google GSI auto-select immediately
  try {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore */
  }

  // Block Google One Tap immediately
  try {
    localStorage.setItem(BLOCK_ONE_TAP_KEY, "1");
  } catch {
    /* ignore */
  }

  // Clear session storage if any
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  // Navigate to /api/signout
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  window.location.href = `/api/signout?callbackUrl=${encodeURIComponent(currentPath)}`;
}
