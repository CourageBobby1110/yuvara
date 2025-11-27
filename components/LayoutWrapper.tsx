"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useWishlistStore } from "@/store/wishlist";

import CartDrawer from "./CartDrawer";

interface LayoutWrapperProps {
  session: any;
  children: React.ReactNode;
}

function WishlistInitializer() {
  const { data: session } = useSession();
  const { fetchWishlist } = useWishlistStore();

  useEffect(() => {
    if (session?.user) {
      fetchWishlist();
    }
  }, [session, fetchWishlist]);

  return null;
}

function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("affiliate_ref", ref);
      // Optional: Set a cookie too if needed for server-side
      document.cookie = `affiliate_ref=${ref}; path=/; max-age=2592000`; // 30 days
    }
  }, [searchParams]);

  return null;
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
        <WishlistInitializer />
        <ReferralTracker />
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
