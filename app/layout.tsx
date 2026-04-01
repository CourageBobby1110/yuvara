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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || process.env.URL || "https://yuvara.netlify.app"
  ),
  title: {
    default: "Yuvara | Premium Global Online Shopping",
    template: "%s | Yuvara",
  },
  description:
    "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products. Experience premium quality, global shipping, and exceptional service.",
  keywords: [
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
    title: "Yuvara | Premium Global Online Shopping",
    description:
      "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products. Experience premium quality and global shipping.",
    siteName: "Yuvara",
    images: [
      {
        url: "/logo-v2.svg",
        width: 1200,
        height: 630,
        alt: "Yuvara Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuvara | Premium Global Online Shopping",
    description:
      "Discover Yuvara's exclusive collection of fashion, electronics, and lifestyle products.",
    images: ["/logo-v2.svg"],
    creator: "@yuvara",
  },
  icons: {
    icon: "/icon-v2.svg",
    shortcut: "/icon-v2.svg",
    apple: "/icon-v2.svg",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/icon-v2.svg",
    },
  },
  manifest: "/site.webmanifest",
};

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
  await dbConnect();
  const settings = (await SiteSettings.findOne().lean()) as any;

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
