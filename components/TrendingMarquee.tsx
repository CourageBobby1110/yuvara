import styles from "./TrendingMarquee.module.css";

export default function TrendingMarquee() {
  const items = [
    "NEW ARRIVALS",
    "FREE SHIPPING ON ORDERS OVER $500",
    "WORLDWIDE DELIVERY",
    "HANDCRAFTED IN ITALY",
    "SUSTAINABLE LUXURY",
  ];

  // Duplicate items to create seamless loop
  const displayItems = [...items, ...items, ...items, ...items];

  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.marqueeContent}>
        <div className={styles.text}>
          {displayItems.map((item, index) => (
            <span key={index}>
              {item} <span className={styles.separator}>•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
