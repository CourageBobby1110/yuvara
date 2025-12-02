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
        image: product.images?.[0] || "/placeholder.png",
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
    <section className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            {title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg px-4">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>

        {title && (
          <div className="text-center mt-12 md:mt-16">
            <Link
              href="/collections"
              className="inline-block bg-black text-white px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
            >
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
