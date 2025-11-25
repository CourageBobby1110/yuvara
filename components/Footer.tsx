import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandColumn}>
          <span className={styles.logo}>Yuvara</span>
          <p className={styles.tagline}>
            Redefining luxury footwear for the modern era. Designed in Milan,
            crafted for the world.
          </p>
        </div>

        <div>
          <h4 className={styles.columnTitle}>Shop</h4>
          <ul className={styles.linkList}>
            <li className={styles.linkItem}>
              <Link href="/collections" className={styles.link}>
                New Arrivals
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/collections?sort=popular" className={styles.link}>
                Best Sellers
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link
                href="/collections?category=Accessories"
                className={styles.link}
              >
                Accessories
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/gift-cards" className={styles.link}>
                Gift Cards
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/dashboard/gift-cards" className={styles.link}>
                My Gift Cards
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={styles.columnTitle}>Support</h4>
          <ul className={styles.linkList}>
            <li className={styles.linkItem}>
              <Link href="/contact" className={styles.link}>
                Contact Us
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/shipping-returns" className={styles.link}>
                Shipping & Returns
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/about" className={styles.link}>
                Size Guide
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/faq" className={styles.link}>
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className={styles.columnTitle}>Legal</h4>
          <ul className={styles.linkList}>
            <li className={styles.linkItem}>
              <Link href="/privacy" className={styles.link}>
                Privacy Policy
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/terms" className={styles.link}>
                Terms of Service
              </Link>
            </li>
            <li className={styles.linkItem}>
              <Link href="/about" className={styles.link}>
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div>
          &copy; {new Date().getFullYear()} Yuvara. All rights reserved.
        </div>
        <div className={styles.socials}>
          <Link
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Instagram
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Twitter
          </Link>
          <Link
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Facebook
          </Link>
        </div>
      </div>
    </footer>
  );
}
