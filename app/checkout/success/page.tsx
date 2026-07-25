"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { trackFBEvent } from "@/lib/fb-pixel";
import styles from "./Success.module.css";

function SuccessContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";

  useEffect(() => {
    const userData = session?.user
      ? {
          email: session.user.email || undefined,
          firstName: session.user.name?.split(" ")[0] || undefined,
          lastName: session.user.name?.split(" ").slice(1).join(" ") || undefined,
          userId: session.user.id || undefined,
        }
      : undefined;

    let purchaseValue = 0;
    let purchaseCurrency = "USD";
    try {
      const stored = localStorage.getItem("yuvara_purchase_value");
      if (stored) {
        const parsed = JSON.parse(stored);
        purchaseValue = parsed.value || 0;
        purchaseCurrency = parsed.currency || "USD";
      }
    } catch {}

    // Use a deterministic event ID matching the server-side CAPI event
    // Server uses purchase_{orderId}_{reference} but orderId isn't available client-side
    // so use reference-based ID for deduplication
    const eventId = reference ? `purchase_${reference}` : undefined;

    trackFBEvent(
      "Purchase",
      {
        value: purchaseValue,
        currency: purchaseCurrency,
        transaction_id: reference || undefined,
      },
      userData,
      eventId
    );

    // Clean up stored value after tracking
    try {
      localStorage.removeItem("yuvara_purchase_value");
    } catch {}
  }, [session, reference]);

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
          {session?.user ? (
            <Link href="/orders" className={styles.secondaryButton}>
              View My Orders
            </Link>
          ) : (
            <div className={styles.secondaryMessage}>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem" }}>
                A confirmation has been sent to your email. You can claim your guest account from the email to track this order!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading order details...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
