import { Truck, Globe, ShieldCheck, Tag, Star } from "lucide-react";
import styles from "./TrendingMarquee.module.css";

export default function TrendingMarquee() {
  const items = [
    { icon: <Tag size={16} />, text: "New Arrivals Daily" },
    { icon: <Truck size={16} />, text: "Free Shipping over $500" },
    { icon: <Globe size={16} />, text: "Worldwide Delivery" },
    { icon: <ShieldCheck size={16} />, text: "Secure Payment" },
    { icon: <Star size={16} />, text: "Premium Quality" },
  ];

  // Duplicate items multiple times to ensure smooth infinite scroll on wide screens
  const displayItems = [...items, ...items, ...items, ...items];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.scrollTrack}>
        {displayItems.map((item, index) => (
          <div key={index} className={styles.item}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.text}>{item.text}</span>
            <span className={styles.separator}>•</span>
          </div>
        ))}
      </div>
      <div className={styles.scrollTrack} aria-hidden="true">
        {displayItems.map((item, index) => (
          <div key={`clone-${index}`} className={styles.item}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.text}>{item.text}</span>
            <span className={styles.separator}>•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
