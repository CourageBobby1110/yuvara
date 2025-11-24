import React from "react";
import Link from "next/link";
import styles from "./About.module.css";

export default function AboutPage() {
  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>About Yuvara</h1>
          <p className={styles.heroSubtitle}>
            Redefining luxury footwear for the modern era
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className={styles.storySection}>
        <div className={styles.contentContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <div className={styles.separator} />
          </div>

          <div className={styles.prose}>
            <p className={styles.text}>
              Founded with a vision to merge timeless craftsmanship with
              contemporary design, Yuvara represents the pinnacle of luxury
              footwear. Each piece in our collection tells a story of
              dedication, artistry, and uncompromising quality.
            </p>

            <p className={styles.text}>
              Our journey began in the heart of Milan, where tradition meets
              innovation. We collaborate with master artisans who have honed
              their craft over generations, ensuring every stitch, every curve,
              and every detail meets our exacting standards.
            </p>

            <p className={styles.text}>
              Today, Yuvara stands as a testament to what happens when passion
              meets precision. We don&apos;t just create shoes; we craft
              experiences, memories, and statements of individual style that
              transcend fleeting trends.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.valuesSection}>
        <div className={styles.contentContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Values</h2>
            <div className={styles.separator} />
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>C</div>
              <h3 className={styles.valueTitle}>Craftsmanship</h3>
              <p className={styles.valueDescription}>
                Every pair is meticulously handcrafted by skilled artisans,
                ensuring unparalleled quality and attention to detail.
              </p>
            </div>

            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>I</div>
              <h3 className={styles.valueTitle}>Innovation</h3>
              <p className={styles.valueDescription}>
                We blend traditional techniques with cutting-edge design,
                creating footwear that&apos;s both timeless and contemporary.
              </p>
            </div>

            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>S</div>
              <h3 className={styles.valueTitle}>Sustainability</h3>
              <p className={styles.valueDescription}>
                We&apos;re committed to ethical sourcing and sustainable
                practices, ensuring our luxury doesn&apos;t come at the
                planet&apos;s expense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Experience Yuvara</h2>
          <p className={styles.ctaText}>
            Discover our curated collection of luxury footwear, where every step
            is a statement.
          </p>
          <Link href="/collections" className={styles.ctaButton}>
            Explore Collection
          </Link>
        </div>
      </section>
    </main>
  );
}
