import React from "react";
import styles from "./InvestmentAgreementContent.module.css";

interface InvestmentAgreementContentProps {
  investorName: string;
  amount: number;
  startDate: string;
}

export default function InvestmentAgreementContent({
  investorName,
  amount,
  startDate,
}: InvestmentAgreementContentProps) {
  const investmentDate = new Date(startDate);
  const day = investmentDate.getDate();
  const month = investmentDate.toLocaleString("default", { month: "long" });
  const year = investmentDate.getFullYear();

  // Helper to add ordinal suffix (st, nd, rd, th)
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className={styles.content}>
      <p className="mb-4 text-center italic text-gray-500 print:hidden">
        Please review and accept the terms to proceed to your dashboard.
      </p>

      <p className="mb-6">
        <strong>THIS AGREEMENT</strong> is made on this{" "}
        <strong>{getOrdinal(day)}</strong> day of <strong>{month}</strong>,{" "}
        <strong>{year}</strong>, by and between:
      </p>

      <ol className="list-decimal pl-5 space-y-4 mb-6">
        <li>
          <strong>THE COMPANY:</strong> Yuvara Dropshipping.
        </li>
        <li>
          <strong>THE INVESTOR:</strong> {investorName}.
        </li>
      </ol>

      <div className="space-y-6">
        <div className={styles.section}>
          <span className={styles.sectionTitle}>1. INVESTMENT AMOUNT</span>
          <p>
            The Investor agrees to provide a total investment of{" "}
            <strong>
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
              }).format(amount)}
            </strong>{" "}
            (the "Investment Principal") to the Company to be used for ads.
          </p>
          <p className="mt-2">
            <em>
              Note: Any additional capital added (Top-ups) during the term of
              this agreement shall be considered an extension of this Investment
              Principal and subject to the same terms and conditions contained
              herein.
            </em>
          </p>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>
            2. PROFIT SHARING & DISBURSEMENTS
          </span>
          <p>
            In exchange for the Investment Principal, the Company agrees to pay
            the Investor a monthly profit share based on the performance of the
            business.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Maximum Cap:</strong> Under no circumstances shall the
              monthly payout exceed 50% of the original Investment Principal.
            </li>
            <li>
              <strong>Payment Date:</strong> Payments will be disbursed within 7
              to 14 days after withdrawal.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>3. TERM & DURATION</span>
          <p>
            This agreement shall commence on the date of signing and remain in
            effect for a period of 24 months. At the end of this term:
          </p>
          <ul className="list-disc pl-5 mt-2">
            <li>
              The Investment Principal shall be returned in full{" "}
              <strong>unless extended</strong>.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>4. RISK ACKNOWLEDGMENT</span>
          <p>
            The Investor acknowledges that all business investments involve
            risk. While the Company aims to maximize returns, monthly profits
            are subject to business performance and are not guaranteed at the
            maximum cap.
          </p>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>5. TERMINATION</span>
          <p>
            Either party may terminate this agreement with 60 days’ written
            notice. Upon termination, the Company shall settle any outstanding
            profit shares owed to the Investor up to the date of termination.
          </p>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>6. GOVERNING LAW</span>
          <p>
            This Agreement shall be governed by and construed in accordance with
            the laws of Nigeria.
          </p>
        </div>

        <div className={styles.signatures}>
          <div className={styles.signatureBlock}>
            <p className={styles.signatureLabel}>For the Company:</p>
            <div className={styles.signatureLine}>Yuvara</div>
            <p className={styles.signatureName}>Yuvara Dropshipping</p>
          </div>

          <div className={styles.signatureBlock}>
            <p className={styles.signatureLabel}>For the Investor:</p>
            <div className={styles.signatureLine}>{investorName}</div>
            <p className={styles.signatureName}>{investorName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
