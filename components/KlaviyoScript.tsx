"use client";

import Script from "next/script";
import { useSession } from "next-auth/react";

export default function KlaviyoScript({ id }: { id?: string }) {
  const { data: session } = useSession();
  const publicApiKey = id || process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;

  const userEmail = session?.user?.email || "";
  const userRole = session?.user?.role || "";
  const isAdmin =
    userRole === "admin" ||
    userRole === "worker" ||
    userEmail.toLowerCase().includes("admin");

  if (!publicApiKey || isAdmin) return null;

  return (
    <Script
      id="klaviyo-script"
      strategy="afterInteractive"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${publicApiKey}`}
    />
  );
}
