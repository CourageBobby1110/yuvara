import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@uploadthing/react/styles.css";
import { SessionProvider as AuthProvider } from "next-auth/react";
import { auth } from "@/auth";
import LayoutWrapper from "@/components/LayoutWrapper";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Yuvara - Luxury Footwear",
  description:
    "Discover the pinnacle of luxury footwear. Handcrafted for the distinguished.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider session={session}>
              <LayoutWrapper session={session}>{children}</LayoutWrapper>
              <Toaster position="bottom-right" />
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
