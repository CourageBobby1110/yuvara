"use client";

import { 
  ShieldCheck, 
  Lock, 
  Truck, 
  CreditCard, 
  Plane, 
  Crown 
} from "lucide-react";
import styles from "./TrendingMarquee.module.css";

export default function TrendingMarquee() {
  const items = [
    { 
      icon: <ShieldCheck size={14} className={styles.goldIcon} strokeWidth={2.5} />, 
      text: "Guaranteed Authenticity",
      animClass: styles.animateSubtlePulse
    },
    { 
      icon: <Lock size={14} className={styles.goldIcon} strokeWidth={2.5} />, 
      text: "256-Bit Encrypted Checkout",
      animClass: styles.animateSubtleFloat
    },
    { 
      icon: <Plane size={14} className={styles.goldIcon} strokeWidth={2.5} />, 
      text: "Complimentary Global Shipping over $150",
      animClass: styles.animateSubtleGlide
    },
    { 
      icon: <CreditCard size={14} className={styles.goldIcon} strokeWidth={2.5} />, 
      text: "Protected Multi-Currency Payments",
      animClass: styles.animateSubtleShimmer
    },
    { 
      icon: <Truck size={14} className={styles.goldIcon} strokeWidth={2.5} />, 
      text: "Worldwide Priority Dispatch",
      animClass: styles.animateSubtleDrive
    },
    { 
      icon: <Crown size={14} className={styles.goldIcon} strokeWidth={2.5} />, 
      text: "Bespoke Luxury Standard",
      animClass: styles.animateSubtleFloat
    },
  ];

  // Repeat items for seamless infinite scroll
  const displayItems = [...items, ...items, ...items];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.scrollTrack}>
        {displayItems.map((item, index) => (
          <div key={`item-${index}`} className={styles.item}>
            <div className={`${styles.iconWrap} ${item.animClass}`}>
              {item.icon}
            </div>
            <span className={styles.text}>{item.text}</span>
            <span className={styles.separator}>•</span>
          </div>
        ))}
      </div>
      <div className={styles.scrollTrack} aria-hidden="true">
        {displayItems.map((item, index) => (
          <div key={`clone-${index}`} className={styles.item}>
            <div className={`${styles.iconWrap} ${item.animClass}`}>
              {item.icon}
            </div>
            <span className={styles.text}>{item.text}</span>
            <span className={styles.separator}>•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
