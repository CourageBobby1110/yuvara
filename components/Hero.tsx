"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./Hero.module.css";

interface HeroProps {
  categories: string[];
  heroImage: string;
}

export default function Hero({ categories, heroImage }: HeroProps) {
  const constraintsRef = useRef(null);

  return (
    <div className={styles.heroContainer}>
      {/* Desktop Categories Sidebar */}
      <div className={styles.categoriesSidebar}>
        <h3 className={styles.categoriesTitle}>Categories</h3>
        <ul className={styles.categoriesList}>
          {categories.map((category) => (
            <li key={category} className={styles.categoryItem}>
              <Link
                href={`/collections?category=${encodeURIComponent(category)}`}
                className={styles.categoryLink}
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Hero Content */}
      <div className={styles.heroContent}>
        <div className={styles.imageWrapper}>
          <Image
            src={heroImage}
            alt="Hero Image"
            fill
            className={styles.heroImage}
            priority
            quality={90}
          />
          <div className={styles.overlay} />
          <div className={styles.textContent}>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={styles.title}
            >
              Discover Your Style right now
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={styles.subtitle}
            >
              Shop the latest trends and essentials.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/collections" className={styles.ctaButton}>
                Shop All
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Draggable Categories */}
      <div className={styles.mobileCategoriesWrapper}>
        <div className={styles.mobileCategoriesContainer} ref={constraintsRef}>
          <motion.div
            className={styles.mobileCategoriesTrack}
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.2}
          >
            {categories.map((category) => (
              <Link
                key={category}
                href={`/collections?category=${encodeURIComponent(category)}`}
                className={styles.mobileCategoryTab}
              >
                {category}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
