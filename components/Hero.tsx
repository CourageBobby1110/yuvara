"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./Hero.module.css";

interface HeroProps {
  heroImage: string;
}

export default function Hero({ heroImage }: HeroProps) {

  return (
    <div className={styles.heroContainer}>

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
            sizes="(max-width: 1024px) 100vw, 75vw"
          />
          <div className={styles.overlay} />
          <div className={styles.textContent}>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={styles.title}
            >
              Discover Your Style
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

    </div>
  );
}
