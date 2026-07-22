"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleOneTap() {
  const { status } = useSession();

  useEffect(() => {
    // Only prompt if user is NOT authenticated
    if (status === "loading" || status === "authenticated") return;

    // Skip One Tap right after an intentional sign-out (prevents old account reappearing)
    try {
      const justSignedOut = sessionStorage.getItem("yuvara_just_signed_out");
      if (justSignedOut) {
        const ts = Number(justSignedOut);
        // Suppress One Tap for 2 minutes after sign-out
        if (Date.now() - ts < 2 * 60 * 1000) {
          if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
            window.google.accounts.id.cancel();
          }
          return;
        }
        sessionStorage.removeItem("yuvara_just_signed_out");
      }
    } catch {
      /* ignore */
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google One Tap: NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is missing.");
      return;
    }

    let isCancelled = false;
    let checkInterval: NodeJS.Timeout | null = null;

    const initializeOneTap = () => {
      if (!window.google?.accounts?.id || isCancelled) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (isCancelled) return;
            try {
              // Sign in using our credentials provider in auth.ts
              await signIn("credentials", {
                credential: response.credential,
                redirect: true,
                callbackUrl: "/",
              });
            } catch (error) {
              console.error("Google One Tap login failed:", error);
            }
          },
          auto_select: false, // User selects account
          cancel_on_tap_outside: true,
          itp_support: true, // Enable Intelligent Tracking Prevention support for Edge/Safari
          use_fedcm_for_prompt: true, // Enable FedCM for reliable modern browser support on desktop/mobile
          context: "signup", // Use signup context to encourage frictionless registration
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (isCancelled) return;
          if (notification.isNotDisplayed()) {
            console.log("One Tap not displayed:", notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.log("One Tap skipped:", notification.getSkippedReason());
          }
        });
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
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (e) {
          // Safe fallback
        }
      }
    };
  }, [status]);

  return null;
}
