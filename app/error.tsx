"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Detect network state on mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Determine if this is a network-related error
  const isNetworkError =
    !isOnline ||
    error?.message?.toLowerCase().includes("network") ||
    error?.message?.toLowerCase().includes("fetch") ||
    error?.message?.toLowerCase().includes("failed to fetch") ||
    error?.message?.toLowerCase().includes("load failed") ||
    error?.message?.toLowerCase().includes("networkerror") ||
    error?.message?.toLowerCase().includes("internet");

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: isNetworkError ? "#fef3c7" : "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "2rem",
            }}
          >
            {isNetworkError ? "📶" : "⚠️"}
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 0.75rem",
            }}
          >
            {isNetworkError
              ? "No Internet Connection"
              : "Something went wrong"}
          </h1>

          {/* Message */}
          <p
            style={{
              fontSize: "1rem",
              color: "#6b7280",
              maxWidth: "400px",
              lineHeight: 1.6,
              margin: "0 0 2rem",
            }}
          >
            {isNetworkError
              ? "It looks like your internet connection is weak or unavailable. Please check your connection and try again."
              : "An unexpected error occurred. Please try refreshing the page or go back to the homepage."}
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                background: "#bfa15f",
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                padding: "0.75rem 1.75rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              style={{
                background: "#fff",
                color: "#111827",
                border: "1.5px solid #e5e7eb",
                borderRadius: "9999px",
                padding: "0.75rem 1.75rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              Go to Homepage
            </button>
          </div>

          {/* Online status badge */}
          <div
            style={{
              marginTop: "2.5rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              color: isOnline ? "#16a34a" : "#dc2626",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isOnline ? "#16a34a" : "#dc2626",
                display: "inline-block",
                animation: !isOnline ? "pulse 1.5s infinite" : "none",
              }}
            />
            {isOnline ? "You are back online" : "No internet connection"}
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}</style>
        </div>
      </body>
    </html>
  );
}
