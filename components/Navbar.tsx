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
import {
  Truck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  LayoutGrid,
  Search,
  X,
  User,
  Headphones,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Package,
  Heart,
  Users,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ArrowRight,
  Watch,
  Shirt,
  Gem,
  Tv,
  Footprints,
  Glasses,
  Home
} from "lucide-react";
import styles from "./Navbar.module.css";

function DressIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 2h4M9 2L7 7l-2.5 15h15L17 7l-2-5" />
      <path d="M7 7a5 5 0 0 0 10 0" />
      <path d="M9.5 12.5c1.5 1.5 3.5 1.5 5 0" />
    </svg>
  );
}

const CATEGORY_ITEMS = [
  { name: "Men's Sartorial", sub: "Suits, Knits & Casuals", slug: "Men", icon: Shirt },
  { name: "Women's Atelier", sub: "Couture, Silks & Gowns", slug: "Women", icon: DressIcon },
  { name: "Horology & Watches", sub: "Swiss & Chronographs", slug: "Watches", icon: Watch },
  { name: "Fine Jewelry", sub: "Diamonds & 18K Gold", slug: "Jewelry", icon: Gem },
  { name: "Designer Footwear", sub: "Sneakers, Boots & Loafers", slug: "Shoes", icon: Footprints },
  { name: "Beauty & Skincare", sub: "Facial Care, Serums & Oils", slug: "Beauty", icon: Sparkles },
  { name: "Home & Living", sub: "Smart Decor, Lamps & Living", slug: "Home", icon: Home },
  { name: "Tech & Gadgets", sub: "Phone Cases, Audio & Office", slug: "Electronics", icon: Tv },
  { name: "Complete Archive", sub: "Explore Full Catalog", slug: "all", icon: LayoutGrid },
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
      {/* 1. MINIMALIST LUXURY TOP NOTICE RIBBON */}
      <div className={styles.topNoticeRibbon}>
        <div className={styles.topNoticeInner}>
          {/* Left: Global Delivery */}
          <Link href="/collections" className={styles.noticeLink}>
            <div className={`${styles.iconWrap} ${styles.animateDrive}`}>
              <Truck size={14} className={styles.noticeGoldIcon} strokeWidth={2.6} />
            </div>
            <span className={styles.noticeText}>Complimentary Global Shipping on Orders over $150</span>
          </Link>

          {/* Center: Guarantee */}
          <Link href="/shipping-returns" className={styles.noticeLinkCenter}>
            <div className={`${styles.iconWrap} ${styles.animatePulse}`}>
              <ShieldCheck size={14} className={styles.noticeGoldIcon} strokeWidth={2.6} />
            </div>
            <span className={styles.noticeText}>100% Certified Authenticity &amp; Bespoke Care</span>
          </Link>

          {/* Right: App Experience */}
          <Link href="/collections" className={styles.noticeLinkRight}>
            <div className={`${styles.iconWrap} ${styles.animateFloat}`}>
              <Smartphone size={14} className={styles.noticeGoldIcon} strokeWidth={2.6} />
            </div>
            <span className={styles.noticeText}>YuVara Mobile App</span>
            <ArrowRight size={12} className={styles.noticeArrow} strokeWidth={2.8} />
          </Link>
        </div>
      </div>

      {/* 2. MAIN MINIMALIST NAVBAR */}
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

              {/* Categories Mega Trigger */}
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

                {/* Categories Luxury Popover */}
                {isCategoryDropdownOpen && (
                  <div className={styles.categoryMenu}>
                    <div className={styles.categoryMenuHeader}>
                      <span className={styles.categoryHeaderKicker}>Curated Departments</span>
                      <span className={styles.categoryHeaderTag}>YuVara 2026</span>
                    </div>

                    <div className={styles.categoryGrid}>
                      {CATEGORY_ITEMS.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                          <Link
                            key={cat.slug}
                            href={
                              cat.slug === "all"
                                ? "/collections"
                                : `/collections?category=${encodeURIComponent(cat.slug)}`
                            }
                            className={styles.categoryMenuItem}
                            onClick={() => setIsCategoryDropdownOpen(false)}
                          >
                            <div className={styles.categoryIconWrap}>
                              <IconComponent size={16} className={styles.categoryIcon} />
                            </div>
                            <div className={styles.categoryTextWrap}>
                              <span className={styles.categoryMenuLabel}>{cat.name}</span>
                              <span className={styles.categoryMenuSub}>{cat.sub}</span>
                            </div>
                            <ChevronRight size={13} className={styles.itemChevron} strokeWidth={2.5} />
                          </Link>
                        );
                      })}
                    </div>

                    <div className={styles.categoryMenuFooter}>
                      <Link 
                        href="/collections" 
                        className={styles.allCollectionsFooterLink}
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      >
                        <span>Explore Full Store Catalog</span>
                        <ArrowRight size={13} strokeWidth={2.6} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Minimalist Search Bar */}
            <form onSubmit={handleSearch} className={styles.searchContainer}>
              <div className={`${styles.iconWrap} ${styles.searchIconWrap}`}>
                <Search size={16} className={styles.searchIcon} strokeWidth={2.6} />
              </div>
              <input
                type="text"
                placeholder="Search timeless fashion, timepieces, luxury..."
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
                    <div className={`${styles.iconWrap} ${styles.animateUser}`}>
                      <User size={17} strokeWidth={2.6} />
                    </div>
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
                          <SlidersHorizontal size={15} strokeWidth={2.5} />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <User size={15} strokeWidth={2.5} />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <Package size={15} strokeWidth={2.5} />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href="/wishlist"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <Heart size={15} strokeWidth={2.5} />
                        <span>Wishlist</span>
                      </Link>
                      <Link
                        href="/dashboard/referrals"
                        className={styles.dropdownItem}
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <Users size={15} strokeWidth={2.5} />
                        <span>Referrals</span>
                      </Link>
                      <button
                        onClick={() => {
                          void switchAccount();
                          setIsAccountDropdownOpen(false);
                        }}
                        className={styles.dropdownItem}
                      >
                        <RefreshCw size={15} strokeWidth={2.5} />
                        <span>Switch Account</span>
                      </button>
                      <button
                        onClick={() => {
                          void hardSignOut();
                          setIsAccountDropdownOpen(false);
                        }}
                        className={`${styles.dropdownItem} ${styles.signOutBtn}`}
                      >
                        <LogOut size={15} strokeWidth={2.5} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Support */}
              <Link href="/contact" className={styles.supportBtn} aria-label="Support">
                <div className={`${styles.iconWrap} ${styles.animateSupport}`}>
                  <Headphones size={18} strokeWidth={2.6} />
                </div>
              </Link>

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
                <div className={`${styles.bagIconWrap} ${styles.animateBag}`}>
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
                  placeholder="Search collections, footwear, watches..."
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

        {/* Mobile Horizontal Quick Navigation */}
        <div className={styles.mobileQuickRibbon}>
          <div className={styles.mobileQuickTrack}>
            <Link href="/collections?sort=bestseller" className={styles.mobileQuickPill}>
              Best Sellers
            </Link>
            <Link href="/collections?sort=rating" className={styles.mobileQuickPill}>
              Curated
            </Link>
            <Link href="/collections?sort=newest" className={styles.mobileQuickPill}>
              New In
            </Link>
            <Link href="/collections?category=Watches" className={styles.mobileQuickPill}>
              Watches
            </Link>
            <Link href="/collections?category=Jewelry" className={styles.mobileQuickPill}>
              Jewelry
            </Link>
            <Link href="/collections?category=Men" className={styles.mobileQuickPill}>
              Men
            </Link>
            <Link href="/collections?category=Women" className={styles.mobileQuickPill}>
              Women
            </Link>
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
                    <User size={17} strokeWidth={2.6} />
                    <span>Sign In / Register</span>
                  </Link>
                )}

                {/* Primary Nav */}
                <div className={styles.drawerNavSection}>
                  <span className={styles.drawerSectionLabel}>Collections</span>
                  <Link
                    href="/collections"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>All Collections</span>
                    <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                  </Link>
                  <Link
                    href="/collections?sort=bestseller"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Best-Selling Items</span>
                    <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                  </Link>
                  <Link
                    href="/collections?sort=newest"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>New Arrivals</span>
                    <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                  </Link>
                  <Link
                    href="/about"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>About the Brand</span>
                    <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                  </Link>
                  <Link
                    href="/contact"
                    className={styles.drawerNavLink}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Bespoke Concierge &amp; Support</span>
                    <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
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
                        <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>My Orders</span>
                      <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                    </Link>
                    <Link
                      href="/wishlist"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Wishlist</span>
                      <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                    </Link>
                    <Link
                      href="/dashboard/referrals"
                      className={styles.drawerNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Referrals</span>
                      <ChevronRight size={15} strokeWidth={2.6} className="opacity-40" />
                    </Link>
                    <button
                      onClick={() => {
                        void hardSignOut();
                        setIsMenuOpen(false);
                      }}
                      className={styles.drawerSignOut}
                    >
                      <LogOut size={16} strokeWidth={2.6} />
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
