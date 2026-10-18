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

        <h2 className={styles.sectionTitle}>
          5. Third-Party Integrations &amp; Pinterest API Compliance
        </h2>
        <p>
          YuVara integrates with third-party platforms, including the Pinterest API (v5), to enable product catalog syndication, Rich Pins, and automated social merchandising. In accordance with Pinterest&apos;s Developer Guidelines and Privacy Standards:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Information Accessed:</strong> When our store connects to Pinterest via official OAuth 2.0, we access only the minimal requested permissions (such as reading boards, creating boards, and publishing product Pins). We do not collect or store sensitive personal Pinterest profile data.
          </li>
          <li>
            <strong>Data Transferred:</strong> Only public e-commerce store catalog information (including product titles, descriptions, imagery, pricing, and product URLs) is transmitted to Pinterest to create product Pins. Customer personal data, billing data, and customer purchase histories are never shared with or sent to Pinterest.
          </li>
          <li>
            <strong>Credential Security:</strong> All Pinterest API authorization tokens and refresh tokens are securely encrypted and stored on restricted servers. We never collect or store user passwords.
          </li>
          <li>
            <strong>Data Revocation &amp; Deletion:</strong> You or our authorized administrators may revoke access to Pinterest at any time either through our store administration dashboard or directly through your Pinterest account under <em>Settings &rarr; Apps</em>. Upon disconnection, token access is immediately revoked and deleted from our active database.
          </li>
        </ul>

        <h2 className={styles.sectionTitle}>6. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy
          practices, please contact us at support@yuvarastore.com.
        </p>
      </div>
    </div>
  );
}
