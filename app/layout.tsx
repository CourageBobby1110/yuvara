import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@uploadthing/react/styles.css";
import { SessionProvider as AuthProvider } from "next-auth/react";
import { auth } from "@/auth";
import LayoutWrapper from "@/components/LayoutWrapper";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { Toaster } from "sonner";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { cache, Suspense } from "react";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const getSettings = cache(async () => {
  await dbConnect();
  return await SiteSettings.findOne().lean();
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await getSettings()) as { googleSiteVerification?: string } | null;
  const verificationGoogle = settings?.googleSiteVerification || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "";

  return {
    metadataBase: new URL(
      process.env.NEXTAUTH_URL || process.env.URL || "https://yuvara.com.ng"
    ),
    title: {
      default: "YuVara | Premium Global Online Shopping",
      template: "%s | YuVara",
    },
    description:
      "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products. Experience premium quality, global shipping, and exceptional service.",
    keywords: [
      "YuVara",
      "Yuvara",
      "Premium Shopping",
      "Fashion",
      "Electronics",
      "Global Shipping",
      "Luxury",
      "Online Store",
      "Online Shopping",
    ],
    authors: [{ name: "Yuvara Team" }],
    creator: "Yuvara",
    publisher: "Yuvara",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      title: "YuVara | Premium Global Online Shopping",
      description:
        "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products. Experience premium quality and global shipping.",
      siteName: "YuVara",
      images: [
        {
          url: "/icon.png",
          width: 1200,
          height: 630,
          alt: "Yuvara Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "YuVara | Premium Global Online Shopping",
      description:
        "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products.",
      images: ["/icon.png"],
      creator: "@yuvara",
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
      other: {
        rel: "apple-touch-icon-precomposed",
        url: "/icon.png",
      },
    },
    manifest: "/site.webmanifest",
    verification: verificationGoogle ? {
      google: verificationGoogle,
    } : undefined,
  };
}

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import FacebookPixel from "@/components/FacebookPixel";
import KlaviyoScript from "@/components/KlaviyoScript";
import TikTokPixel from "@/components/TikTokPixel";
import ReferralHandler from "@/components/ReferralHandler";
import CapacitorHandler from "@/components/CapacitorHandler";
import OfflineBanner from "@/components/OfflineBanner";
import AnalyticsBlocker from "@/components/AnalyticsBlocker";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch (e: any) {
    if (e?.digest === "DYNAMIC_SERVER_USAGE") throw e;
    console.error("[Layout] auth() error:", e);
  }
  let settings = null;
  try {
    settings = (await getSettings()) as {
      googleAnalyticsId?: string;
      googleTagManagerId?: string;
      klaviyoPublicKey?: string;
      tiktokPixelId?: string;
      facebookPixelId?: string;
    } | null;
  } catch (e) {
    console.error("[Layout] getSettings() error:", e);
  }

  // Get GA ID - prefer database value, fallback to env variable
  const gaId = settings?.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID || "";
  const gtmId = settings?.googleTagManagerId || process.env.NEXT_PUBLIC_GTM_ID || "";
  const klaviyoId = settings?.klaviyoPublicKey || process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
  const tiktokId = settings?.tiktokPixelId || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const fbPixelId = settings?.facebookPixelId || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

  const userRole = session?.user?.role || "";
  const isAdmin = userRole === "admin" || userRole === "worker";
  const forceAnalytics = process.env.NEXT_PUBLIC_FORCE_ANALYTICS === "true";

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider session={session}>
              <AnalyticsBlocker gaId={gaId} forceAnalytics={forceAnalytics} />
              <LayoutWrapper session={session}>{children}</LayoutWrapper>
              <Toaster position="bottom-right" />
              <OfflineBanner />
              {(!isAdmin || forceAnalytics) && gaId && <GoogleAnalytics gaId={gaId} />}
              {(!isAdmin || forceAnalytics) && gtmId && <GoogleTagManager gtmId={gtmId} />}
              {!isAdmin && <Suspense><FacebookPixel id={fbPixelId} /></Suspense>}
              {!isAdmin && <KlaviyoScript id={klaviyoId} />}
              {!isAdmin && <Suspense><TikTokPixel id={tiktokId} /></Suspense>}
              <Suspense><ReferralHandler /></Suspense>
              <CapacitorHandler />
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
