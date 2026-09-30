"use client";

import { useState, useRef } from "react";
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
  const [hasMore, setHasMore] = useState(initialProducts.length >= (filter.limit || 100));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadingRef = useRef(false);

  // Time-based seed (changes every 1 hour) - must match Home page
  const currentWindowSeed = Math.floor(Date.now() / (60 * 60 * 1000));

  const loadMore = async () => {
    if (loadingRef.current || loading) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const batchSize = 60;
      const nextProducts = await fetchMoreProducts(filter, offset, batchSize);

      if (nextProducts.length > 0) {
        // Shuffle the new batch using the same window seed + offset to avoid same patterns
        const shuffledNext = shuffleArray(nextProducts, currentWindowSeed + offset);
        
        setProducts((prev) => [...prev, ...shuffledNext]);
        setOffset((prev) => prev + nextProducts.length);

        if (nextProducts.length < batchSize) {
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

  return (
    <>
      <FeaturedCollection products={products} title="" subtitle="" />

      {hasMore && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "2.5rem",
            marginBottom: "3rem",
            gap: "1rem",
          }}
        >
          {loading ? (
            <svg
              style={{
                animation: "spin 1s linear infinite",
                height: "2rem",
                width: "2rem",
                color: "#996515",
              }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                style={{ opacity: 0.25 }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Failed to load more products.
              </span>
              <button
                onClick={loadMore}
                style={{
                  padding: "0.75rem 2rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  backgroundColor: "#111827",
                  border: "none",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#996515";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#111827";
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              onClick={loadMore}
              style={{
                padding: "0.875rem 2.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#111827",
                backgroundColor: "transparent",
                border: "2px solid #d1cdc7",
                borderRadius: "9999px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#111827";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#111827";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#111827";
                e.currentTarget.style.borderColor = "#d1cdc7";
              }}
            >
              Load More
            </button>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
