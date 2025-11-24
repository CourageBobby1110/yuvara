import React from "react";
import styles from "./Shipping.module.css";

export default function ShippingReturns() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Shipping & Returns</h1>

      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>Shipping Policy</h2>
        <p>
          We are proud to offer shipping services across Nigeria and
          internationally.
        </p>

        <h3 className={styles.subSectionTitle}>Domestic Shipping (Nigeria)</h3>
        <p>
          We deliver to all 36 states in Nigeria. Shipping fees are calculated
          at checkout based on your state. Standard delivery takes 3-5 business
          days for Lagos and 5-7 business days for other states.
        </p>

        <h3 className={styles.subSectionTitle}>International Shipping</h3>
        <p>
          We ship worldwide via DHL Express. International shipping rates vary
          based on destination and package weight. Delivery typically takes 5-10
          business days. Please note that customs duties and taxes may apply and
          are the responsibility of the customer.
        </p>

        <h2 className={styles.sectionTitle}>Return Policy</h2>
        <p>
          We want you to be completely satisfied with your purchase. If you are
          not happy with your order, you may return it within 14 days of receipt
          for a full refund or exchange, provided the items are:
        </p>
        <ul className={styles.list}>
          <li>Unworn, unwashed, and in original condition</li>
          <li>In the original packaging with all tags attached</li>
          <li>Accompanied by the original receipt or proof of purchase</li>
        </ul>

        <h3 className={styles.subSectionTitle}>How to Initiate a Return</h3>
        <p>
          To start a return, please contact our support team at
          support@yuvara.com with your order number and reason for return. We
          will provide you with a return shipping label and instructions on how
          and where to send your package.
        </p>

        <h3 className={styles.subSectionTitle}>Refunds</h3>
        <p>
          Once we receive and inspect your return, we will notify you of the
          approval or rejection of your refund. If approved, your refund will be
          processed, and a credit will automatically be applied to your original
          method of payment within 5-10 business days.
        </p>
      </div>
    </div>
  );
}
