"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Hero.module.css";

export default function Hero() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    if (slides.length === 0) return;
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const DEFAULT_SLIDES = [
    {
      title: "Summer Collection 2025",
      subtitle: "Discover the hottest trends for the season.",
      cta: "Shop Now",
      link: "/collections/summer",
      image: "/hero-shoe-minimalist.png",
      color: "#f3f4f6",
    },
    {
      title: "New Arrivals",
      subtitle: "Check out the latest additions to our store.",
      cta: "View All",
      link: "/products",
      image: "/hero-shoe-minimalist.png",
      color: "#e5e7eb",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/settings/hero", { cache: "no-store" });
        const data = await res.json();
        if (data.heroSlides && data.heroSlides.length > 0) {
          setSlides(data.heroSlides);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (error) {
        console.error("Failed to fetch hero settings:", error);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse} />
      </div>
    );
  }

  if (!slides || slides.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          exit="exit"
          className={styles.slide}
          animate={{
            ...variants.center,
          }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            duration: 0.5,
          }}
        >
          {/* Background Image */}
          <div className={styles.imageContainer}>
            <Image
              src={slides[current].image}
              alt={slides[current].title || "Hero Image"}
              fill
              className={styles.heroImage}
              priority
              quality={90}
            />
            <div className={styles.overlay} />
          </div>

          {/* Content */}
          <div className={styles.slideContent}>
            <div className={styles.textContent}>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={styles.title}
              >
                {slides[current].title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={styles.subtitle}
              >
                {slides[current].subtitle}
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href={
                    slides[current].link ||
                    slides[current].ctaLink ||
                    "/collections"
                  }
                  className={styles.ctaButton}
                >
                  {slides[current].cta || slides[current].ctaText || "Shop Now"}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        className={`${styles.navButton} ${styles.prev}`}
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className={`${styles.navButton} ${styles.next}`}
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className={styles.dots}>
        {slides.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${
              index === current ? styles.activeDot : ""
            }`}
            onClick={() => {
              setDirection(index > current ? 1 : -1);
              setCurrent(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}
