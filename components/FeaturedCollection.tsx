"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/models/Product";
import { useCartStore } from "@/store/cart";
import QuickAddModal from "./QuickAddModal";
import { useCurrency } from "@/context/CurrencyContext";
import WishlistButton from "./WishlistButton";
import ProductCard from "./ProductCard";
import { getProductMainImage } from "@/lib/utils";
import styles from "./FeaturedCollection.module.css";

interface FeaturedCollectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export default function FeaturedCollection({
  products,
  title = "Curated Collection",
  subtitle = "The essence of modern craftsmanship.",
}: FeaturedCollectionProps) {
  const { addItem, openCart } = useCartStore();
  const { formatPrice } = useCurrency();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const handleQuickAdd = (product: Product) => {
    // If product has no variants, add directly
    const hasVariants =
      (product.sizes && product.sizes.length > 0) ||
      (product.colors && product.colors.length > 0);

    if (!hasVariants) {
      addItem({
        id: product._id,
        name: product.name,
        price: product.price,
        image: getProductMainImage(product),
        slug: product.slug,
      });
      openCart();
    } else {
      // Open modal for variants
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.masonryGrid}>
          {products.map((product) => (
            <div key={product._id} className={styles.masonryItem}>
              <ProductCard product={product} onQuickAdd={handleQuickAdd} />
            </div>
          ))}
        </div>

        {title && (
          <div className={styles.viewAllContainer}>
            <Link href="/collections" className={styles.viewAllButton}>
              View All Products
            </Link>
          </div>
        )}
      </div>

      <QuickAddModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
