"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

interface AnalyticsBlockerProps {
  gaId?: string;
}

export default function AnalyticsBlocker({ gaId }: AnalyticsBlockerProps) {
  const { data: session } = useSession();

  useEffect(() => {
    const userEmail = session?.user?.email || "";
    const userRole = session?.user?.role || "";
    const isAdmin =
      userRole === "admin" ||
      userRole === "worker" ||
      userEmail.toLowerCase().includes("admin");

    if (isAdmin) {
      // 1. Opt-out Google Analytics
      if (gaId) {
        (window as any)[`ga-disable-${gaId}`] = true;
        console.log(`[AnalyticsBlocker] Google Analytics (${gaId}) disabled for admin user.`);
      }

      // 2. Intercept Facebook Pixel
      if ((window as any).fbq) {
        (window as any).fbq = function (...args: any[]) {
          console.log("[AnalyticsBlocker] FB Pixel tracking blocked for admin:", args);
        };
      } else {
        (window as any).fbq = function (...args: any[]) {
          console.log("[AnalyticsBlocker] FB Pixel tracking blocked for admin:", args);
        };
      }

      // 3. Intercept TikTok Pixel
      if ((window as any).ttq) {
        const originalTtq = (window as any).ttq;
        (window as any).ttq = {
          ...originalTtq,
          page: () => console.log("[AnalyticsBlocker] TikTok page track blocked for admin"),
          track: (...args: any[]) => console.log("[AnalyticsBlocker] TikTok track blocked for admin:", args),
        };
      } else {
        (window as any).ttq = {
          page: () => console.log("[AnalyticsBlocker] TikTok page track blocked for admin"),
          track: (...args: any[]) => console.log("[AnalyticsBlocker] TikTok track blocked for admin:", args),
        };
      }

      // 4. Intercept Klaviyo
      if ((window as any).klaviyo) {
        if (Array.isArray((window as any).klaviyo)) {
          (window as any).klaviyo.push = function (args: any) {
            console.log("[AnalyticsBlocker] Klaviyo track blocked for admin:", args);
            return 0;
          };
        } else {
          (window as any).klaviyo = {
            push: (args: any) => {
              console.log("[AnalyticsBlocker] Klaviyo track blocked for admin:", args);
            },
          };
        }
      } else {
        (window as any).klaviyo = {
          push: (args: any) => {
            console.log("[AnalyticsBlocker] Klaviyo track blocked for admin:", args);
          },
        };
      }
    }
  }, [session, gaId]);

  return null;
}
