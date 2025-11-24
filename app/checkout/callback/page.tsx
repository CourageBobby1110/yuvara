"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cart";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="mb-6 flex justify-center">
          {status.includes("successful") ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
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
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          {status.includes("successful")
            ? "Payment Successful"
            : status.includes("failed") || status.includes("Error")
            ? "Payment Failed"
            : "Processing Payment"}
        </h1>

        <p className="text-gray-500 mb-8">{status}</p>

        {(status.includes("failed") || status.includes("Error")) && (
          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Return to Checkout
          </button>
        )}
      </div>
    </div>
  );
}
