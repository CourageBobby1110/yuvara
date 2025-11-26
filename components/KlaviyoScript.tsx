"use client";

import Script from "next/script";

export default function KlaviyoScript({ id }: { id?: string }) {
  const publicApiKey = id || process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;

  if (!publicApiKey) return null;

  return (
    <Script
      id="klaviyo-script"
      strategy="afterInteractive"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${publicApiKey}`}
    />
  );
}
