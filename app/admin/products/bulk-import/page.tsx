"use client";

import { useState } from "react";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";
import styles from "./BulkImport.module.css";
import { Search, Download, CheckCircle2, XCircle, Loader2, Package } from "lucide-react";
import AdminSkeleton from "@/components/AdminSkeleton";

export default function BulkImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [importStatus, setImportStatus] = useState<
    Record<string, "pending" | "loading" | "success" | "error">
  >({});
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultStock, setDefaultStock] = useState("100");
  const [markupPercentage, setMarkupPercentage] = useState("50");

  const handleFetchList = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProducts([]);
    setSelectedProducts(new Set());
    setImportStatus({});

    try {
      const res = await fetch("/api/admin/scraper/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch listings");
      }

      setProducts(data.products);
      const allUrls = new Set<string>(
        data.products.map((p: any) => p.url as string)
      );
      setSelectedProducts(allUrls);
      toast.success(`Found ${data.products.length} products`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (productUrl: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productUrl)) {
      newSelection.delete(productUrl);
    } else {
      newSelection.add(productUrl);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkImport = async () => {
    if (!defaultCategory) {
      toast.error("Please select a default category for these products");
      return;
    }

    const productsToImport = products.filter((p) =>
      selectedProducts.has(p.url)
    );

    const initialStatus: any = {};
    productsToImport.forEach((p) => (initialStatus[p.url] = "pending"));
    setImportStatus(initialStatus);

    for (const product of productsToImport) {
      setImportStatus((prev) => ({ ...prev, [product.url]: "loading" }));

      try {
        const detailsRes = await fetch("/api/admin/import-aliexpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: product.url }),
        });

        if (!detailsRes.ok) {
          throw new Error("Failed to fetch details");
        }
        const details = await detailsRes.json();

        const originalPrice = details.price || 0;
        const shipping = details.shippingFee || 0;
        const totalCost = originalPrice + shipping;
        const sellingPrice =
          totalCost * (1 + parseFloat(markupPercentage) / 100);

        const payload = {
          name: details.title,
          description: details.description,
          price: parseFloat(sellingPrice.toFixed(2)),
          category: defaultCategory,
          stock: parseInt(defaultStock),
          slug:
            details.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .slice(0, 50) +
            "-" +
            Date.now().toString().slice(-4),
          images: details.images.slice(0, 5),
          variants: details.variants || [],
          sizes: details.sizes || [],
          colors: details.colors || [],
          productUrl: details.originalUrl,
          isFeatured: false,
          reviewsEnabled: true,
        };

        const saveRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!saveRes.ok) {
          throw new Error("Failed to save product");
        }

        setImportStatus((prev) => ({ ...prev, [product.url]: "success" }));
      } catch (error: any) {
        setImportStatus((prev) => ({ ...prev, [product.url]: "error" }));
        toast.error(`Failed to import: ${error.message}`);
      }
    }

    toast.success("Bulk import process completed");
  };

  if (loading && products.length === 0) return <AdminSkeleton variant="cards" />;

  const successCount = Object.values(importStatus).filter((s) => s === "success").length;
  const errorCount = Object.values(importStatus).filter((s) => s === "error").length;
  const hasImporting = Object.values(importStatus).some((s) => s === "loading");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bulk Product Import</h1>
        <p className={styles.subtitle}>Scrape and import products from external stores</p>
      </div>

      {/* Search Section */}
      <div className={styles.card}>
        <form onSubmit={handleFetchList} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste category URL (Jumia, Amazon, etc.)"
              className={styles.searchInput}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.scanButton}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinnerIcon} />
                Scanning...
              </>
            ) : (
              <>
                <Search size={16} />
                Scan Page
              </>
            )}
          </button>
        </form>
      </div>

      {products.length > 0 && (
        <div className={styles.resultsSection}>
          {/* Settings Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Import Settings</h2>
            </div>
            <div className={styles.settingsGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Default Category</label>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Default Stock</label>
                <input
                  type="number"
                  value={defaultStock}
                  onChange={(e) => setDefaultStock(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Markup %</label>
                <input
                  type="number"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className={styles.actionsBar}>
            <div className={styles.selectionInfo}>
              <span className={styles.selectionCount}>
                {selectedProducts.size} / {products.length}
              </span>
              <span className={styles.selectionLabel}>selected</span>
            </div>

            {(successCount > 0 || errorCount > 0) && (
              <div className={styles.importSummary}>
                {successCount > 0 && (
                  <span className={styles.summarySuccess}>
                    <CheckCircle2 size={14} />
                    {successCount}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className={styles.summaryError}>
                    <XCircle size={14} />
                    {errorCount}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleBulkImport}
              disabled={selectedProducts.size === 0 || !defaultCategory || hasImporting}
              className={styles.importButton}
            >
              {hasImporting ? (
                <>
                  <Loader2 size={16} className={styles.spinnerIcon} />
                  Importing...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Import Selected
                </>
              )}
            </button>
          </div>

          {/* Product Grid */}
          <div className={styles.productGrid}>
            {products.map((product) => (
              <div
                key={product.url}
                className={`${styles.productCard} ${
                  selectedProducts.has(product.url) ? styles.productCardSelected : ""
                }`}
              >
                <div className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.url)}
                    onChange={() => toggleSelection(product.url)}
                    className={styles.checkbox}
                  />
                </div>

                {importStatus[product.url] && (
                  <div
                    className={`${styles.statusBadge} ${
                      importStatus[product.url] === "success"
                        ? styles.statusSuccess
                        : importStatus[product.url] === "error"
                        ? styles.statusError
                        : importStatus[product.url] === "loading"
                        ? styles.statusLoading
                        : styles.statusPending
                    }`}
                  >
                    {importStatus[product.url] === "success" && <CheckCircle2 size={12} />}
                    {importStatus[product.url] === "error" && <XCircle size={12} />}
                    {importStatus[product.url] === "loading" && <Loader2 size={12} className={styles.spinnerIcon} />}
                    {importStatus[product.url].toUpperCase()}
                  </div>
                )}

                <div className={styles.imageWrapper}>
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className={styles.productImage}
                    />
                  ) : (
                    <div className={styles.noImage}>
                      <Package size={24} />
                    </div>
                  )}
                </div>

                <div className={styles.productInfo}>
                  <h3 className={styles.productName} title={product.title}>
                    {product.title}
                  </h3>
                  <div className={styles.productPrice}>{product.price}</div>
                  <div className={styles.productPlatform}>{product.platform}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
