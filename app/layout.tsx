import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
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

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || process.env.URL || "https://yuvara.netlify.app"
  ),
  title: {
    default: "Yuvara - Global Online Shopping",
    template: "%s | Yuvara",
  },
  description:
    "Shop the latest trends in fashion, electronics, and more at Yuvara. Global shipping, premium quality, and unbeatable prices.",
  keywords: [
    "Yuvara",
    "Online Shopping",
    "Fashion",
    "Electronics",
    "Global Shipping",
    "Deals",
  ],
  authors: [{ name: "Yuvara" }],
  creator: "Yuvara",
  publisher: "Yuvara",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Yuvara - Global Online Shopping",
    description:
      "Shop the latest trends in fashion, electronics, and more at Yuvara.",
    siteName: "Yuvara",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuvara - Global Online Shopping",
    description:
      "Shop the latest trends in fashion, electronics, and more at Yuvara.",
    creator: "@yuvara",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import FacebookPixel from "@/components/FacebookPixel";
import KlaviyoScript from "@/components/KlaviyoScript";
import TikTokPixel from "@/components/TikTokPixel";
import ReferralHandler from "@/components/ReferralHandler";

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
        className={`${openSans.variable} antialiased font-sans`}
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
      </body>
    </html>
  );
}
