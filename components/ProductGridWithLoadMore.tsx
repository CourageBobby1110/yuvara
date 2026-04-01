"use client";

import { useState } from "react";
import FeaturedCollection from "@/components/FeaturedCollection";
import { Product } from "@/models/Product";
import { fetchMoreProducts } from "@/app/actions/products";
import { ProductFilter } from "@/lib/products";
import { shuffleArray } from "@/lib/utils";

interface ProductGridWithLoadMoreProps {
  initialProducts: Product[];
  filter: ProductFilter;
}

export default function ProductGridWithLoadMore({
  initialProducts,
  filter,
}: ProductGridWithLoadMoreProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [offset, setOffset] = useState(initialProducts.length);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 200);
  const [loading, setLoading] = useState(false);

  // Time-based seed (changes every 1 hour) - must match Home page
  const currentWindowSeed = Math.floor(Date.now() / (60 * 60 * 1000));

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const nextProducts = await fetchMoreProducts(filter, offset, 200);

      if (nextProducts.length > 0) {
        // Shuffle the new batch using the same window seed + offset to avoid same patterns
        const shuffledNext = shuffleArray(nextProducts, currentWindowSeed + offset);
        
        setProducts((prev) => [...prev, ...shuffledNext]);
        setOffset((prev) => prev + nextProducts.length);

        if (nextProducts.length < 200) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FeaturedCollection products={products} title="" subtitle="" />

      {hasMore && (
        <div className="flex justify-center mt-12 mb-20">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-10 py-4 bg-black text-white text-sm font-bold tracking-widest hover:bg-[#996515] hover:text-white border-2 border-transparent hover:border-[#996515] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-lg shadow-black/10"
          >
            {loading ? "Loading Abundance..." : "Load More Products"}
          </button>
        </div>
      )}
    </>
  );
}
