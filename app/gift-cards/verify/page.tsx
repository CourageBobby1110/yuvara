"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../GiftCard.module.css";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your payment...");
  const [giftCard, setGiftCard] = useState<any>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/gift-cards/complete-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Payment successful! Your gift card has been created.");
          setGiftCard(data.giftCard);
        } else {
          setStatus("error");
          setMessage(data.error || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying payment.");
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyCard}>
        {status === "loading" && (
          <>
            <div className={styles.spinner}></div>
            <h2 className={styles.verifyTitle}>Verifying Payment</h2>
            <p className={styles.verifyText}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.verifyTitle}>Payment Successful!</h2>
            <p className={styles.verifyText}>{message}</p>

            {giftCard && (
              <div className={styles.giftCardDetails}>
                <div className={styles.giftCardPreview}>
                  <div className={styles.cardAmount}>
                    {giftCard.currency === "NGN" ? "₦" : giftCard.currency}
                    {giftCard.amount.toLocaleString()}
                  </div>
                  <div className={styles.cardCodeLabel}>GIFT CARD CODE</div>
                  <div className={styles.cardCode}>{giftCard.code}</div>
                </div>

                {giftCard.recipientEmail && (
                  <p className={styles.recipientInfo}>
                    Sent to: <strong>{giftCard.recipientEmail}</strong>
                  </p>
                )}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                onClick={() => router.push("/dashboard/gift-cards")}
                className={styles.primaryButton}
              >
                Go to My Gift Cards
              </button>
              <button
                onClick={() => router.push("/gift-cards")}
                className={styles.secondaryButton}
              >
                Buy Another
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.verifyTitle}>Verification Failed</h2>
            <p className={styles.verifyText}>{message}</p>
            <button
              onClick={() => router.push("/gift-cards")}
              className={styles.backButton}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
