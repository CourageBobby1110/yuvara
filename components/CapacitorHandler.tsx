"use client";

import { useEffect } from "react";

export default function CapacitorHandler() {
  useEffect(() => {
    // Check if we are running on a native platform
    const setupBackButton = async () => {
      try {
        const { App } = await import("@capacitor/app");
        
        await App.addListener("backButton", (data) => {
          if (data.canGoBack) {
            window.history.back();
          } else {
            // If we can't go back in history, minimize the app instead of closing it
            App.minimizeApp();
          }
        });
      } catch (error) {
        console.log("Capacitor App plugin not available - likely running in browser.");
      }
    };

    setupBackButton();

    return () => {
      // Clean up listeners if necessary
      const cleanup = async () => {
        try {
          const { App } = await import("@capacitor/app");
          App.removeAllListeners();
        } catch (e) {}
      };
      cleanup();
    };
  }, []);

  return null; // This component doesn't render anything
}
