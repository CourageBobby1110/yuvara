"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

import CartDrawer from "./CartDrawer";

interface LayoutWrapperProps {
  session: any;
  children: React.ReactNode;
}

export default function LayoutWrapper({
  session,
  children,
}: LayoutWrapperProps) {
  const pathname = usePathname();

  // Don't show navbar/footer on admin or auth pages
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  const shouldShowLayout = !isAdminPage && !isAuthPage;

  return (
    <SessionProvider session={session}>
      <CurrencyProvider>
        <CartDrawer />
        {shouldShowLayout ? (
          <>
            <Navbar session={session} />
            {children}
            <Footer />
          </>
        ) : (
          <>{children}</>
        )}
      </CurrencyProvider>
    </SessionProvider>
  );
}
