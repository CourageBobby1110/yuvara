"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { useRef, useTransition, useEffect, useState } from "react";
import styles from "./Search.module.css";

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [didSearch, setDidSearch] = useState(false);

  // Auto-scroll effect
  useEffect(() => {
    if (didSearch && !isPending) {
      const productGrid = document.getElementById("products-grid");
      if (productGrid) {
        // Small delay to ensure DOM update
        setTimeout(() => {
          productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
      setDidSearch(false);
    }
  }, [isPending, didSearch]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setDidSearch(true);
  }, 300);

  const clearSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    handleSearch("");
  };

  return (
    <div className={styles.container}>
      <label htmlFor="search" className={styles.label}>
        Search products
      </label>
      <div className={styles.wrapper}>
        <input
          id="search"
          ref={inputRef}
          className={styles.input}
          placeholder="Search for products..."
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get("search")?.toString()}
          aria-label="Search products"
        />
        <div className={styles.iconWrapper}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={styles.icon}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {isPending ? (
          <div className={styles.spinner} />
        ) : (
          searchParams.get("search") && (
            <button
              onClick={clearSearch}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={styles.clearIcon}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )
        )}
      </div>
    </div>
  );
}
