"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./FlashDeals.module.css";

export default function FlashDeals() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0)
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 }; // Reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const deals = [
    {
      id: 1,
      name: "Wireless Earbuds",
      price: 12.99,
      original: 45.0,
      image: "/placeholder.png",
      sold: 85,
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 24.5,
      original: 89.99,
      image: "/placeholder.png",
      sold: 92,
    },
    {
      id: 3,
      name: "Phone Case",
      price: 2.99,
      original: 9.99,
      image: "/placeholder.png",
      sold: 45,
    },
    {
      id: 4,
      name: "USB Cable",
      price: 1.5,
      original: 5.0,
      image: "/placeholder.png",
      sold: 98,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Flash Deals</h2>
        <div className={styles.timer}>
          <span>Ending in</span>
          <div className={styles.timeBox}>
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          :
          <div className={styles.timeBox}>
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          :
          <div className={styles.timeBox}>
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
        </div>
        <Link href="/collections" className={styles.viewAll}>
          View All
        </Link>
      </div>

      <div className={styles.grid}>
        {deals.map((deal) => (
          <Link
            href={`/products/deal-${deal.id}`}
            key={deal.id}
            className={styles.card}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={deal.image}
                alt={deal.name}
                fill
                className={styles.image}
              />
              <span className={styles.discount}>
                -
                {Math.round(
                  ((deal.original - deal.price) / deal.original) * 100
                )}
                %
              </span>
            </div>
            <div className={styles.details}>
              <div className={styles.priceRow}>
                <span className={styles.price}>${deal.price}</span>
                <span className={styles.original}>${deal.original}</span>
              </div>
              <div className={styles.soldBar}>
                <div
                  className={styles.soldFill}
                  style={{ width: `${deal.sold}%` }}
                ></div>
              </div>
              <p className={styles.soldText}>{deal.sold}% Sold</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
