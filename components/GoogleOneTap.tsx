"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Script from "next/script";

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

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google One Tap: NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is missing.");
      return;
    }

    let checkInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const initializeOneTap = () => {
      if (!window.google || isCancelled) return;

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

    // If script is already loaded, initialize immediately
    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeOneTap();
          if (checkInterval) clearInterval(checkInterval);
        }
      }, 500);
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

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
    />
  );
}
