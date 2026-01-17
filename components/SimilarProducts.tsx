"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/models/Product";
import styles from "./SimilarProducts.module.css";

interface SimilarProductsProps {
  currentProductId: string;
  category: string;
}

export default function SimilarProducts({
  currentProductId,
  category,
}: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        // Fetch slightly more to account for filtering current product
        const res = await fetch(
          `/api/products?category=${encodeURIComponent(category)}&limit=5`,
        );
        if (res.ok) {
          const data = await res.json();
          const filtered = data
            .filter((p: Product) => p._id !== currentProductId)
            .slice(0, 4); // Keep top 4
          setProducts(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch similar products", error);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchSimilar();
    } else {
      setLoading(false);
    }
  }, [category, currentProductId]);

  if (loading) return null; // Or a skeleton
  if (products.length === 0) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>You May Also Like</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
