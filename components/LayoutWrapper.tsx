"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useWishlistStore } from "@/store/wishlist";

import CartDrawer from "./CartDrawer";
import GoogleOneTap from "./GoogleOneTap";

interface LayoutWrapperProps {
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

function PageViewTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    // 1. Generate/retrieve unique guest ID in localStorage
    let guestId = localStorage.getItem("guest_id");
    if (!guestId) {
      guestId =
        "guest_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      localStorage.setItem("guest_id", guestId);
    }

    // 2. Identify if user is admin client-side
    const userEmail = session?.user?.email || "";
    const userRole = session?.user?.role || "";
    const isAdmin =
      userRole === "admin" ||
      userRole === "worker" ||
      userEmail.toLowerCase().includes("admin");

    // Don't track admin panel pages or admin users
    const isAdminPage = pathname?.startsWith("/admin");
    if (isAdmin || isAdminPage) {
      return;
    }

    const logPageView = async () => {
      try {
        await fetch("/api/tracking/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "page_view",
            email: userEmail || null,
            metadata: {
              pathname: pathname || "/",
              guestId,
            },
          }),
        });
      } catch (err) {
        console.error("Failed to log page view:", err);
      }
    };

    logPageView();
  }, [pathname, session]);

  return null;
}

export default function LayoutWrapper({
  children,
}: LayoutWrapperProps) {
  const pathname = usePathname();

  // Don't show navbar/footer on admin or auth pages
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname?.startsWith("/auth");

  const shouldShowLayout = !isAdminPage && !isAuthPage;

  return (
      <>
      {shouldShowLayout && <GoogleOneTap />}
      <WishlistInitializer />
      <Suspense><ReferralTracker /></Suspense>
      <PageViewTracker />
      <CartDrawer />
      {shouldShowLayout ? (
        <>
          <Navbar />
          {children}
          <Footer />
        </>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
