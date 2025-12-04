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

    // Only clear products if it's a new search, not pagination
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
        // Likely auth error
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
      // We send the PID to the backend to fetch full details and save
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
        <Loader2 className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className={styles.container}>
        <div className={styles.connectionState}>
          <div className={styles.connectionIconWrapper}>
            <Plug className={styles.connectionIcon} />
          </div>
          <h2 className={styles.connectionTitle}>Connect to CJ Dropshipping</h2>
          <p className={styles.connectionText}>
            To search and import products, you need to connect your CJ
            Dropshipping account first. It only takes a minute.
          </p>
          <Link
            href="/admin/dropshipping/settings"
            className={styles.connectionButton}
          >
            Go to Settings & Connect
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
          <p className={styles.subtitle}>
            Search the CJ Dropshipping catalog and import directly to your
            store.
          </p>
        </div>
        <Link
          href="/admin/dropshipping/settings"
          className={styles.settingsLink}
        >
          Configure API Settings
        </Link>
      </div>

      <form onSubmit={(e) => handleSearch(e, 1)} className={styles.searchForm}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword or paste CJ Product URL..."
            className={styles.searchInput}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={styles.searchButton}
        >
          {loading ? <Loader2 className={styles.loadingSpinner} /> : "Search"}
        </button>
      </form>

      <div className={styles.infoBanner}>
        <AlertCircle className={styles.infoBannerIcon} />
        <div className={styles.infoBannerContent}>
          <h4>Pro Tip: Paste a CJ Product URL</h4>
          <p>
            Found a product you like on cjdropshipping.com? Just copy and paste
            the full URL here to find and import that exact product instantly.
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <>
          <div className={styles.productsGrid}>
            {products.map((product) => (
              <div key={product.pid} className={styles.productCard}>
                <div className={styles.productImageWrapper}>
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className={styles.productImage}
                  />
                  <div className={styles.productBadge}>CJ</div>
                </div>
                <div className={styles.productContent}>
                  <h3
                    className={styles.productName}
                    title={product.productName}
                  >
                    {product.productName}
                  </h3>
                  <div className={styles.productPriceSection}>
                    <div>
                      <p className={styles.priceLabel}>Cost Price</p>
                      <span className={styles.priceValue}>
                        ${product.sellPrice}
                      </span>
                    </div>
                  </div>

                  {product.shippingInfo && product.shippingInfo.length > 0 && (
                    <div className={styles.shippingInfo}>
                      <p className={styles.shippingTitle}>Est. Shipping:</p>
                      <div className={styles.shippingList}>
                        {product.shippingInfo.map((info: any) => (
                          <div
                            key={info.country}
                            className={styles.shippingItem}
                          >
                            <span className={styles.shippingCountry}>
                              {info.country}:
                            </span>
                            <span className={styles.shippingPrice}>
                              ${info.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleImport(product)}
                    disabled={importing === product.pid}
                    className={styles.importButton}
                  >
                    {importing === product.pid ? (
                      <>
                        <Loader2 className={styles.loadingSpinner} />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download size={20} />
                        Import Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handleSearch(undefined, page - 1)}
                disabled={page <= 1 || loading}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span className={styles.paginationText}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handleSearch(undefined, page + 1)}
                disabled={page >= totalPages || loading}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        searched &&
        !loading && (
          <div className={styles.emptyState}>
            <Search className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>No products found</h3>
            <p className={styles.emptyStateText}>
              We couldn't find any products matching "{query}". If you pasted a
              URL, make sure it's a valid CJ Dropshipping product link.
              Otherwise, try different keywords.
            </p>
          </div>
        )
      )}

      {!searched && !loading && (
        <div className={styles.initialState}>
          <div className={styles.initialStateIconWrapper}>
            <Search className={styles.initialStateIcon} />
          </div>
          <h2 className={styles.initialStateTitle}>Start your search</h2>
          <p className={styles.initialStateText}>
            Enter a keyword above to find winning products from CJ
            Dropshipping's massive catalog.
          </p>
        </div>
      )}
    </div>
  );
}
