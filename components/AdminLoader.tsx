"use client";

import styles from "./AdminLoader.module.css";

export default function AdminLoader() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderContent}>
        <div className={styles.spinner}>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
          <div className={styles.spinnerRing}></div>
        </div>
        <div className={styles.brandName}>YUVARA</div>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    </div>
  );
}
