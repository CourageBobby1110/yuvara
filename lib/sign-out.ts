"use client";

import { signOut } from "next-auth/react";

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function expireCookie(name: string, domain?: string) {
  const base = `${name}=; Max-Age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  if (domain) {
    document.cookie = `${base}; domain=${domain}`;
  } else {
    document.cookie = base;
  }
  // Secure cookies on HTTPS
  document.cookie = `${base}; Secure; SameSite=Lax${domain ? `; domain=${domain}` : ""}`;
}

/** Wipe every NextAuth / Auth.js cookie the browser may still hold. */
function clearAuthCookies() {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const domains = [
    undefined, // host-only
    hostname,
    `.${hostname}`,
  ];

  // Also try parent domain (e.g. .yuvara.com.ng)
  const parts = hostname.split(".");
  if (parts.length > 2) {
    domains.push(`.${parts.slice(-2).join(".")}`);
    domains.push(`.${parts.slice(-3).join(".")}`);
  }

  for (const name of AUTH_COOKIE_NAMES) {
    for (const domain of domains) {
      expireCookie(name, domain);
    }
  }

  // Catch-all: expire any leftover auth-related cookies by name match
  try {
    const all = document.cookie.split(";");
    for (const raw of all) {
      const name = raw.split("=")[0]?.trim();
      if (!name) continue;
      const lower = name.toLowerCase();
      if (
        lower.includes("authjs") ||
        lower.includes("next-auth") ||
        lower.includes("session-token") ||
        lower.includes("csrf-token")
      ) {
        for (const domain of domains) {
          expireCookie(name, domain);
        }
      }
    }
  } catch {
    /* ignore */
  }
}

/**
 * Fully clears the app session, auth cookies, and Google One Tap state,
 * then hard-navigates so no stale cache can restore the previous account.
 */
export async function hardSignOut(callbackUrl = "/auth/signin") {
  try {
    sessionStorage.setItem("yuvara_just_signed_out", String(Date.now()));
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    /* ignore Google cleanup errors */
  }

  // 1. Ask NextAuth to invalidate the session server-side
  try {
    await signOut({ redirect: false });
  } catch {
    /* continue — we still clear cookies client-side */
  }

  // 2. Force-clear every auth cookie in the browser immediately
  clearAuthCookies();

  // 3. Hard navigation wipes Next.js client Router Cache completely
  window.location.assign(callbackUrl);
}
