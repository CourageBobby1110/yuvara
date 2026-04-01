"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { handleSignOut } from "@/app/actions/auth";
import { useCartStore } from "@/store/cart";
import CurrencySelector from "@/components/CurrencySelector";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Navbar.module.css";

interface NavbarProps {
  session: any;
}

export default function Navbar({ session }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const { totalItems, toggleCart } = useCartStore();
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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

  const items = useCartStore((state) => state.items);
  // Hydration fix for cart count
  useEffect(() => {
    setItemCount(totalItems());
  }, [items, totalItems]);

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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?search=${encodeURIComponent(searchQuery)}`);
      setIsMobileSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo-v2.svg"
              alt="YuVara"
              width={150}
              height={40}
              priority
              style={{ objectFit: "contain" }}
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
              <div className={styles.searchIconWrapper}>
                <svg
                  width="18"
                  height="18"
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
              </div>
              <input
                type="text"
                placeholder="Search premium products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </form>

            <div className={styles.utilityBar}>
              <LanguageSwitcher />
              <CurrencySelector />

              {session?.user ? (
                <div className={styles.accountWrapper}>
                  <button
                    onClick={() =>
                      setIsAccountDropdownOpen(!isAccountDropdownOpen)
                    }
                    className={styles.accountTrigger}
                  >
                    <div className={styles.profileImageContainer}>
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
                <Link href="/auth/signin" className={styles.navLink}>
                  {t("nav.signin")}
                </Link>
              )}

              <button onClick={toggleCart} className={styles.cartButton}>
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
                    strokeWidth="2.2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className={styles.cartLabel}>Cart</span>
                {itemCount > 0 && (
                  <span className={styles.cartBadge}>{itemCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className={styles.mobileControls}>
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className={styles.mobileSearchBtn}
              aria-label="Search"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button onClick={toggleCart} className={styles.mobileCartBtn} aria-label="Cart">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
            </button>

            <button
              onClick={toggleMenu}
              className={styles.menuToggle}
              aria-label="Toggle menu"
            >
              <div className={styles.hamburger}>
                <span className={`${styles.line} ${isMenuOpen ? styles.lineTopOpen : ""}`}></span>
                <span className={`${styles.line} ${isMenuOpen ? styles.lineMiddleOpen : ""}`}></span>
                <span className={`${styles.line} ${isMenuOpen ? styles.lineBottomOpen : ""}`}></span>
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
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`${styles.mobileMenu} ${styles.mobileMenuOpen}`}
          >
            <div className={styles.mobileMenuContent}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link href="/collections" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                  Collection
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Link href="/about" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={styles.divider}
              ></motion.div>

              {session?.user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-col gap-4"
                >
                  <Link href="/profile" className={styles.mobileProfileLink} onClick={() => setIsMenuOpen(false)}>
                    <div className={styles.profileImageContainer}>
                      {session.user?.image ? (
                        <img src={session.user.image} alt={session.user.name || "User"} className={styles.profileImage} />
                      ) : (
                        <span className={styles.profilePlaceholder}>
                          {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                        </span>
                      )}
                    </div>
                    <div className={styles.mobileProfileInfo}>
                      <h3 className="font-bold text-base m-0 leading-tight">{session.user?.name || "User"}</h3>
                      <p className="text-xs opacity-60 m-0 mt-1 truncate max-w-[200px]">{session.user?.email}</p>
                      <p className={styles.editProfileText}>View Profile</p>
                    </div>
                  </Link>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {session.user?.role === "admin" && (
                      <Link href="/admin/dashboard" className={styles.mobileUserLink} onClick={() => setIsMenuOpen(false)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mb-2">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Dashboard
                      </Link>
                    )}
                    <Link href="/wishlist" className={styles.mobileUserLink} onClick={() => setIsMenuOpen(false)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Favorites
                    </Link>
                    <Link href="/orders" className={styles.mobileUserLink} onClick={() => setIsMenuOpen(false)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Orders
                    </Link>
                    <Link href="/dashboard/referrals" className={styles.mobileUserLink} onClick={() => setIsMenuOpen(false)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Referrals
                    </Link>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className={styles.mobileSignOut}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link href="/auth/signin" className={styles.mobileNavLink} onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className={styles.divider}
              ></motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={styles.mobileUtility}
              >
                <LanguageSwitcher />
                <CurrencySelector variant="flowing" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={styles.mobileFooter}
            >
              <p className={styles.copyright}>
                © {new Date().getFullYear()} Yuvara Premium Lifestyle.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
