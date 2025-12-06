"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./HeroNavbar.module.css";
import { handleSignOut } from "@/app/actions/auth";
import { useCartStore } from "@/store/cart";
import CurrencySelector from "./CurrencySelector";

import { Session } from "next-auth";

interface HeroNavbarProps {
  session: Session | null;
}

export default function HeroNavbar({ session }: HeroNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openCart, totalItems } = useCartStore();
  const [itemCount, setItemCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Hydration fix for cart count
  useEffect(() => {
    setItemCount(totalItems());
  }, [totalItems]);

  // Handle scroll for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={styles.container}>
      <Image
        src="/hero-shoe.png"
        alt="Luxury Sneaker"
        fill
        className={styles.backgroundImage}
        priority
        quality={100}
      />

      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
            alt="Yuvara"
            width={90}
            height={30}
            style={{ objectFit: "contain" }}
          />
        </Link>

        <button
          className={`${styles.hamburger} ${isMenuOpen ? styles.open : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`${styles.menu} ${isMenuOpen ? styles.active : ""}`}>
          <Link
            href="/collections"
            className={styles.link}
            onClick={() => setIsMenuOpen(false)}
          >
            Collection
          </Link>
          <Link
            href="/about"
            className={styles.link}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>

          {session ? (
            <>
              {session.user?.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className={styles.link}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/wishlist"
                className={styles.link}
                onClick={() => setIsMenuOpen(false)}
                title="Favorites"
              >
                Wishlist
              </Link>
              <Link
                href="/orders"
                className={styles.link}
                onClick={() => setIsMenuOpen(false)}
              >
                Orders
              </Link>
              <div
                className={styles.userAvatar}
                title={session.user?.email || ""}
              >
                {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
              </div>
              <Link
                href="/dashboard/referrals"
                className={styles.link}
                onClick={() => setIsMenuOpen(false)}
              >
                Referrals
              </Link>
              <button onClick={() => handleSignOut()} className={styles.link}>
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className={styles.link}
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          )}

          <div className={styles.currencyWrapper}>
            <CurrencySelector theme={scrolled ? "light" : "dark"} />
          </div>

          <button className={`${styles.link} relative`} onClick={openCart}>
            Cart
            {itemCount > 0 && (
              <span
                className={`absolute -top-2 -right-2 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                  scrolled ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className={styles.heroContent}>
        <h1 className={styles.headline}>
          Elegance <br />
          <span style={{ fontStyle: "italic", fontFamily: "serif" }}>
            Redefined
          </span>
        </h1>
        <p className={styles.subheadline}>
          Discover the pinnacle of luxury footwear. Handcrafted for the
          distinguished. Experience the future of fashion with Yuvara.
        </p>
        <Link href="/collections" className={styles.ctaButton}>
          Shop Collection
        </Link>
      </div>
    </div>
  );
}
