"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { trackFBEvent, initMetaCookies } from "@/lib/fb-pixel";

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
    // Capture _fbc (from fbclid query param preserving case) and _fbp as early as possible
    initMetaCookies();

    if (!pixelId || isAdmin) return;

    const userData = session?.user
      ? {
          email: session.user.email || undefined,
          firstName: session.user.name?.split(" ")[0] || undefined,
          lastName: session.user.name?.split(" ").slice(1).join(" ") || undefined,
          userId: session.user.id || undefined,
        }
      : undefined;

    // Track PageView on route change via hybrid Pixel + CAPI
    trackFBEvent("PageView", {}, userData);
  }, [pathname, searchParams, isAdmin, pixelId, session]);

  if (!pixelId || isAdmin) return null;

  return (
    <>
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
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
