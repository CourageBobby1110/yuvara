import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                <div style={{ borderRadius: "50%", overflow: "hidden", width: "40px", height: "40px", position: "relative", border: "2px solid #bfa15f", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                  <Image
                    src="/icon-v2.png"
                    alt="YuVara Logo"
                    fill
                    sizes="40px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.5px", color: "#000000", fontFamily: "var(--font-inter), sans-serif" }}>
                  Yu<span style={{ color: "#bfa15f" }}>Vara</span>
                </span>
              </Link>
            </div>

            <p className={styles.tagline}>
              Redefining the modern shopping experience with quality, style, and
              innovation.
            </p>
            <div className={styles.socials}>
              <Link href="#" className={styles.socialLink}>
                Instagram
              </Link>
              <Link href="#" className={styles.socialLink}>
                Twitter
              </Link>
              <Link href="#" className={styles.socialLink}>
                Facebook
              </Link>
            </div>
          </div>

          <div className={styles.linksColumn}>
            <h4 className={styles.columnTitle}>Shop</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/collections" className={styles.link}>
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/collections?sort=newest" className={styles.link}>
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/collections?category=featured"
                  className={styles.link}
                >
                  Featured
                </Link>
              </li>
              <li>
                <Link href="/gift-cards" className={styles.link}>
                  Buy Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/dashboard/gift-cards" className={styles.link}>
                  My Gift Cards
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h4 className={styles.columnTitle}>Support</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/contact" className={styles.link}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className={styles.link}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping" className={styles.link}>
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/orders" className={styles.link}>
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h4 className={styles.columnTitle}>Company</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/about" className={styles.link}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/affiliate-program" className={styles.link}>
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/download" className={styles.link}>
                  Download App
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={styles.link}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={styles.link}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/invest" className={styles.link}>
                  Investment Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Yuvara. All rights reserved.
          </p>
          <div className={styles.paymentMethods}>
            <span className={styles.paymentIcon}>Visa</span>
            <span className={styles.paymentIcon}>Mastercard</span>
            <span className={styles.paymentIcon}>Amex</span>
            <span className={styles.paymentIcon}>PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
