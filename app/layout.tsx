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
import { cache } from "react";
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
  const settings = (await getSettings()) as any;
  const verificationGoogle = settings?.googleSiteVerification || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "";

  return {
    metadataBase: new URL(
      process.env.NEXTAUTH_URL || process.env.URL || "https://yuvara.com.ng"
    ),
    title: {
      default: "YuVara Nigeria | Premium Global Online Shopping",
      template: "%s | YuVara Nigeria",
    },
    description:
      "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products. Experience premium quality, global shipping, and exceptional service.",
    keywords: [
      "YuVara Nigeria",
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
    applicationName: "YuVara Nigeria",
    other: {
      "apple-mobile-web-app-title": "YuVara Nigeria",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      title: "YuVara Nigeria | Premium Global Online Shopping",
      description:
        "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products. Experience premium quality and global shipping.",
      siteName: "YuVara Nigeria",
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
      title: "YuVara Nigeria | Premium Global Online Shopping",
      description:
        "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products.",
      images: ["/icon.png"],
      creator: "@yuvara",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        { url: "/icon.png", sizes: "192x192", type: "image/png" },
      ],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const settings = (await getSettings()) as any;

  const gaId =
    settings?.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID || "";
  const gtmId =
    settings?.googleTagManagerId || process.env.NEXT_PUBLIC_GTM_ID || "";
  const klaviyoId =
    settings?.klaviyoPublicKey || process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
  const tiktokId =
    settings?.tiktokPixelId || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider session={session}>
              <LayoutWrapper session={session}>{children}</LayoutWrapper>
              <Toaster position="bottom-right" />
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <GoogleAnalytics gaId={gaId} />
        <GoogleTagManager gtmId={gtmId} />
        <FacebookPixel />
        <KlaviyoScript id={klaviyoId} />
        <TikTokPixel id={tiktokId} />
        <ReferralHandler />
        <CapacitorHandler />
      </body>
    </html>
  );
}
