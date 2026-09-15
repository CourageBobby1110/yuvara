"use client";

import styles from "./TrendingMarquee.module.css";

const ITEMS = [
  "Free shipping over $150",
  "Authenticity guaranteed",
  "Ships worldwide",
];

export default function TrendingMarquee() {
  const displayItems = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.scrollTrack}>
        {displayItems.map((text, index) => (
          <span key={`item-${index}`} className={styles.item}>
            <span className={styles.text}>{text}</span>
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
          </span>
        ))}
      </div>
      <div className={styles.scrollTrack} aria-hidden="true">
        {displayItems.map((text, index) => (
          <span key={`clone-${index}`} className={styles.item}>
            <span className={styles.text}>{text}</span>
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
