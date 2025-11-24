import React from "react";
import styles from "./Privacy.module.css";

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Privacy Policy</h1>

      <div className={styles.content}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className={styles.sectionTitle}>1. Introduction</h2>
        <p>
          Welcome to Yuvara. We respect your privacy and are committed to
          protecting your personal data. This privacy policy will inform you as
          to how we look after your personal data when you visit our website
          (regardless of where you visit it from) and tell you about your
          privacy rights and how the law protects you.
        </p>

        <h2 className={styles.sectionTitle}>2. Data We Collect</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal
          data about you which we have grouped together follows:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Identity Data</strong> includes first name, last name,
            username or similar identifier.
          </li>
          <li>
            <strong>Contact Data</strong> includes billing address, delivery
            address, email address and telephone numbers.
          </li>
          <li>
            <strong>Financial Data</strong> includes payment card details
            (processed securely by our payment providers).
          </li>
          <li>
            <strong>Transaction Data</strong> includes details about payments to
            and from you and other details of products you have purchased from
            us.
          </li>
        </ul>

        <h2 className={styles.sectionTitle}>3. How We Use Your Data</h2>
        <p>
          We will only use your personal data when the law allows us to. Most
          commonly, we will use your personal data in the following
          circumstances:
        </p>
        <ul className={styles.list}>
          <li>
            Where we need to perform the contract we are about to enter into or
            have entered into with you.
          </li>
          <li>
            Where it is necessary for our legitimate interests (or those of a
            third party) and your interests and fundamental rights do not
            override those interests.
          </li>
          <li>
            Where we need to comply with a legal or regulatory obligation.
          </li>
        </ul>

        <h2 className={styles.sectionTitle}>4. Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your
          personal data from being accidentally lost, used or accessed in an
          unauthorized way, altered or disclosed. In addition, we limit access
          to your personal data to those employees, agents, contractors and
          other third parties who have a business need to know.
        </p>

        <h2 className={styles.sectionTitle}>5. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy
          practices, please contact us at support@yuvara.com.
        </p>
      </div>
    </div>
  );
}
