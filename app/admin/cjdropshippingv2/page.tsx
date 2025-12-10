"use client";

import { useState } from "react";
import axios from "axios";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import styles from "./CJDropshipping.module.css";

export default function CJExactSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [importing, setImporting] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setProduct(null);

    try {
      const res = await axios.get(
        `/api/admin/dropshipping/search?q=${encodeURIComponent(query)}`
      );
      if (res.data.products && res.data.products.length > 0) {
        setProduct(res.data.products[0]);
      } else {
        toast.error("No product found for this URL/ID");
      }
    } catch (error) {
      toast.error("Failed to search product");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product: any) => {
    setImporting(product.pid);
    try {
      const res = await axios.post("/api/admin/dropshipping/import", {
        pid: product.pid,
      });

      if (res.data.success) {
        toast.success("Product imported successfully");
        router.push("/admin/products");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to import product");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>CJ Exact Search (V2)</h1>
        <p className={styles.subtitle}>
          Find exact items by pasting a product URL or PID. Seamlessly import
          high-quality products into your catalog.
        </p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste URL or PID here..."
            className={styles.input}
          />
          <button
            type="submit"
            disabled={loading || !query}
            className={styles.searchButton}
            title="Search"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {product && (
        <div className={styles.productCard}>
          <div className={styles.imageWrapper}>
            <Image
              src={product.productImage}
              alt={product.productName}
              fill
              className={styles.productImage}
            />
          </div>

          <div className={styles.details}>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles.badgePid}`}>
                PID: {product.pid}
              </span>
              <span className={`${styles.badge} ${styles.badgeSku}`}>
                SKU: {product.productSku}
              </span>
            </div>

            <h2 className={styles.productTitle}>{product.productName}</h2>

            <div className={styles.priceRow}>
              <span className={styles.price}>
                ${product.sellPrice || "0.00"}
              </span>
              <span className={styles.priceLabel}>Excl. Shipping</span>
            </div>

            <button
              onClick={() => handleImport(product)}
              disabled={importing === product.pid}
              className={styles.importButton}
            >
              {importing === product.pid ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <span>Import Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
