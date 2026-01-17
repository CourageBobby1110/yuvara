"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, Settings, LogOut, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "./AdminHeader.module.css";

interface SearchResult {
  type: "product" | "order" | "user";
  id: string;
  label: string;
  subtext: string;
  image?: string;
  url: string;
}

export default function AdminHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Notification State
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch Unread Notifications
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/admin/messages");
        if (res.ok) {
          const data = await res.json();
          const unread = data?.messages?.filter(
            (m: any) => m.status === "unread",
          ).length;
          setUnreadCount(unread || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await fetch(
          `/api/admin/global-search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleResultClick = (url: string) => {
    setQuery("");
    setShowDropdown(false);
    router.push(url);
  };

  return (
    <header className={styles.header}>
      {/* Mobile Title */}
      <div className={`${styles.mobileTitle} lg:hidden`}>Admin Dashboard</div>

      {/* Global Search */}
      <div className={styles.searchContainer} ref={dropdownRef}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.length >= 2) setShowDropdown(true);
            }}
          />
          {isSearching ? (
            <Loader2 className={`${styles.clearIcon} animate-spin`} size={16} />
          ) : query ? (
            <button onClick={() => setQuery("")} className={styles.clearButton}>
              <X className={styles.clearIcon} size={16} />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && query.length >= 2 && (
          <div className={styles.searchResultsDropdown}>
            {results.length > 0 ? (
              results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className={styles.searchResultItem}
                  onClick={() => handleResultClick(result.url)}
                >
                  <div className={styles.resultIconWrapper}>
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt=""
                        width={32}
                        height={32}
                        className={styles.resultImage}
                      />
                    ) : (
                      <div className={styles.resultPlaceholderIcon}>
                        {result.type === "order" ? "📦" : "👤"}
                      </div>
                    )}
                  </div>
                  <div className={styles.resultInfo}>
                    <span className={styles.resultLabel}>{result.label}</span>
                    <span className={styles.resultSubtext}>
                      {result.type.toUpperCase()} • {result.subtext}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                {isSearching ? "Searching..." : "No results found."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className={styles.rightSection}>
        {/* Notifications */}
        <Link
          href="/admin/messages"
          className={styles.iconButton}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={styles.notificationBadge}>{unreadCount}</span>
          )}
        </Link>

        {/* Settings */}
        <Link
          href="/admin/settings"
          className={styles.iconButton}
          aria-label="Settings"
        >
          <Settings size={20} />
        </Link>

        {/* User Profile */}
        <div className={styles.profileButton} title="Sign Out">
          <Image
            src={session?.user?.image || "/placeholder.png"}
            alt="Profile"
            width={32}
            height={32}
            className={styles.avatar}
          />
          <div className={styles.profileInfo}>
            <span className={styles.userName}>
              {session?.user?.name || "Admin User"}
            </span>
            <span className={styles.userRole}>
              {session?.user?.role || "Administrator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
