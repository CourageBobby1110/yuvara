"use client";

import { useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { BLOCK_ONE_TAP_KEY } from "@/lib/sign-out";

declare global {
  interface Window {
    google?: any;
  }
}

const GSI_URL = "https://accounts.google.com/gsi/client";
const POLL_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 100;

function isOneTapBlocked(): boolean {
  try {
    return localStorage.getItem(BLOCK_ONE_TAP_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Dynamically load the Google GSI script. Returns a promise that resolves
 * when `window.google?.accounts?.id` becomes available.
 */
function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("not browser"));

    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_URL}"]`);
    if (existing) {
      // Wait for it to finish loading
      const check = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(check);
          resolve();
        }
      }, POLL_INTERVAL_MS);
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(check);
          resolve();
        }
      }, POLL_INTERVAL_MS);
    };
    script.onerror = () => reject(new Error("Failed to load GSI script"));
    document.head.appendChild(script);
  });
}

export default function GoogleOneTap() {
  const { status } = useSession();
  const initAttempted = useRef(false);

  useEffect(() => {
    if (status === "loading" || status === "authenticated") return;

    if (isOneTapBlocked()) {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
          window.google.accounts.id.cancel();
        }
      } catch { /* ignore */ }
      return;
    }

    // Only attempt initialization once per unauthenticated session
    if (initAttempted.current) return;
    initAttempted.current = true;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let isCancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const initializeOneTap = async () => {
      try {
        await loadGsiScript();
      } catch (err) {
        console.error("GSI script load failed:", err);
        return;
      }

      if (isCancelled || isOneTapBlocked()) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (isCancelled) return;
            if (isOneTapBlocked()) return;
            try {
              await signIn("credentials", {
                credential: response.credential,
                redirect: true,
                callbackUrl: "/",
              });
            } catch (error) {
              console.error("Google One Tap login failed:", error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: false,
          context: "signin",
        });

        if (!isCancelled) {
          window.google.accounts.id.prompt();
        }
      } catch (err) {
        console.error("Failed to initialize Google One Tap:", err);
      }
    };

    initializeOneTap();

    // Safety timeout — stop waiting after 30 seconds
    timeout = setTimeout(() => {
      isCancelled = true;
    }, POLL_TIMEOUT_MS);

    return () => {
      isCancelled = true;
      if (timeout) clearTimeout(timeout);
      try {
        window.google?.accounts?.id?.cancel();
      } catch { /* ignore */ }
    };
  }, [status]);

  // Reset the ref when user becomes authenticated or the block is lifted
  useEffect(() => {
    if (status === "authenticated") {
      initAttempted.current = false;
    }
  }, [status]);

  return null;
}
