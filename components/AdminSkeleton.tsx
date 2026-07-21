"use client";

import styles from "./AdminSkeleton.module.css";

interface AdminSkeletonProps {
  variant?: "dashboard" | "table" | "form" | "cards" | "detail";
  rows?: number;
  columns?: number;
}

export default function AdminSkeleton({
  variant = "table",
  rows = 6,
  columns = 5,
}: AdminSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonValue} />
            </div>
          ))}
        </div>
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.skeletonTableTitle} />
            <div className={styles.skeletonLink} />
          </div>
          <div className={styles.tableWrapper}>
            <div className={styles.tableHead}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.skeletonTh} />
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.tableRow}>
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className={styles.skeletonTd} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonButton} />
        </div>
        <div className={styles.filterBar}>
          <div className={styles.skeletonSearchInput} />
          <div className={styles.skeletonFilterSelect} />
        </div>
        <div className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            <div className={styles.tableHead}>
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className={styles.skeletonTh} />
              ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className={styles.tableRow}>
                {Array.from({ length: columns }).map((_, j) => (
                  <div key={j} className={styles.skeletonTd} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.pagination}>
          <div className={styles.skeletonButtonSmall} />
          <div className={styles.skeletonPageInfo} />
          <div className={styles.skeletonButtonSmall} />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
        </div>
        <div className={styles.formSkeleton}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.formGroup}>
              <div className={styles.skeletonLabel} />
              <div className={styles.skeletonInput} />
            </div>
          ))}
          <div className={styles.formActions}>
            <div className={styles.skeletonButton} />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonButton} />
        </div>
        <div className={styles.cardGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div className={styles.cardSkeletonHeader}>
                <div className={styles.skeletonCircle} />
                <div className={styles.skeletonTextGroup}>
                  <div className={styles.skeletonText} />
                  <div className={styles.skeletonTextSmall} />
                </div>
              </div>
              <div className={styles.cardSkeletonBody}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonButton} />
        </div>
        <div className={styles.detailSkeleton}>
          <div className={styles.detailSection}>
            <div className={styles.skeletonSectionTitle} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
          <div className={styles.detailSection}>
            <div className={styles.skeletonSectionTitle} />
            <div className={styles.skeletonInput} />
            <div className={styles.skeletonInput} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
