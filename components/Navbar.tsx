"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import CurrencySelector from "@/components/CurrencySelector";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./Navbar.module.css";

interface NavbarProps {
  session: any;
}

export default function Navbar({ session }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openCart, totalItems } = useCartStore();
  const [itemCount, setItemCount] = useState(0);
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Hydration fix for cart count
  useEffect(() => {
    setItemCount(totalItems());
  }, [totalItems]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?search=${encodeURIComponent(searchQuery)}`);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.png"
              alt="Yuvara"
              width={40}
              height={40}
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          </Link>

          {/* Desktop Menu */}
          <div className={styles.desktopMenu}>
            <Link href="/collections" className={styles.navLink}>
              {t("nav.shop")}
            </Link>
            <Link href="/about" className={styles.navLink}>
              {t("nav.about")}
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            {session?.user ? (
              <div className={styles.userActions}>
                {session.user?.role === "admin" && (
                  <Link href="/admin/dashboard" className={styles.navLink}>
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/wishlist"
                  className={styles.iconLink}
                  title="Favorites"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </Link>
                <Link href="/orders" className={styles.navLink}>
                  Orders
                </Link>
                <Link
                  href="/profile"
                  className={styles.profileImageContainer}
                  title="Edit Profile"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className={styles.profileImage}
                    />
                  ) : (
                    <span className={styles.profilePlaceholder}>
                      {session.user?.name?.[0] ||
                        session.user?.email?.[0] ||
                        "U"}
                    </span>
                  )}
                </Link>
                <Link href="/dashboard/referrals" className={styles.navLink}>
                  Referrals
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={styles.signOutBtn}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/signin" className={styles.navLink}>
                {t("nav.signin")}
              </Link>
            )}

            <div className={styles.utilityBar}>
              <LanguageSwitcher />
              <CurrencySelector />

              <button onClick={openCart} className={styles.cartButton}>
                <span className={styles.cartLabel}>Cart</span>
                {itemCount > 0 && (
                  <span className={styles.cartBadge}>{itemCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className={styles.mobileControls}>
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={styles.mobileSearchBtn}
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <button onClick={openCart} className={styles.mobileCartBtn}>
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span
                  className={styles.cartBadge}
                  style={{ top: "-8px", right: "-8px" }}
                >
                  {itemCount}
                </span>
              )}
            </button>

            <button
              onClick={toggleMenu}
              className={styles.menuToggle}
              aria-label="Toggle menu"
            >
              <div className={styles.hamburger}>
                <span
                  className={`${styles.line} ${
                    isMenuOpen ? styles.lineTopOpen : ""
                  }`}
                ></span>
                <span
                  className={`${styles.line} ${
                    isMenuOpen ? styles.lineMiddleOpen : ""
                  }`}
                ></span>
                <span
                  className={`${styles.line} ${
                    isMenuOpen ? styles.lineBottomOpen : ""
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Expandable) */}
        {isMobileSearchOpen && (
          <div className={styles.mobileSearchBar}>
            <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.mobileSearchInput}
                autoFocus
              />
              <button type="submit" className={styles.mobileSearchSubmit}>
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenu} ${
          isMenuOpen ? styles.mobileMenuOpen : ""
        }`}
      >
        <div className={styles.mobileMenuContent}>
          <Link
            href="/collections"
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Collection
          </Link>
          <Link
            href="/about"
            className={styles.mobileNavLink}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>

          <div className={styles.divider}></div>

          {session?.user ? (
            <>
              <Link
                href="/profile"
                className={styles.mobileProfileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                <div
                  className={styles.profileImageContainer}
                  style={{ width: "3rem", height: "3rem" }}
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className={styles.profileImage}
                    />
                  ) : (
                    <span
                      className={styles.profilePlaceholder}
                      style={{ fontSize: "1.25rem" }}
                    >
                      {session.user?.name?.[0] ||
                        session.user?.email?.[0] ||
                        "U"}
                    </span>
                  )}
                </div>
                <div className={styles.mobileProfileInfo}>
                  <h3>{session.user?.name || "User"}</h3>
                  <p>{session.user?.email}</p>
                  <p className={styles.editProfileText}>Edit Profile</p>
                </div>
              </Link>

              {session.user?.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className={styles.mobileUserLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/wishlist"
                className={styles.mobileUserLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Favorites
              </Link>
              <Link
                href="/orders"
                className={styles.mobileUserLink}
                onClick={() => setIsMenuOpen(false)}
              >
                My Orders
              </Link>
              <Link
                href="/dashboard/referrals"
                className={styles.mobileUserLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Referrals
              </Link>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/auth/signin" });
                  setIsMenuOpen(false);
                }}
                className={styles.mobileSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          )}

          <div className={styles.divider}></div>

          <div className={styles.mobileUtility}>
            <span className={styles.utilityLabel}>Currency</span>
            <CurrencySelector />
          </div>
        </div>

        <div className={styles.mobileFooter}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Yuvara. All rights reserved.
          </p>
        </div>
      </div>
    </nav>
  );
}
