"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
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
  const { currency } = useCurrency();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      USD: "$",
      NGN: "₦",
      EUR: "€",
      GBP: "£",
    };
    return symbols[currency] || "$";
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        aria-controls="filter-content"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(!isOpen);
            e.preventDefault();
          }
        }}
      >
        <h3 className={styles.title}>Filters</h3>
        <svg
          className={`${styles.toggleIcon} ${isOpen ? styles.open : ""}`}
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

      <div
        id="filter-content"
        className={`${styles.content} ${!isOpen ? styles.hidden : ""}`}
      >
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
