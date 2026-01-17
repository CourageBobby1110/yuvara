import Link from "next/link";
import styles from "./NotFound.module.css"; // Ensure this file exists

export default function NotFound() {
  return (
    <div className={styles.container}>
      {/* Decorative Glow Background */}
      <div className={styles.glow} aria-hidden="true" />

      <main className={styles.content}>
        {/* Large 404 Display */}
        <h1 className={styles.errorCode}>404</h1>

        {/* Editorial Title */}
        <h2 className={styles.title}>Page Not Found</h2>

        {/* Descriptive Text */}
        <p className={styles.description}>
          The page you are looking for doesn’t exist or has been moved. Use the
          links below to find your way back.
        </p>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>
            Go Home
          </Link>
          {/* Note: In a comprehensive app, you might use 'router.back()' for a 'Go Back' button, 
              but for a static 404 page, a link to support or collections is also common. 
              Here we stick to a clean 'Go Back' that acts as a secondary home link or could be replaced with history.back() logic if client component. */}
          <Link
            href="/collections/all"
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            Shop Now
          </Link>
        </div>
      </main>

      {/* Brand Footer */}
      <footer className={styles.footer}>Yuvara Luxury</footer>
    </div>
  );
}
