"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./GiftCard.module.css";
import { GIFT_CARD_PRESETS, GIFT_CARD_LIMITS } from "@/lib/giftCardUtils";

export default function GiftCardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Restore state from sessionStorage if available
    const savedState = sessionStorage.getItem("giftCardPurchaseState");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.selectedAmount)
          setSelectedAmount(parsedState.selectedAmount);
        if (parsedState.customAmount) setCustomAmount(parsedState.customAmount);
        if (parsedState.recipientEmail)
          setRecipientEmail(parsedState.recipientEmail);
        if (parsedState.recipientName)
          setRecipientName(parsedState.recipientName);
        if (parsedState.message) setMessage(parsedState.message);

        // Clear storage after restoring
        sessionStorage.removeItem("giftCardPurchaseState");
      } catch (e) {
        console.error("Failed to restore gift card state", e);
      }
    }
  }, []);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(Number(value));
    } else {
      setSelectedAmount(null);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAmount) {
      alert("Please select or enter an amount");
      return;
    }

    if (
      selectedAmount < GIFT_CARD_LIMITS.MIN_AMOUNT ||
      selectedAmount > GIFT_CARD_LIMITS.MAX_AMOUNT
    ) {
      alert(
        `Amount must be between ₦${GIFT_CARD_LIMITS.MIN_AMOUNT.toLocaleString()} and ₦${GIFT_CARD_LIMITS.MAX_AMOUNT.toLocaleString()}`
      );
      return;
    }

    if (!session?.user?.email) {
      // Save state before redirecting
      sessionStorage.setItem(
        "giftCardPurchaseState",
        JSON.stringify({
          selectedAmount,
          customAmount,
          recipientEmail,
          recipientName,
          message,
        })
      );

      alert("Please log in to purchase a gift card.");
      router.push("/auth/signin?callbackUrl=/gift-cards");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/gift-cards/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedAmount,
          recipientEmail: recipientEmail || undefined,
          recipientName: recipientName || undefined,
          message: message || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || "Failed to initiate payment");
        setLoading(false);
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("Failed to initiate payment");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Purchase Gift Card</h1>
        <p className={styles.subtitle}>
          Give the perfect gift - a Yuvara gift card
        </p>
      </div>

      <form onSubmit={handlePurchase} className={styles.form}>
        {/* Amount Selection */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Select Amount</h2>
          <div className={styles.presetGrid}>
            {GIFT_CARD_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetClick(preset.value)}
                className={`${styles.presetButton} ${
                  selectedAmount === preset.value && !customAmount
                    ? styles.active
                    : ""
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={styles.customAmount}>
            <label className={styles.label}>Or enter custom amount</label>
            <div className={styles.inputWrapper}>
              <span className={styles.currency}>₦</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder={`${GIFT_CARD_LIMITS.MIN_AMOUNT.toLocaleString()} - ${GIFT_CARD_LIMITS.MAX_AMOUNT.toLocaleString()}`}
                min={GIFT_CARD_LIMITS.MIN_AMOUNT}
                max={GIFT_CARD_LIMITS.MAX_AMOUNT}
                className={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Recipient Details */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recipient Details (Optional)</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Recipient Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className={styles.input}
            />
            <p className={styles.hint}>
              Gift card will be sent to this email address
            </p>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Recipient Name</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Personal Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Happy Birthday! Enjoy shopping at Yuvara..."
              maxLength={500}
              rows={4}
              className={styles.textarea}
            />
            <p className={styles.hint}>{message.length}/500 characters</p>
          </div>
        </div>

        {/* Summary */}
        {selectedAmount && (
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Gift Card Amount:</span>
              <span className={styles.summaryAmount}>
                ₦{selectedAmount.toLocaleString()}
              </span>
            </div>
            {recipientEmail && (
              <div className={styles.summaryRow}>
                <span>Sending to:</span>
                <span>{recipientEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!selectedAmount || loading}
          className={styles.submitButton}
        >
          {loading ? "Processing..." : "Pay & Purchase Gift Card"}
        </button>
      </form>
    </div>
  );
}
