import Link from "next/link";
import styles from "./Success.module.css";

export default function OrderSuccessPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className={styles.title}>Order Confirmed!</h1>
        <p className={styles.message}>
          Thank you for your purchase. We have received your order and will
          begin processing it shortly. You will receive an email confirmation
          soon.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            Continue Shopping
          </Link>
          <Link href="/orders" className={styles.secondaryButton}>
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
