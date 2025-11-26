"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import styles from "./Hero.module.css";

export default function Hero() {
  const [heroImage, setHeroImage] = useState("/hero-shoe-minimalist.png");
  const [categories, setCategories] = useState<string[]>(PRODUCT_CATEGORIES);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Hero Image
        const resSettings = await fetch("/api/settings/hero");
        const dataSettings = await resSettings.json();
        if (dataSettings.heroImageUrl) {
          setHeroImage(dataSettings.heroImageUrl);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Category Sidebar */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Categories</h3>
          <ul className={styles.categoryList}>
            {categories.map((cat, index) => (
              <li key={index} className={styles.categoryItem}>
                <Link
                  href={`/collections?category=${cat}`}
                  className={styles.categoryLink}
                >
                  {cat}
                </Link>
              </li>
            ))}
            <li className={styles.categoryItem}>
              <Link
                href="/collections"
                className={styles.categoryLink + " " + styles.viewAll}
              >
                View All Categories
              </Link>
            </li>
          </ul>
        </aside>

        {/* Main Hero Content */}
        <div className={styles.mainContent}>
          <div className={styles.imageWrapper}>
            <Image
              src={heroImage}
              alt="Hero Banner"
              fill
              className={styles.heroImage}
              priority
              quality={100}
            />
            <div className={styles.overlay}>
              <h1 className={styles.headline}>
                Discover <br /> Unique Finds
              </h1>
              <p className={styles.subheadline}>
                Shop the latest trends in fashion, electronics, and more.
              </p>
              <Link href="/collections" className={styles.ctaButton}>
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
