"use client";

import { useState } from "react";
import styles from "./InvestmentAgreementModal.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import InvestmentAgreementContent from "./InvestmentAgreementContent";

interface InvestmentAgreementModalProps {
  investorName: string;
  amount: number;
  onAgree: () => Promise<void>;
  startDate: string;
}

export default function InvestmentAgreementModal({
  investorName,
  amount,
  onAgree,
  startDate,
}: InvestmentAgreementModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useCurrency();

  const handleAgree = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await onAgree();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Helpers moved to InvestmentAgreementContent

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Investment Agreement</h2>
        </div>

        <div className={styles.content}>
          <InvestmentAgreementContent
            investorName={investorName}
            amount={amount}
            startDate={startDate}
          />
        </div>

        <div className={styles.footer}>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={loading}
            />
            <span className={styles.checkboxLabel}>
              I have read and agree to the Investment Agreement
            </span>
          </label>

          <button
            onClick={handleAgree}
            disabled={!agreed || loading}
            className={styles.agreeButton}
          >
            {loading ? "Processing..." : "Sign & Accept Agreement"}
          </button>
        </div>
      </div>
    </div>
  );
}
