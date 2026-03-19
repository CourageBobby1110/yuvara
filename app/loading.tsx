"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function Loading() {
  const [isMobileApp, setIsMobileApp] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor environment
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      setIsMobileApp(true);
    }
  }, []);

  if (isMobileApp) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#000000",
          color: "#ffffff",
          textAlign: "center",
          padding: "2rem",
          overflow: "hidden",
        }}
      >
        <div className="logo-container" style={{ position: "relative", marginBottom: "2rem" }}>
          <Image
            src="/logo.png"
            alt="Yuvara"
            width={240}
            height={240}
            priority
            style={{
              objectFit: "contain",
              animation: "fadeIn 1.5s ease-out forwards",
            }}
          />
          <div className="shimmer" />
        </div>
        
        <div style={{ animation: "fadeIn 2s ease-out 0.5s forwards", opacity: 0 }}>
          <p style={{ 
            color: "#996515", 
            fontSize: "1.25rem", 
            letterSpacing: "0.2em", 
            fontWeight: "600",
            textTransform: "uppercase",
            marginBottom: "0.5rem"
          }}>
            YU V A R A
          </p>
          <p style={{ 
            color: "#6b7280", 
            fontSize: "0.875rem", 
            letterSpacing: "0.05em", 
            maxWidth: "280px"
          }}>
            Redefining the modern shopping experience.
          </p>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .logo-container {
            position: relative;
          }
          
          .shimmer {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(153, 101, 21, 0.2),
              transparent
            );
            animation: shimmer 3s infinite;
          }
          
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Standard Web Loading
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid #f3f3f3",
          borderTop: "3px solid #996515",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "1rem",
        }}
      />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", letterSpacing: "0.05em", fontWeight: "500" }}>
        YU V A R A
      </p>
    </div>
  );
}
