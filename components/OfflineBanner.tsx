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
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "0.65rem 1.25rem",
        borderRadius: "9999px",
        background: isOnline 
          ? "rgba(22, 101, 52, 0.95)" 
          : "rgba(18, 18, 18, 0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: isOnline 
          ? "1px solid rgba(74, 222, 128, 0.2)" 
          : "1px solid rgba(255, 255, 255, 0.08)",
        color: "#ffffff",
        fontSize: "0.78rem",
        fontWeight: 500,
        letterSpacing: "0.03em",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        whiteSpace: "nowrap",
        width: "auto",
        maxWidth: "95%",
        boxSizing: "border-box",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isOnline ? "#4ade80" : "#ff4d4d",
          display: "inline-block",
          flexShrink: 0,
          boxShadow: isOnline 
            ? "0 0 8px #4ade80" 
            : "0 0 8px #ff4d4d",
          animation: !isOnline ? "blink 1.2s infinite" : "none",
        }}
      />

      {isOnline ? (
        "Back online"
      ) : (
        "No internet connection. Please check your network"
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
