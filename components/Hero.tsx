"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Hero.module.css";

interface HeroProps {
  carouselImages: string[];
}

export default function Hero({ carouselImages }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play the carousel every 4 seconds
  useEffect(() => {
    if (carouselImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselImages]);

  return (
    <div className={styles.heroContainer}>
      {/* Left Text / Editorial Section (Desktop only) */}
      <div className={styles.leftSection}>
        <div className={styles.textInner}>
          <motion.span
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className={styles.kicker}
          >
            New Season Arrival
          </motion.span>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={styles.title}
          >
            Timeless Essentials, <br />
            <span className={styles.italicTitle}>Elevated</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={styles.subtitle}
          >
            Experience the perfect fusion of enduring quality, minimal design, and ultimate comfort. Crafted for the global citizen.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link href="/collections" className={styles.ctaButton}>
              Explore Collection
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right Image Showcase Section (Desktop split, Mobile full screen) */}
      <div className={styles.rightSection}>
        <div className={styles.imageWrapper}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "absolute", inset: 0, cursor: "pointer" }}
            >
              <Image
                src={carouselImages[currentIndex]}
                alt="Yuvara Luxury Collection Showcase"
                fill
                className={styles.heroImage}
                priority
                quality={95}
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Small, sleek CTA button overlay (Visible on mobile/tablet view only) */}
        <div className={styles.mobileCtaOverlay}>
          <Link href="/collections" className={styles.mobileCtaButton}>
            Explore Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
