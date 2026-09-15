"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import { getItemShippingRateUSD } from "@/lib/utils";
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
  category?: string;
  shippingRates?: { countryCode: string; price: number | string }[];
}

interface HeroProps {
  countdownDeals?: DealItem[];
  limitedDeals?: DealItem[];
}

function isValidDeal(d: DealItem) {
  if (!d || typeof d.price !== "number" || d.price <= 0 || isNaN(d.price))
    return false;
  if (
    d.stockRemaining !== undefined &&
    d.stockRemaining !== null &&
    d.stockRemaining <= 0
  )
    return false;
  return true;
}

export default function Hero({
  countdownDeals = [],
  limitedDeals = [],
}: HeroProps) {
  const { formatPrice, userCountryCode } = useCurrency();

  // Merge both feeds, de-dupe, keep only real in-stock products. Max 4.
  const seen = new Set<string>();
  const featured: DealItem[] = [];
  for (const d of [...(countdownDeals || []), ...(limitedDeals || [])]) {
    if (!isValidDeal(d)) continue;
    const key = d.productId || d._id || d.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    featured.push(d);
    if (featured.length >= 4) break;
  }

  if (featured.length === 0) return null;

  return (
    <section className={styles.heroSection} aria-label="Featured products">
      <div className={styles.container}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>Featured</span>
          <Link href="/collections" className={styles.viewAll}>
            View all <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className={styles.grid}>
          {featured.map((deal) => {
            const shipping = userCountryCode
              ? getItemShippingRateUSD(
                  { shippingRates: deal.shippingRates } as any,
                  userCountryCode
                )
              : 0;
            const price = deal.price + shipping;
            const original = deal.originalPrice
              ? deal.originalPrice + shipping
              : undefined;
            const showOriginal = original !== undefined && original > price;
            const discount =
              deal.discountPercent && deal.discountPercent > 0
                ? Math.round(deal.discountPercent)
                : showOriginal
                  ? Math.round(((original! - price) / original!) * 100)
                  : 0;
            const lowStock =
              deal.stockRemaining !== undefined &&
              deal.stockRemaining !== null &&
              deal.stockRemaining > 0 &&
              deal.stockRemaining <= 5
                ? deal.stockRemaining
                : null;

            return (
              <Link
                key={deal._id || deal.productId || deal.slug}
                href={`/products/${deal.slug}`}
                className={styles.card}
              >
                <div className={styles.imageWrap}>
                  <Image
                    src={deal.image || "/placeholder.png"}
                    alt={deal.name}
                    fill
                    className={styles.productImage}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {discount > 0 && (
                    <span className={styles.discountBadge}>-{discount}%</span>
                  )}
                </div>

                <div className={styles.meta}>
                  <h3 className={styles.productName}>{deal.name}</h3>
                  <div className={styles.priceRow}>
                    <span className={styles.currentPrice}>
                      {formatPrice(price)}
                    </span>
                    {showOriginal && (
                      <span className={styles.oldPrice}>
                        {formatPrice(original!)}
                      </span>
                    )}
                  </div>
                  {lowStock !== null && (
                    <span className={styles.lowStock}>
                      Only {lowStock} left
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
