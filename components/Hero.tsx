"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  const [heroImage, setHeroImage] = useState("/hero-shoe-minimalist.png");

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const res = await fetch("/api/settings/hero");
        const data = await res.json();
        if (data.heroImageUrl) {
          setHeroImage(data.heroImageUrl);
        }
      } catch (error) {
        console.error("Failed to fetch hero image:", error);
      }
    };

    fetchHeroImage();
  }, []);

  return (
    <div className={styles.container}>
      <Image
        src={heroImage}
        alt="Luxury Sneaker"
        fill
        className={styles.backgroundImage}
        priority
        quality={100}
      />

      <div className={styles.heroContent}>
        <h1 className={styles.headline}>
          Elegance <br />
          <span style={{ fontStyle: "italic", fontFamily: "serif" }}>
            Redefined
          </span>
        </h1>
        <p className={styles.subheadline}>
          Discover the pinnacle of luxury footwear. Handcrafted for the
          distinguished. Experience the future of fashion with Yuvara.
        </p>
        <Link href="/collections" className={styles.ctaButton}>
          Shop Collection
        </Link>
      </div>
    </div>
  );
}
