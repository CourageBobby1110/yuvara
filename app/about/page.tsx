import React from "react";
import Link from "next/link";
import { getMarkdownContent } from "@/lib/markdown";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import styles from "./About.module.css";

export default async function AboutPage() {
  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  const heroImage = settings?.heroImageUrl || "/hero-shoe-minimalist.png";
  const contentHtml = await getMarkdownContent("about");

  return (
    <main className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div 
          className={styles.heroOverlay} 
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Our Story</h1>
          <p className={styles.heroSubtitle}>
            Bridging the gap between global quality and local affordability.
          </p>
        </div>
      </section>

      {/* Dynamic Content Section */}
      <section className={styles.contentSection}>
        <div className={styles.glassPanel}>
          <div 
            className={styles.prose}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </section>

      {/* Values Section - Premium Grid */}
      <section className={styles.valuesSection}>
        <div className={styles.contentContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>The Yuvara Standard</h2>
            <div className={styles.separator} />
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>G</div>
              <h3 className={styles.valueTitle}>Global Access</h3>
              <p className={styles.valueDescription}>
                We source directly from international manufacturers to bring you world-class products.
              </p>
            </div>

            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>A</div>
              <h3 className={styles.valueTitle}>Affordability</h3>
              <p className={styles.valueDescription}>
                Luxury shouldn't be expensive. We optimize logistics to keep prices fair for everyone.
              </p>
            </div>

            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>T</div>
              <h3 className={styles.valueTitle}>Trust</h3>
              <p className={styles.valueDescription}>
                Every product in our hub is vetted for quality, durability, and value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium Background */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Start Your Global Journey</h2>
          <p className={styles.ctaText}>
            Explore thousands of products curated for quality and value.
          </p>
          <Link href="/collections" className={styles.ctaButton}>
            Browse Collections
          </Link>
        </div>
      </section>
    </main>
  );
}
