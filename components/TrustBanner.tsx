"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Truck, 
  ShieldAlert, 
  ArrowRight, 
  X 
} from "lucide-react";
import styles from "./TrustBanner.module.css";

export default function TrustBanner() {
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  return (
    <div className={styles.container}>
      {/* 1. Minimalist Luxury Trust Strip */}
      <div className={styles.trustStrip}>
        <div className={styles.trustContainer}>
          <div className={styles.trustGroup}>
            <div className={styles.trustItem}>
              <div className={`${styles.iconWrap} ${styles.animatePulse}`}>
                <ShieldCheck size={15} className={styles.boldIcon} strokeWidth={2.7} />
              </div>
              <span className={styles.trustText}>
                <strong>Guaranteed Authenticity</strong>
              </span>
            </div>

            <div className={styles.dotSeparator}>•</div>

            <div className={styles.trustItem}>
              <div className={`${styles.iconWrap} ${styles.animateFloat}`}>
                <Lock size={15} className={styles.boldIcon} strokeWidth={2.7} />
              </div>
              <span className={styles.trustText}>256-Bit Encrypted Security</span>
            </div>

            <div className={styles.dotSeparator}>•</div>

            <div className={styles.trustItem}>
              <div className={`${styles.iconWrap} ${styles.animateShimmer}`}>
                <CreditCard size={15} className={styles.boldIcon} strokeWidth={2.7} />
              </div>
              <span className={styles.trustText}>Protected Checkout</span>
            </div>

            <div className={styles.dotSeparator}>•</div>

            <Link href="/shipping-returns" className={styles.trustLink}>
              <div className={`${styles.iconWrap} ${styles.animateDrive}`}>
                <Truck size={15} className={styles.boldIcon} strokeWidth={2.7} />
              </div>
              <span className={styles.trustText}>Worldwide Priority Dispatch</span>
              <ArrowRight size={13} className={styles.arrowIcon} strokeWidth={2.8} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Minimalist Security Alert */}
      {isAlertVisible && (
        <div className={styles.alertStrip}>
          <div className={styles.alertContainer}>
            <div className={styles.alertLeft}>
              <div className={`${styles.iconWrap} ${styles.animateBell}`}>
                <ShieldAlert size={15} className={styles.alertIcon} strokeWidth={2.7} />
              </div>
              <p className={styles.alertText}>
                <strong className={styles.alertLead}>Official Security Advisory:</strong> YuVara will never request private PINs, OTPs, or unverified wire fees via SMS.
              </p>
            </div>

            <div className={styles.alertRight}>
              <Link href="/privacy" className={styles.learnMoreLink}>
                <span>Learn more</span>
                <ArrowRight size={12} strokeWidth={2.8} className={styles.learnArrow} />
              </Link>
              <button 
                onClick={() => setIsAlertVisible(false)} 
                className={styles.dismissButton}
                aria-label="Dismiss security notice"
              >
                <X size={14} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
