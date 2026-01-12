"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Product } from "@/models/Product";
import { useCurrency } from "@/context/CurrencyContext";
import WishlistButton from "./WishlistButton";
import { Share2, Star, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { getProductMainImage, getValidUrl } from "@/lib/utils";

import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onQuickAdd,
  index = 0,
}: ProductCardProps & { index?: number }) {
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();

  // Generate a predictable aspect ratio based on index for the masonry/staggered feel
  // We alternate between tall (3/4 - standard), taller (2/3), and slightly shorter (4/5)
  // This creates the "up and down" look
  const getAspectRatioStyle = (idx: number) => {
    const ratios = ["3/4", "2/3", "4/5", "3/4", "3/4", "9/16"];
    return { aspectRatio: ratios[idx % ratios.length] };
  };

  // Get second image for hover effect
  const mainImage = getProductMainImage(product);

  let hoverImage = mainImage;
  if (product.images && product.images.length > 1) {
    const secondImg = getValidUrl(product.images[1]);
    if (secondImg) {
      hoverImage = secondImg;
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let url = `${window.location.origin}/products/${product.slug}`;

    // Append referral code if user is logged in and has one
    if (session?.user?.referralCode) {
      url += `?ref=${session.user.referralCode}`;
    }

    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: product.description,
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onQuickAdd) {
      onQuickAdd(product);
    } else {
      // Fallback if no handler provided (shouldn't happen in FeaturedCollection)
      window.location.href = `/products/${product.slug}`;
    }
  };

  const isOutOfStock = !product.variants?.length && product.stock <= 0;

  return (
    <div className={styles.card}>
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className={styles.imageLink}
        style={getAspectRatioStyle(index)}
      >
        <Image
          src={mainImage}
          alt={product.name || "Product"}
          fill
          className={styles.productImage}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Hover Image */}
        {hoverImage !== mainImage && (
          <Image
            src={hoverImage}
            alt={product.name || "Product Hover"}
            fill
            className={`${styles.productImage} ${styles.productImageHover}`}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        )}

        {/* Overlay Gradient */}
        <div className={styles.overlay} />

        {/* Badges */}
        <div className={styles.badges}>
          {product.isFeatured && (
            <span className={`${styles.badge} ${styles.badgeFeatured}`}>
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className={`${styles.badge} ${styles.badgeSoldOut}`}>
              Sold Out
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <div className={styles.actionButton}>
            <WishlistButton productId={product._id} />
          </div>
          <button
            onClick={handleQuickAddClick}
            disabled={isOutOfStock}
            className={`${styles.actionButton} ${
              isOutOfStock ? styles.actionButtonDisabled : ""
            }`}
            aria-label="Quick Add"
          >
            <ShoppingCart size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleShare}
            className={styles.actionButton}
            aria-label="Share product"
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className={styles.info}>
        <div className={styles.headerRow}>
          <p className={styles.category}>{product.category}</p>

          {/* Reviews */}
          <div className={styles.reviews}>
            <Star size={12} className={styles.starIcon} />
            <span className={styles.rating}>
              {product.averageRating ? product.averageRating.toFixed(1) : "0.0"}
            </span>
            <span className={styles.reviewCount}>
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>

        <Link href={`/products/${product.slug}`} className={styles.titleLink}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>

        <div className={styles.priceRow}>
          <p className={styles.price}>{formatPrice(product.price)}</p>
        </div>
      </div>
    </div>
  );
}
