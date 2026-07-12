"use client";

import { useState, useEffect, useRef } from "react";
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
  const [hasMore, setHasMore] = useState(initialProducts.length >= 40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Time-based seed (changes every 1 hour) - must match Home page
  const currentWindowSeed = Math.floor(Date.now() / (60 * 60 * 1000));

  const loadMore = async () => {
    if (loadingRef.current || loading) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const nextProducts = await fetchMoreProducts(filter, offset, 40);

      if (nextProducts.length > 0) {
        // Shuffle the new batch using the same window seed + offset to avoid same patterns
        const shuffledNext = shuffleArray(nextProducts, currentWindowSeed + offset);
        
        setProducts((prev) => [...prev, ...shuffledNext]);
        setOffset((prev) => prev + nextProducts.length);

        if (nextProducts.length < 40) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more products:", err);
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!hasMore || !currentLoader || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentLoader);

    return () => {
      observer.unobserve(currentLoader);
    };
  }, [hasMore, offset, error]);

  return (
    <>
      <FeaturedCollection products={products} title="" subtitle="" />

      {hasMore && (
        <div ref={loaderRef} className="w-full flex flex-col justify-center items-center h-auto mt-10 mb-20 gap-4">
          {loading ? (
            <svg
              className="animate-spin h-8 w-8 text-[#bfa15f]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : error ? (
            <div className="flex flex-col items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">Failed to load more products.</span>
              <button
                onClick={loadMore}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-black hover:bg-[#bfa15f] transition-all duration-300 rounded-full shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="h-px w-16 bg-[#bfa15f]/20"></div>
          )}
        </div>
      )}
    </>
  );
}
