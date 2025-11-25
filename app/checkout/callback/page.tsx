"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";
import styles from "./Callback.module.css";

export default function CheckoutCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const { clearCart } = useCartStore();
  const [status, setStatus] = useState("Verifying payment...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (!reference || processedRef.current) return;
    processedRef.current = true;

    const verifyPayment = async () => {
      try {
        // Retrieve pending order details
        const pendingOrder = localStorage.getItem("yuvara_pending_order");
        if (!pendingOrder) {
          setStatus("Error: No pending order found");
          return;
        }

        const {
          cartItems,
          shippingAddress,
          total,
          shippingFee,
          couponCode,
          discountAmount,
          giftCardCode,
          giftCardAmountUsed,
        } = JSON.parse(pendingOrder);

        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            cartItems,
            shippingAddress,
            total,
            shippingFee,
            couponCode,
            discountAmount,
            giftCardCode,
            giftCardAmountUsed,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("Payment successful! Creating order...");
          clearCart();
          localStorage.removeItem("yuvara_pending_order");
          router.push("/checkout/success");
        } else {
          setStatus(`Payment failed: ${data.error}`);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("An error occurred during verification");
      }
    };

    verifyPayment();
  }, [reference, router, clearCart]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          {status.includes("successful") ? (
            <div className={styles.successIcon}>
              <svg
                className={styles.successSvg}
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
          ) : status.includes("failed") || status.includes("Error") ? (
            <div className={styles.errorIcon}>
              <svg
                className={styles.errorSvg}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
            <div className={styles.loadingIcon}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>

        <h1 className={styles.title}>
          {status.includes("successful")
            ? "Payment Successful"
            : status.includes("failed") || status.includes("Error")
            ? "Payment Failed"
            : "Processing Payment"}
        </h1>

        <p className={styles.message}>{status}</p>

        {(status.includes("failed") || status.includes("Error")) && (
          <button
            onClick={() => router.push("/checkout")}
            className={styles.button}
          >
            Return to Checkout
          </button>
        )}
      </div>
    </div>
  );
}
