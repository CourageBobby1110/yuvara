"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useSession } from "next-auth/react";

interface FacebookPixelProps {
  id?: string;
}

export default function FacebookPixel({ id }: FacebookPixelProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const userRole = session?.user?.role || "";
  const isAdmin = userRole === "admin" || userRole === "worker";

  const pixelId = id || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

  useEffect(() => {
    if (!pixelId || isAdmin) return;

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams, isAdmin, pixelId]);

  if (!pixelId || isAdmin) return null;

  return (
    <Script
      id="fb-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}
