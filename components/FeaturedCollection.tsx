"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/models/Product";
import { useCartStore } from "@/store/cart";
import QuickAddModal from "./QuickAddModal";
import { useCurrency } from "@/context/CurrencyContext";
import WishlistButton from "./WishlistButton";

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
        image: product.images[0] || "/placeholder.png",
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
    <section className="py-12 md:py-20 bg-white">
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
            <div key={product._id} className="group relative">
              <Link
                href={`/products/${product.slug}`}
                className="block relative aspect-[3/4] overflow-hidden bg-gray-100 mb-3 md:mb-4 rounded-lg"
              >
                <Image
                  src={product.images[0] || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                {product.isFeatured && (
                  <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-[var(--color-luxury-gold)] text-white text-xs px-2 py-1 md:px-3 md:py-1 font-medium">
                    Featured
                  </span>
                )}

                {/* Wishlist Button */}
                <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                  <WishlistButton productId={product._id} />
                </div>

                {/* Quick Add Button - always visible on mobile, hover on desktop */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (
                      product.stock > 0 ||
                      (product.variants && product.variants.length > 0)
                    ) {
                      handleQuickAdd(product);
                    }
                  }}
                  disabled={!product.variants?.length && product.stock <= 0}
                  className={`absolute bottom-4 left-4 right-4 py-2 md:py-3 px-4 md:px-6 font-semibold text-sm md:text-base opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-lg ${
                    !product.variants?.length && product.stock <= 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:bg-[var(--color-luxury-gold)] hover:text-white"
                  }`}
                >
                  {!product.variants?.length && product.stock <= 0
                    ? "Out of Stock"
                    : "Quick Add"}
                </button>
              </Link>

              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 hover:text-[var(--color-luxury-gold)] transition-colors mb-1 truncate">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {product.category}
                  </p>
                </div>
                <p className="font-bold text-sm md:text-base text-gray-900 flex-shrink-0">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {title && (
          <div className="text-center mt-12 md:mt-16">
            <Link
              href="/collections"
              className="inline-block bg-black text-white px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-semibold hover:bg-[var(--color-luxury-gold)] transition-colors duration-300"
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
