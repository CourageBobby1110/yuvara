"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { BLOCK_ONE_TAP_KEY } from "@/lib/sign-out";

declare global {
  interface Window {
    google?: any;
  }
}

function isOneTapBlocked(): boolean {
  try {
    return localStorage.getItem(BLOCK_ONE_TAP_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Google One Tap — DISABLED after sign-out until the user clicks
 * "Sign in with Google" (which clears BLOCK_ONE_TAP_KEY).
 *
 * Root cause of "account clears then comes back": after signOut,
 * status becomes unauthenticated → this effect ran → One Tap
 * silently signed the same Google account back in.
 */
export default function GoogleOneTap() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading" || status === "authenticated") return;

    // After intentional sign-out: never auto-prompt or auto-login
    if (isOneTapBlocked()) {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
          window.google.accounts.id.cancel();
        }
      } catch {
        /* ignore */
      }
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let isCancelled = false;
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id || isCancelled) return;
      if (isOneTapBlocked()) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (isCancelled) return;
            // Last line of defense — never re-login after sign-out
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
          // FedCM can auto-restore the previous account — keep it off after our issues
          use_fedcm_for_prompt: false,
          context: "signin",
        });

        window.google.accounts.id.prompt();
      } catch (err) {
        console.error("Failed to initialize Google One Tap:", err);
      }
    };

    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeOneTap();
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 100);
    }

    return () => {
      isCancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [status]);

  return null;
}
