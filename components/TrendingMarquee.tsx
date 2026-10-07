"use client";

import {
  Truck,
  ShieldCheck,
  Globe,
  Lock,
  RotateCcw,
  Headphones,
  Crown,
  Tag,
  type LucideIcon,
} from "lucide-react";
import styles from "./TrendingMarquee.module.css";

interface MarqueeItem {
  text: string;
  icon?: LucideIcon;
}

const ITEMS: MarqueeItem[] = [
  { text: "Free shipping over $150", icon: Truck },
  { text: "Authenticity guaranteed", icon: ShieldCheck },
  { text: "Ships worldwide", icon: Globe },
  { text: "Secure checkout", icon: Lock },
  { text: "Easy 30-day returns", icon: RotateCcw },
  { text: "24/7 Customer support", icon: Headphones },
  { text: "Premium quality", icon: Crown },
  { text: "New arrivals weekly", icon: Tag },
];

export default function TrendingMarquee() {
  const displayItems = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.scrollTrack}>
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <span key={`item-${index}`} className={styles.item}>
              {Icon && (
                <span className={styles.iconWrap} aria-hidden="true">
                  <Icon size={14} className={styles.icon} strokeWidth={2.2} />
                </span>
              )}
              <span className={styles.text}>{item.text}</span>
              <span className={styles.separator} aria-hidden="true">
                /
              </span>
            </span>
          );
        })}
      </div>
      <div className={styles.scrollTrack} aria-hidden="true">
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <span key={`clone-${index}`} className={styles.item}>
              {Icon && (
                <span className={styles.iconWrap} aria-hidden="true">
                  <Icon size={14} className={styles.icon} strokeWidth={2.2} />
                </span>
              )}
              <span className={styles.text}>{item.text}</span>
              <span className={styles.separator} aria-hidden="true">
                /
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
