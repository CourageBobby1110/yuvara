import Link from "next/link";
import Image from "next/image";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      {/* Decorative Glow Background */}
      <div className={styles.glow} aria-hidden="true" />

      <main className={styles.content}>
        {/* Logo */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "2rem",
        }}>
          <Link href="/" style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}>
            <div style={{
              borderRadius: "50%",
              overflow: "hidden",
              width: "48px",
              height: "48px",
              position: "relative",
              border: "2px solid #bfa15f",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              flexShrink: 0,
            }}>
              <Image
                src="/icon.png"
                alt="Yuvara"
                fill
                sizes="48px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <span style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#111827",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}>
              Yu<span style={{ color: "#bfa15f" }}>Vara</span>
            </span>
          </Link>
        </div>

        {/* Large 404 Display */}
        <h1 className={styles.errorCode}>404</h1>

        {/* Title */}
        <h2 className={styles.title}>Page Not Found</h2>

        {/* Description */}
        <p className={styles.description}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>
            Back to Home
          </Link>
          <Link
            href="/collections"
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            Browse Collections
          </Link>
        </div>
      </main>

      {/* Brand Footer */}
      <footer className={styles.footer}>Yuvara Store</footer>
    </div>
  );
}
