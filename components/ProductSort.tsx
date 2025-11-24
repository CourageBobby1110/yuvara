"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import styles from "./ProductSort.module.css";

export default function ProductSort() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <label htmlFor="sort-select" className={styles.label}>
        Sort by
      </label>
      <div className={styles.wrapper}>
        <select
          id="sort-select"
          className={styles.select}
          onChange={(e) => handleSortChange(e.target.value)}
          defaultValue={searchParams.get("sort")?.toString()}
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        <div className={styles.iconWrapper}>
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
  );
}
