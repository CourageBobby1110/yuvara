"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Clock, 
  ArrowRight, 
  Star, 
  Lock,
  TrendingDown
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Hero.module.css";

interface DealItem {
  _id?: string;
  dealId?: string;
  productId?: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  image: string;
  durationHours?: number;
  claimedPercent?: number;
  stockRemaining?: number;
  stockTag?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface HeroProps {
  countdownDeals?: DealItem[];
  limitedDeals?: DealItem[];
}

const DEFAULT_COUNTDOWN: DealItem[] = [
  {
    _id: "def-cd-1",
    name: "Classic Chronograph Watch - Rose Gold Edition",
    slug: "classic-chronograph-watch",
    price: 38.5,
    originalPrice: 75.0,
    discountPercent: 48,
    image: "/hero-shoe-minimalist.png",
    claimedPercent: 88,
  },
  {
    _id: "def-cd-2",
    name: "Sartorial Cashmere Blend Overcoat",
    slug: "sartorial-cashmere-overcoat",
    price: 45.0,
    originalPrice: 90.0,
    discountPercent: 50,
    image: "/hero-shoe.png",
    claimedPercent: 74,
  },
  {
    _id: "def-cd-3",
    name: "Italian Leather Minimalist Handcrafted Loafers",
    slug: "italian-leather-loafers",
    price: 29.9,
    originalPrice: 58.0,
    discountPercent: 48,
    image: "/hero-shoe-minimalist.png",
    claimedPercent: 92,
  },
];

const DEFAULT_LIMITED: DealItem[] = [
  {
    _id: "def-ld-1",
    name: "Sterling Silver Geometric Chain Bracelet",
    slug: "sterling-silver-bracelet",
    price: 22.0,
    originalPrice: 48.0,
    discountPercent: 54,
    image: "/hero-shoe.png",
    stockRemaining: 3,
    stockTag: "Only 3 left",
    averageRating: 5.0,
    reviewCount: 412,
  },
  {
    _id: "def-ld-2",
    name: "Minimalist Aviator Polarized Sunglasses",
    slug: "minimalist-aviator-sunglasses",
    price: 18.5,
    originalPrice: 38.0,
    discountPercent: 51,
    image: "/hero-shoe-minimalist.png",
    stockRemaining: 2,
    stockTag: "Only 2 left",
    averageRating: 4.9,
    reviewCount: 295,
  },
  {
    _id: "def-ld-3",
    name: "Matte Black Wireless Active Noise-Cancelling Audio",
    slug: "matte-black-wireless-audio",
    price: 34.0,
    originalPrice: 70.0,
    discountPercent: 51,
    image: "/hero-shoe.png",
    stockRemaining: 5,
    stockTag: "Only 5 left",
    averageRating: 5.0,
    reviewCount: 528,
  },
];

export default function Hero({ 
  countdownDeals = [], 
  limitedDeals = []
}: HeroProps) {
  const { formatPrice } = useCurrency();

  // Active Countdown Ticker for Timed Editions
  const [secondsLeft, setSecondsLeft] = useState<number>(14 * 3600 + 23 * 60 + 53);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 24 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      hours: String(h).padStart(2, "0"),
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    };
  };

  const time = formatDigits(secondsLeft);

  // Guarantee non-empty display items
  const displayCountdown = (countdownDeals && countdownDeals.length > 0 ? countdownDeals : DEFAULT_COUNTDOWN).slice(0, 3);
  const displayLimited = (limitedDeals && limitedDeals.length > 0 ? limitedDeals : DEFAULT_LIMITED).slice(0, 3);

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.splitGrid}>
          {/* =================================================================
              LEFT COLUMN: TIMED EDITIONS (Countdown Drops)
             ================================================================= */}
          <div className={styles.showcaseColumn}>
            {/* Header */}
            <div className={styles.columnHeader}>
              <div className={styles.headerTitleGroup}>
                <span className={styles.columnKicker}>Limited Release</span>
                <h2 className={styles.columnTitle}>Timed Drops</h2>
              </div>

              {/* Minimalist Digital Clock */}
              <div className={styles.countdownPill}>
                <div className={`${styles.iconWrap} ${styles.animateClock}`}>
                  <Clock size={13} className={styles.clockIcon} strokeWidth={2.7} />
                </div>
                <span className={styles.digitSegment}>{time.hours}</span>
                <span className={styles.digitColon}>:</span>
                <span className={styles.digitSegment}>{time.minutes}</span>
                <span className={styles.digitColon}>:</span>
                <span className={styles.digitSegment}>{time.seconds}</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className={styles.cardsRow}>
              {displayCountdown.map((deal) => {
                return (
                  <Link 
                    key={deal._id} 
                    href={`/products/${deal.slug}`} 
                    className={styles.dealCard}
                  >
                    <div className={styles.imageFrame}>
                      <Image
                        src={deal.image || "/placeholder.png"}
                        alt={deal.name}
                        fill
                        className={styles.productImage}
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                      {deal.discountPercent && deal.discountPercent > 0 && (
                        <span className={styles.discountTag}>
                          -{deal.discountPercent}%
                        </span>
                      )}
                    </div>

                    <div className={styles.cardDetails}>
                      <h4 className={styles.productName}>{deal.name}</h4>

                      <div className={styles.priceRow}>
                        <span className={styles.currentPrice}>
                          {formatPrice(deal.price)}
                        </span>
                        {deal.originalPrice && (
                          <span className={styles.oldPrice}>
                            {formatPrice(deal.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Minimalist Progress Line */}
                      <div className={styles.progressContainer}>
                        <div 
                          className={styles.progressTrack}
                          style={{ width: `${deal.claimedPercent || 75}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Link */}
            <div className={styles.columnFooter}>
              <Link href="/collections?sort=bestseller" className={styles.footerActionLink}>
                <span>Explore All Timed Drops</span>
                <ArrowRight size={13} strokeWidth={2.8} className={styles.footerArrow} />
              </Link>
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN: THE VAULT (Limited Quantity Archive)
             ================================================================= */}
          <div className={styles.showcaseColumn}>
            {/* Header */}
            <div className={styles.columnHeader}>
              <div className={styles.headerTitleGroup}>
                <span className={styles.columnKicker}>Exclusive Archive</span>
                <h2 className={styles.columnTitle}>The Vault</h2>
              </div>

              <div className={styles.vaultBadge}>
                <div className={`${styles.iconWrap} ${styles.animateFloat}`}>
                  <Lock size={12} className={styles.vaultIcon} strokeWidth={2.7} />
                </div>
                <span>Limited Runs</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className={styles.cardsRow}>
              {displayLimited.map((deal) => {
                return (
                  <Link 
                    key={deal._id} 
                    href={`/products/${deal.slug}`} 
                    className={styles.dealCard}
                  >
                    <div className={styles.imageFrame}>
                      <Image
                        src={deal.image || "/placeholder.png"}
                        alt={deal.name}
                        fill
                        className={styles.productImage}
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                      <span className={styles.stockStatusBadge}>
                        {deal.stockTag || `Only ${deal.stockRemaining || 3} left`}
                      </span>
                    </div>

                    <div className={styles.cardDetails}>
                      <h4 className={styles.productName}>{deal.name}</h4>

                      <div className={styles.priceRow}>
                        <span className={styles.currentPrice}>
                          {formatPrice(deal.price)}
                        </span>
                        {deal.originalPrice && (
                          <span className={styles.oldPrice}>
                            {formatPrice(deal.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Minimalist Star Rating */}
                      <div className={styles.ratingGroup}>
                        <Star size={12} fill="#996515" color="#996515" strokeWidth={0} />
                        <span className={styles.ratingNumber}>
                          {deal.averageRating ? deal.averageRating.toFixed(1) : "5.0"}
                        </span>
                        <span className={styles.reviewNumber}>
                          ({deal.reviewCount || 120})
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Link */}
            <div className={styles.columnFooter}>
              <Link href="/collections?sort=stock_asc" className={styles.footerActionLink}>
                <span>Explore The Vault Archive</span>
                <ArrowRight size={13} strokeWidth={2.8} className={styles.footerArrow} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
