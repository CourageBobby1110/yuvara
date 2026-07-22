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

function isOneTapBlocked(): boolean {
  try {
    return localStorage.getItem(BLOCK_ONE_TAP_KEY) === "1";
  } catch {
    return false;
  }
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("not browser"));
    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_URL}"]`
    );
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(check);
          resolve();
        }
      }, 100);
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
      }, 100);
    };
    script.onerror = () => reject(new Error("Failed to load GSI script"));
    document.head.appendChild(script);
  });
}

export default function GoogleOneTap() {
  const { status } = useSession();
  const initAttempted = useRef(false);

  // Clean up leftover Google GSI redirect parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (
        url.searchParams.has("iss") ||
        (url.searchParams.has("code") && url.searchParams.has("prompt"))
      ) {
        url.searchParams.delete("iss");
        url.searchParams.delete("code");
        url.searchParams.delete("prompt");
        url.searchParams.delete("scope");
        url.searchParams.delete("authuser");
        const cleanUrl =
          url.pathname +
          (url.searchParams.toString() ? "?" + url.searchParams.toString() : "") +
          url.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "loading" || status === "authenticated") return;

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
          ux_mode: "popup",
          callback: async (response: any) => {
            if (isCancelled || isOneTapBlocked()) return;
            try {
              const result = await signIn("google-one-tap", {
                credential: response.credential,
                redirect: false,
              });
              if (result?.ok) {
                window.location.href = "/";
              }
            } catch (error) {
              console.error("Google One Tap sign-in failed:", error);
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

    timeout = setTimeout(() => {
      isCancelled = true;
    }, 30_000);

    return () => {
      isCancelled = true;
      if (timeout) clearTimeout(timeout);
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      initAttempted.current = false;
    }
  }, [status]);

  return null;
}
