"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";

export default function CapacitorHandler() {
  useEffect(() => {
    // Check if we are running on a native platform
    const setupBackButton = async () => {
      try {
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
      App.removeAllListeners();
    };
  }, []);

  return null; // This component doesn't render anything
}
