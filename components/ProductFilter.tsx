"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import styles from "./ProductFilter.module.css";

export default function ProductFilter({
  categories = [],
}: {
  categories?: string[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { currency } = useCurrency();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Always append current currency when filtering
    if (key === "minPrice" || key === "maxPrice") {
      params.set("currency", currency);
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    });

    // Auto-scroll to results on mobile after a short delay to allow drawer to close/user to see spinner
    if (window.innerWidth < 768) {
      setTimeout(() => {
        const productGrid = document.getElementById("products-grid");
        if (productGrid) {
          productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  };

  // Clear filters if currency changes
  useEffect(() => {
    const urlCurrency = searchParams.get("currency");
    if (urlCurrency && urlCurrency !== currency) {
      const params = new URLSearchParams(searchParams);
      params.delete("minPrice");
      params.delete("maxPrice");
      params.delete("currency");
      replace(`${pathname}?${params.toString()}`);
    }
  }, [currency, searchParams, replace, pathname]);

  // Get currency symbol
  const getCurrencySymbol = () => {
    return CURRENCY_SYMBOLS[currency] || "$";
  };

  return (
    <div className={styles.container}>
      {/* Mobile Trigger Button */}
      <button
        className={styles.mobileTrigger}
        onClick={() => setIsOpen(true)}
        aria-label="Open filters"
      >
        <svg
          className={styles.filterIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span>Filters</span>
        {isPending && <div className={styles.inlineSpinner} />}
      </button>

      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Loading Overlay */}

      {/* Desktop Header (keeps original title logic but ensures hidden on mobile via CSS) */}
      <div className={styles.header}>
        <h3 className={styles.title}>Filters</h3>
        {isPending && <div className={styles.inlineSpinner} />}
      </div>

      <div
        id="filter-content"
        className={`${styles.content} ${isOpen ? styles.open : ""} ${!isOpen ? styles.hidden : ""}`}
      >
        <div className={styles.mobileDrawerHeader}>
          <h3 className={styles.mobileTitle}>Filter Products</h3>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="category-select" className={styles.label}>
            Category
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="category-select"
              className={styles.select}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              defaultValue={searchParams.get("category")?.toString()}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className={styles.selectIcon}>
              <svg
                className={styles.icon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Price Range ({currency})</label>
          <div className={styles.priceGrid}>
            <div className={styles.inputWrapper}>
              <span className={styles.currencySymbol}>
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                placeholder="Min"
                className={styles.input}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                defaultValue={searchParams.get("minPrice")?.toString()}
                aria-label="Minimum price"
              />
            </div>
            <div className={styles.inputWrapper}>
              <span className={styles.currencySymbol}>
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                placeholder="Max"
                className={styles.input}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                defaultValue={searchParams.get("maxPrice")?.toString()}
                aria-label="Maximum price"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
