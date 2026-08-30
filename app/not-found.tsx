import Link from "next/link";
import styles from "./NotFound.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <span className={styles.badge}>404 — Not Found</span>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.description}>
          The page you’re looking for doesn’t exist or was moved. Check the link or head back to explore our collections.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>
            Back to Home
          </Link>
          <Link href="/collections" className={`${styles.btn} ${styles.btnSecondary}`}>
            Browse Collections
          </Link>
        </div>
      </main>

      <p className={styles.footer}>Yuvara — Global Shopping</p>
    </div>
  );
}
