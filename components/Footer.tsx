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
              <Image
                src="/logo.png"
                alt="Yuvara"
                width={120}
                height={40}
                style={{ objectFit: "contain" }}
              />
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
                <Link href="/careers" className={styles.link}>
                  Careers
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
