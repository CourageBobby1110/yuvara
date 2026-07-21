import React from "react";
import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import styles from "./About.module.css";

const values = [
  {
    icon: Globe,
    title: "Global Access",
    description:
      "We source directly from international manufacturers to bring you world-class products at local prices.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    description:
      "Every product in our hub is vetted for quality, durability, and value before reaching your doorstep.",
  },
  {
    icon: Zap,
    title: "Lightning Delivery",
    description:
      "Optimized logistics network ensures your orders arrive fast, no matter where you are.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "We build for our customers. Your feedback shapes everything we do and every product we stock.",
  },
];

const stats = [
  { value: "10K+", label: "Happy Customers" },
  { value: "500+", label: "Global Brands" },
  { value: "50+", label: "Countries Served" },
  { value: "99.9%", label: "Satisfaction Rate" },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>About Us</span>
          <h1 className={styles.heroTitle}>Our Story</h1>
          <p className={styles.heroDesc}>
            Bridging the gap between global quality and local affordability.
            We believe premium shopping should be accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.missionGrid}>
            <div className={styles.missionText}>
              <span className={styles.sectionBadge}>Our Mission</span>
              <h2 className={styles.sectionTitle}>
                Making Premium Accessible
              </h2>
              <p className={styles.sectionText}>
                Yuvara was founded with a simple belief: everyone deserves
                access to quality products without breaking the bank. We cut out
                the middlemen, optimize our supply chain, and pass the savings
                directly to you.
              </p>
              <div className={styles.checkList}>
                <div className={styles.checkItem}>
                  <CheckCircle className={styles.checkIcon} size={18} />
                  <span>Curated from top global manufacturers</span>
                </div>
                <div className={styles.checkItem}>
                  <CheckCircle className={styles.checkIcon} size={18} />
                  <span>Rigorous quality control on every item</span>
                </div>
                <div className={styles.checkItem}>
                  <CheckCircle className={styles.checkIcon} size={18} />
                  <span>Hassle-free returns & dedicated support</span>
                </div>
              </div>
            </div>
            <div className={styles.missionVisual}>
              <div className={styles.visualBlock}>
                <TrendingUp className={styles.visualIcon} size={48} />
                <span className={styles.visualLabel}>Year over Year Growth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.valuesHeader}>
            <span className={styles.sectionBadge}>What We Stand For</span>
            <h2 className={styles.sectionTitle}>The Yuvara Standard</h2>
            <p className={styles.sectionSubtitle}>
              Four pillars that guide every decision we make.
            </p>
          </div>
          <div className={styles.valuesGrid}>
            {values.map((value) => (
              <div key={value.title} className={styles.valueCard}>
                <div className={styles.valueIconWrap}>
                  <value.icon className={styles.valueIcon} size={24} />
                </div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDesc}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Ready to Explore?</h2>
            <p className={styles.ctaText}>
              Join thousands of happy customers and discover products curated
              just for you.
            </p>
            <Link href="/collections" className={styles.ctaButton}>
              Browse Collections
              <ArrowRight className={styles.ctaArrow} size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
