"use client";

import { useState, useEffect } from "react";
import { Search, Download, Loader2, AlertCircle, Plug } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import styles from "./DropshippingSearch.module.css";

export default function DropshippingSearch() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data } = await axios.get("/api/admin/dropshipping/settings");
      setConnected(data.cjConnected);
    } catch (error) {
      console.error("Failed to check connection:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, pageNum = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setPage(pageNum);

    if (pageNum === 1) setProducts([]);

    try {
      const { data } = await axios.get(
        `/api/admin/dropshipping/search?q=${encodeURIComponent(
          query
        )}&page=${pageNum}`
      );
      if (data.error) {
        toast.error(data.error);
      } else {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        setConnected(false);
      }
      toast.error(error.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product: any) => {
    setImporting(product.pid);
    try {
      await axios.post("/api/admin/dropshipping/import", { pid: product.pid });
      toast.success("Product imported successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to import product");
    } finally {
      setImporting(null);
    }
  };

  const totalPages = Math.ceil(total / 60);

  if (checking) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loader} />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyStateContent}>
          <div className={styles.iconCircle}>
            <Plug size={32} color="#9ca3af" />
          </div>
          <h2 className={styles.emptyTitle}>Connect to CJ</h2>
          <p className={styles.emptyText}>
            To search and import products, connect your CJ Dropshipping account.
          </p>
          <Link
            href="/admin/dropshipping/settings"
            className={styles.primaryButton}
          >
            Connect Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Find Products</h1>
          <p className={styles.subtitle}>Search CJ Dropshipping catalog.</p>
        </div>
        <Link href="/admin/dropshipping/settings" className={styles.headerLink}>
          API Settings
        </Link>
      </div>

      <form onSubmit={(e) => handleSearch(e, 1)} className={styles.searchForm}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords or paste URL..."
            className={styles.searchInput}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={styles.searchButton}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
        </button>
      </form>

      {!searched && !loading && (
        <div className={styles.alertBox}>
          <AlertCircle className={styles.alertIcon} />
          <div>
            <h4 className={styles.alertTitle}>Pro Tip: Exact Import</h4>
            <p className={styles.alertText}>
              Paste a full CJ Dropshipping product URL to find that exact item.
            </p>
          </div>
        </div>
      )}

      {products.length > 0 ? (
        <>
          <div className={styles.grid}>
            {products.map((product) => (
              <div key={product.pid} className={styles.productCard}>
                <div className={styles.imageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className={styles.productImage}
                    loading="lazy"
                  />
                </div>
                <div className={styles.details}>
                  <h3
                    className={styles.productName}
                    title={product.productName}
                  >
                    {product.productName}
                  </h3>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>${product.sellPrice}</span>
                    {product.quantity && (
                      <span className={styles.stockBadge}>
                        Stock: {product.quantity}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleImport(product)}
                    disabled={importing === product.pid}
                    className={styles.importButton}
                  >
                    {importing === product.pid ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {importing === product.pid ? "Importing" : "Import"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handleSearch(undefined, page - 1)}
                disabled={page <= 1 || loading}
                className={styles.pageButton}
              >
                Prev
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handleSearch(undefined, page + 1)}
                disabled={page >= totalPages || loading}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        searched &&
        !loading && (
          <div className={styles.noResults}>
            <Search className={styles.noResultsIcon} />
            <h3 className={styles.noResultsTitle}>No products found</h3>
            <p className={styles.noResultsText}>
              Try different keywords or check your URL.
            </p>
          </div>
        )
      )}

      {!searched && !loading && (
        <div className={styles.defaultState}>
          <div className={styles.defaultIconCircle}>
            <Search size={32} color="#9ca3af" />
          </div>
          <h2 className={styles.defaultTitle}>Start your search</h2>
          <p className={styles.defaultText}>
            Enter keywords to find products from CJ Dropshipping.
          </p>
        </div>
      )}
    </div>
  );
}
