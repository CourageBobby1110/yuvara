"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestoredMsg, setShowRestoredMsg] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestoredMsg(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRestoredMsg(true);
        // Hide "restored" message after 4 seconds
        setTimeout(() => setShowRestoredMsg(false), 4000);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  if (!mounted) return null;

  // Nothing to show when online and no restored message
  if (isOnline && !showRestoredMsg) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0.75rem 1.25rem",
        borderRadius: "9999px",
        background: isOnline ? "#166534" : "#1a1a1a",
        color: "#fff",
        fontSize: "0.85rem",
        fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
        animation: "slideUp 0.3s ease",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: isOnline ? "#4ade80" : "#ef4444",
          display: "inline-block",
          flexShrink: 0,
          animation: !isOnline ? "blink 1.2s infinite" : "none",
        }}
      />

      {isOnline ? (
        "✓ Back online"
      ) : (
        <>
          No internet connection — please check your network
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
