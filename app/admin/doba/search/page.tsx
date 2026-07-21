"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Loader2,
  AlertCircle,
  Package,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import styles from "./DobaSearch.module.css";

export default function DobaSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setProducts([]);

    try {
      const res = await fetch(
        `/api/admin/doba/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        if (data.products.length === 0) {
          setError("No products found.");
        }
      } else {
        setError(data.error || "Failed to fetch products");
      }
    } catch (err) {
      setError("An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product: any) => {
    setImporting(product.id);
    try {
      const res = await fetch("/api/admin/doba/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Product imported successfully!");
      } else {
        toast.error(data.error || "Failed to import product");
      }
    } catch (err) {
      toast.error("An error occurred during import");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Doba Dropshipping</h1>
          <p className={styles.subtitle}>Search and import products from Doba</p>
        </div>
        <Link href="/admin/settings" className={styles.settingsLink}>
          <Settings size={14} />
          Configure API Keys
        </Link>
      </div>

      {/* Search Bar */}
      <div className={styles.card}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products on Doba..."
              className={styles.searchInput}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={styles.searchButton}
          >
            {loading ? (
              <Loader2 size={18} className={styles.spinnerIcon} />
            ) : (
              <>
                <Search size={18} />
                <span className={styles.searchButtonText}>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      <div className={styles.productGrid}>
        {products.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.imageWrapper}>
              <Image
                src={product.image}
                alt={product.title}
                fill
                className={styles.productImage}
              />
            </div>

            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.title}</h3>

              <div className={styles.priceRow}>
                <div className={styles.priceBlock}>
                  <span className={styles.priceLabel}>Cost</span>
                  <span className={styles.price}>${product.price}</span>
                </div>
                {product.shipping > 0 && (
                  <div className={styles.priceBlock}>
                    <span className={styles.priceLabel}>Shipping</span>
                    <span className={styles.priceSecondary}>${product.shipping}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.stockInfo}>
                  Stock: {product.inventory}
                </span>
                <button
                  onClick={() => handleImport(product)}
                  disabled={importing === product.id}
                  className={styles.importButton}
                >
                  {importing === product.id ? (
                    <Loader2 size={14} className={styles.spinnerIcon} />
                  ) : (
                    <Download size={14} />
                  )}
                  Import
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && !error && (
        <div className={styles.emptyState}>
          <Package size={40} />
          <p>Search for products to start importing from Doba</p>
        </div>
      )}
    </div>
  );
}
