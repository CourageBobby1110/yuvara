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
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const { totalItems, openCart } = useCartStore();
  const [itemCount, setItemCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.accountWrapper}`)) {
        setIsAccountDropdownOpen(false);
      }
    };
    if (isAccountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccountDropdownOpen]);

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
            src={scrolled ? "/logo-v2.svg" : "/logo-white-v2.svg"}
            alt="YuVara"
            width={150}
            height={40}
            priority
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
            <div className={styles.accountWrapper}>
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className={styles.accountTrigger}
              >
                <div className={styles.userAvatar}>
                  {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                </div>
                <span className={styles.accountLabel}>Account</span>
                <svg
                  className={`${styles.chevron} ${
                    isAccountDropdownOpen ? styles.chevronOpen : ""
                  }`}
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isAccountDropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.userName}>
                      {session.user?.name || "User"}
                    </p>
                    <p className={styles.userEmail}>{session.user?.email}</p>
                  </div>
                  <div className={styles.dropdownContent}>
                    {session.user?.role === "admin" && (
                      <Link
                        href="/admin/dashboard"
                        className={styles.dropdownLink}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className={styles.dropdownLink}
                      onClick={() => setIsAccountDropdownOpen(false)}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className={styles.dropdownLink}
                      onClick={() => setIsAccountDropdownOpen(false)}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      My Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className={styles.dropdownLink}
                      onClick={() => setIsAccountDropdownOpen(false)}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Favorites
                    </Link>
                    <Link
                      href="/dashboard/referrals"
                      className={styles.dropdownLink}
                      onClick={() => setIsAccountDropdownOpen(false)}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Referrals
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`${styles.dropdownLink} ${styles.signOutLink}`}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
