"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { hardSignOut, switchAccount } from "@/lib/sign-out";
import { useCartStore } from "@/store/cart";
import { trackFBEvent } from "@/lib/fb-pixel";
import CurrencySelector from "@/components/CurrencySelector";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ShoppingBag, ChevronDown } from "lucide-react";
import styles from "./Navbar.module.css";

const CATEGORY_ITEMS = [
  { name: "Men", slug: "Men" },
  { name: "Women", slug: "Women" },
  { name: "Watches", slug: "Watches" },
  { name: "Jewelry", slug: "Jewelry" },
  { name: "Shoes", slug: "Shoes" },
  { name: "Beauty", slug: "Beauty" },
  { name: "Home", slug: "Home" },
  { name: "Electronics", slug: "Electronics" },
];

const QUICK_PILLS = [
  { label: "Best Sellers", href: "/collections?sort=bestseller" },
  { label: "New In", href: "/collections?sort=newest" },
  { label: "Men", href: "/collections?category=Men" },
  { label: "Women", href: "/collections?category=Women" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const { totalItems, toggleCart } = useCartStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = useCartStore((state) => state.items);
  useEffect(() => {
    setItemCount(totalItems());
  }, [items, totalItems]);

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
      trackFBEvent("Search", { search_string: searchQuery.trim() });
      router.push(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <header className={styles.headerWrapper}>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.navContent}>
            {/* Logo */}
            <Link href="/" className={styles.brandLink}>
              <div className={styles.brandEmblem}>
                <Image
                  src="/icon.png"
                  alt="YuVara"
                  fill
                  sizes="36px"
                  priority
                  className="object-cover"
                />
              </div>
              <span className={styles.brandName}>
                Yu<span className={styles.brandGold}>Vara</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className={styles.navLinksGroup}>
              <Link href="/collections?sort=bestseller" className={styles.navItem}>
                <span>Best Sellers</span>
              </Link>
              <Link href="/collections?sort=rating" className={styles.navItem}>
                <span>Curated Picks</span>
              </Link>
              <Link href="/collections?sort=newest" className={styles.navItem}>
                <span>New Arrivals</span>
              </Link>

              {/* Categories Dropdown */}
              <div className={styles.categoryDropdownWrapper} ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`${styles.categoryTrigger} ${
                    isCategoryDropdownOpen ? styles.categoryTriggerActive : ""
                  }`}
                  aria-expanded={isCategoryDropdownOpen}
                >
                  <span>Categories</span>
                  <ChevronDown
                    size={13}
                    className={`${styles.chevron} ${
                      isCategoryDropdownOpen ? styles.chevronOpen : ""
                    }`}
                    strokeWidth={2.8}
                  />
                </button>

                {isCategoryDropdownOpen && (
                  <div className={styles.categoryMenu}>
                    <div className={styles.categoryMenuHeader}>
                      <span className={styles.categoryHeaderKicker}>Shop by category</span>
                    </div>

                    <div className={styles.categoryGrid}>
                      {CATEGORY_ITEMS.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/collections?category=${encodeURIComponent(cat.slug)}`}
                          className={styles.categoryMenuItem}
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        >
                          <span className={styles.categoryMenuLabel}>{cat.name}</span>
                        </Link>
                      ))}
                    </div>

                    <div className={styles.categoryMenuFooter}>
                      <Link
                        href="/collections"
                        className={styles.allCollectionsFooterLink}
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      >
                        <span>View all collections</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className={styles.searchContainer}>
              <Search size={16} className={styles.searchIcon} strokeWidth={2.6} />
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={styles.clearBtn}
                  aria-label="Clear search"
                >
                  <X size={14} strokeWidth={2.8} />
                </button>
              )}
            </form>

            {/* Desktop Utilities */}
            <div className={styles.utilityGroup}>
              {/* Account Dropdown */}
              <div className={styles.accountWrapper} ref={accountRef}>
                {session?.user ? (
                  <button
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className={styles.accountTrigger}
                    aria-label="Account menu"
                  >
                    <div className={styles.profileAvatar}>
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          className={styles.profileImg}
                        />
                      ) : (
                        <span>
                          {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                        </span>
                      )}
                    </div>
                    <span className={styles.accountName}>
                      {session.user?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`${styles.chevron} ${
                        isAccountDropdownOpen ? styles.chevronOpen : ""
                      }`}
                      strokeWidth={2.8}
                    />
                  </button>
                ) : (
                  <Link href="/auth/signin" className={styles.signInLink}>
                    <span>Sign In</span>
                  </Link>
                )}

                {/* Account Dropdown Menu */}
                {isAccountDropdownOpen && session?.user && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.userName}>{session.user?.name || "User"}</p>
                      <p className={styles.userEmail}>{session.user?.email}</p>
                    </div>
                    <div className={styles.dropdownBody}>
                      {(session.user?.role === "admin" || session.user?.role === "worker") && (
                        <Link
                          href="/admin/dashboard"
                          className={styles.dropdownItem}
                          onClick={() => setIsAccountDropdownOpen(false)}
                        >
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <span>Orders</span>
                      </Link>
                      <Link
                        href="/wishlist"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <span>Wishlist</span>
                      </Link>
                      <Link
                        href="/dashboard/referrals"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <span>Referrals</span>
                      </Link>
                      <button
                        onClick={() => {
                          void switchAccount();
                          setIsAccountDropdownOpen(false);
                        }}
                        className={styles.dropdownItem}
                      >
                        <span>Switch account</span>
                      </button>
                      <button
                        onClick={() => {
                          void hardSignOut();
                          setIsAccountDropdownOpen(false);
                        }}
                        className={`${styles.dropdownItem} ${styles.signOutBtn}`}
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Currency Selector */}
              <div className={styles.currencyWrapper}>
                <CurrencySelector />
              </div>

              {/* Shopping Bag Button */}
              <button
                onClick={toggleCart}
                className={styles.bagButton}
                aria-label="Shopping Bag"
              >
                <div className={styles.bagIconWrap}>
                  <ShoppingBag size={20} strokeWidth={2.6} />
                  {itemCount > 0 && <span className={styles.bagBadge}>{itemCount}</span>}
                </div>
              </button>
            </div>

            {/* Mobile Action Buttons */}
            <div className={styles.mobileActions}>
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className={styles.mobileIconButton}
                aria-label="Search"
              >
                <Search size={20} strokeWidth={2.6} />
              </button>

              <button
                onClick={toggleCart}
                className={styles.mobileIconButton}
                aria-label="Shopping Bag"
              >
                <ShoppingBag size={20} strokeWidth={2.6} />
                {itemCount > 0 && <span className={styles.bagBadge}>{itemCount}</span>}
              </button>

              <button
                onClick={toggleMenu}
                className={styles.menuToggleBtn}
                aria-label="Menu"
              >
                <div className={styles.hamburger}>
                  <span
                    className={`${styles.line} ${isMenuOpen ? styles.lineTopOpen : ""}`}
                  ></span>
                  <span
                    className={`${styles.line} ${isMenuOpen ? styles.lineMiddleOpen : ""}`}
                  ></span>
                  <span
                    className={`${styles.line} ${isMenuOpen ? styles.lineBottomOpen : ""}`}
                  ></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Expandable Search Bar */}
          {isMobileSearchOpen && (
            <div className={styles.mobileSearchWrapper}>
              <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
                <Search size={17} className="text-gray-400" strokeWidth={2.6} />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.mobileSearchInput}
                  autoFocus
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={styles.clearBtn}
                  >
                    <X size={15} strokeWidth={2.8} />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Mobile Quick Navigation */}
        <div className={styles.mobileQuickRibbon}>
          <div className={styles.mobileQuickTrack}>
            {QUICK_PILLS.map((pill) => (
              <Link key={pill.label} href={pill.href} className={styles.mobileQuickPill}>
                {pill.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={styles.mobileDrawer}
            >
              {/* Drawer Top Header with Brand & Close Button */}
              <div className={styles.drawerTopBar}>
                <Link
                  href="/"
                  className={styles.brandLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className={styles.brandEmblem}>
                    <Image
                      src="/icon.png"
                      alt="YuVara"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <span className={styles.brandName}>
                    Yu<span className={styles.brandGold}>Vara</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className={styles.drawerCloseBtn}
                  aria-label="Close navigation menu"
                >
                  <X size={20} strokeWidth={2.6} />
                </button>
              </div>

              <div className={styles.mobileDrawerContent}>
                {/* User Status */}
                {session?.user ? (
                  <div className={styles.drawerProfileCard}>
                    <div className={styles.profileAvatar}>
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          className={styles.profileImg}
                        />
                      ) : (
                        <span>
                          {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 m-0">
                        {session.user?.name || "User"}
                      </h4>
                      <p className="text-xs text-gray-500 m-0 truncate max-w-[200px]">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className={styles.drawerSignInBtn}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Sign In / Register</span>
                  </Link>
                )}

                {/* Primary Nav */}
                <div className={styles.drawerNavSection}>
                  <span className={styles.drawerSectionLabel}>Shop</span>
                  <Link
                    href="/collections"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>All Collections</span>
                  </Link>
                  <Link
                    href="/collections?sort=bestseller"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Best Sellers</span>
                  </Link>
                  <Link
                    href="/collections?sort=newest"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>New Arrivals</span>
                  </Link>
                  <Link
                    href="/about"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>About</span>
                  </Link>
                  <Link
                    href="/contact"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Contact</span>
                  </Link>
                </div>

                {/* Admin / User Links */}
                {session?.user && (
                  <div className={styles.drawerNavSection}>
                    <span className={styles.drawerSectionLabel}>Account</span>
                    {(session.user?.role === "admin" || session.user?.role === "worker") && (
                      <Link
                        href="/admin/dashboard"
                        className={styles.drawerNavLink}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-[#996515] font-semibold">Admin Dashboard</span>
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Orders</span>
                    </Link>
                    <Link
                      href="/wishlist"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Wishlist</span>
                    </Link>
                    <Link
                      href="/dashboard/referrals"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Referrals</span>
                    </Link>
                    <button
                      onClick={() => {
                        void hardSignOut();
                        setIsMenuOpen(false);
                      }}
                      className={styles.drawerSignOut}
                    >
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}

                {/* Currency */}
                <div className={styles.drawerCurrencyWrap}>
                  <CurrencySelector variant="flowing" />
                </div>
              </div>

              <div className={styles.drawerFooter}>
                <p className={styles.copyrightText}>
                  © {new Date().getFullYear()} YuVara. All rights reserved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
