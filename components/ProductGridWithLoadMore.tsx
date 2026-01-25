"use client";

import { useState } from "react";
import FeaturedCollection from "@/components/FeaturedCollection";
import { Product } from "@/models/Product";
import { fetchMoreProducts } from "@/app/actions/products";
import { ProductFilter } from "@/lib/products";

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

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const nextProducts = await fetchMoreProducts(filter, offset, 200);

      if (nextProducts.length > 0) {
        setProducts((prev) => [...prev, ...nextProducts]);
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
        <div className="flex justify-center mt-8 mb-12">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 bg-black text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}
