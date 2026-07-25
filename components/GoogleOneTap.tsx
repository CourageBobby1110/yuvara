"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BLOCK_ONE_TAP_KEY } from "@/lib/sign-out";
import styles from "./GoogleOneTap.module.css";

declare global {
  interface Window {
    google?: any;
  }
}

const GSI_URL = "https://accounts.google.com/gsi/client";
const WIDGET_DISMISSED_KEY = "yuvara_gsi_widget_dismissed";
const WIDGET_DISMISSED_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function isOneTapBlocked(): boolean {
  try {
    return localStorage.getItem(BLOCK_ONE_TAP_KEY) === "1";
  } catch {
    return false;
  }
}

function isWidgetDismissed(): boolean {
  try {
    const val = localStorage.getItem(WIDGET_DISMISSED_KEY);
    if (!val) return false;
    const dismissedAt = parseInt(val, 10);
    if (Date.now() - dismissedAt > WIDGET_DISMISSED_EXPIRY) {
      localStorage.removeItem(WIDGET_DISMISSED_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function dismissWidget() {
  try {
    localStorage.setItem(WIDGET_DISMISSED_KEY, Date.now().toString());
  } catch {}
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
      setTimeout(() => {
        clearInterval(check);
        reject(new Error("GSI script load timeout"));
      }, 10000);
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
      setTimeout(() => {
        clearInterval(check);
        reject(new Error("GSI init timeout"));
      }, 10000);
    };
    script.onerror = () => reject(new Error("Failed to load GSI script"));
    document.head.appendChild(script);
  });
}

function GoogleSignInWidget({ onSignIn }: { onSignIn: (credential: string) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(isWidgetDismissed());
  }, []);

  useEffect(() => {
    if (dismissed) return;

    let cancelled = false;

    loadGsiScript().then(() => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (!cancelled) onSignIn(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
        use_fedcm_for_prompt: false,
        context: "signin",
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 280,
      });

      setGsiReady(true);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [dismissed, onSignIn]);

  if (dismissed) return null;

  return (
    <div className={styles.widget}>
      <button
        className={styles.closeBtn}
        onClick={() => { dismissWidget(); setDismissed(true); }}
        aria-label="Dismiss"
      >
        ×
      </button>
      <p className={styles.message}>
        Sign in for faster checkout &amp; order tracking
      </p>
      <div className={styles.buttonWrap} ref={buttonRef} />
    </div>
  );
}

export default function GoogleOneTap() {
  const { status } = useSession();
  const pathname = usePathname();
  const initAttempted = useRef(false);
  const [showWidget, setShowWidget] = useState(false);

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

  // Show the floating widget after 3 seconds if not authenticated
  useEffect(() => {
    if (status === "authenticated" || status === "loading") {
      setShowWidget(false);
      return;
    }
    if (isOneTapBlocked() || isWidgetDismissed()) {
      setShowWidget(false);
      return;
    }
    const timer = setTimeout(() => setShowWidget(true), 3000);
    return () => clearTimeout(timer);
  }, [status, pathname]);

  // Reset init flag on route change so One Tap re-triggers on every page
  useEffect(() => {
    initAttempted.current = false;
  }, [pathname]);

  // One Tap prompt (silent)
  useEffect(() => {
    if (status === "loading" || status === "authenticated") return;

    if (isOneTapBlocked()) {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.disableAutoSelect();
          window.google.accounts.id.cancel();
        }
      } catch {}
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
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              setShowWidget(true);
            }
          });
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
      } catch {}
    };
  }, [status, pathname]);

  useEffect(() => {
    if (status === "authenticated") {
      initAttempted.current = false;
      setShowWidget(false);
    }
  }, [status]);

  const handleWidgetSignIn = async (credential: string) => {
    try {
      const result = await signIn("google-one-tap", {
        credential,
        redirect: false,
      });
      if (result?.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Google widget sign-in failed:", error);
    }
  };

  if (status !== "unauthenticated") return null;

  return showWidget ? (
    <GoogleSignInWidget onSignIn={handleWidgetSignIn} />
  ) : null;
}
