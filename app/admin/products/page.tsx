"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLoader from "@/components/AdminLoader";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./AdminProducts.module.css";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  cjPid?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [markupActive, setMarkupActive] = useState(false);

  const { currency, setCurrency, formatPrice } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      const sanitizedData = Array.isArray(data)
        ? data.map((p: any) => ({
            ...p,
            images: Array.isArray(p.images)
              ? p.images
                  .map((img: any) => {
                    let str = String(img || "").trim();
                    if (!str) return "";
                    // Basic cleanup logic from original
                    if (str.startsWith("[") || str.startsWith('"')) {
                      const urlMatch = str.match(/https?:\/\/[^"'\s\]]+/);
                      if (urlMatch) str = urlMatch[0];
                      else str = str.replace(/[\[\]"']/g, "");
                    }
                    str = str.replace(/^["']|["']$/g, "");
                    if (str.startsWith("//")) return `https:${str}`;
                    if (!str.startsWith("/") && !str.startsWith("http"))
                      return `https://${str}`;
                    return str;
                  })
                  .filter((img: string) => img !== "")
              : [],
          }))
        : [];
      setProducts(sanitizedData);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkupToggle = async () => {
    const newActiveState = !markupActive;
    const modifier = newActiveState ? 1.1 : 1 / 1.1;
    const targetIds =
      selectedProducts.length > 0
        ? selectedProducts
        : filteredProducts.map((p) => p._id);

    if (targetIds.length === 0) {
      toast.error("No products to update");
      return;
    }

    const message = newActiveState
      ? `Apply 10% price increase to ${targetIds.length} products?\n(Price * 1.1)`
      : `Remove 10% price markup from ${targetIds.length} products?\n(Price / 1.1)`;

    if (!confirm(message)) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/products/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targetIds, modifier }),
      });

      if (res.ok) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isMarkupActive: newActiveState }),
        });
        toast.success(newActiveState ? "Markup applied!" : "Markup removed!");
        setMarkupActive(newActiveState);
        await fetchProducts();
      } else {
        toast.error("Failed to update prices");
      }
    } catch (error) {
      console.error("error", error);
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const settings = await res.json();
          if (typeof settings.isMarkupActive === "boolean")
            setMarkupActive(settings.isMarkupActive);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p._id !== id));
        setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedProducts.length} products?`,
      )
    )
      return;

    try {
      const res = await fetch("/api/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProducts }),
      });

      if (res.ok) {
        toast.success("Products deleted successfully");
        setProducts(products.filter((p) => !selectedProducts.includes(p._id)));
        setSelectedProducts([]);
      } else {
        toast.error("Failed to delete products");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked)
      setSelectedProducts(filteredProducts.map((p) => p._id));
    else setSelectedProducts([]);
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Products</h1>

        <div className={styles.controlsWrapper}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.actionsGroup}>
            <div className={styles.toggleWrapper}>
              <span className={styles.toggleLabel}>10% Markup</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={markupActive}
                  onChange={handleMarkupToggle}
                  disabled={updating}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {selectedProducts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className={`${styles.actionButton} ${styles.destructiveButton}`}
              >
                Delete Selected ({selectedProducts.length})
              </button>
            )}

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className={styles.secondaryButton} // Reusing styling
              style={{
                padding: "0.625rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              <option value="USD">USD ($)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>

            <Link
              href="/admin/products/new"
              className={`${styles.actionButton} ${styles.primaryButton}`}
            >
              + Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Component */}
      <div className={styles.mobileList}>
        {paginatedProducts.map((product) => (
          <div key={product._id} className={styles.productCard}>
            <input
              type="checkbox"
              className={styles.cardCheckbox}
              checked={selectedProducts.includes(product._id)}
              onChange={() => handleSelectProduct(product._id)}
            />
            <div className={styles.cardImageWrapper}>
              <Image
                src={product.images[0] || "/placeholder.png"}
                alt={product.name}
                fill
                className={styles.productImage}
              />
            </div>
            <div className={styles.cardContent}>
              <div>
                <div className={styles.cardTitle}>{product.name}</div>
                <div className={styles.cardCategory}>{product.category}</div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.cardPrice}>
                  {formatPrice(product.price)}
                </div>
                <div className={styles.cardStock}>Stock: {product.stock}</div>
              </div>
              <div className={styles.cardActions}>
                <Link
                  href={`/admin/products/${product._id}`}
                  className={styles.cardActionBtn}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className={styles.cardActionBtn}
                  style={{
                    color: "#ef4444",
                    borderColor: "#fecaca",
                    background: "#fee2e2",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {paginatedProducts.length === 0 && (
          <div className={styles.emptyState}>No products found.</div>
        )}
      </div>

      {/* Desktop Table Component */}
      <div className={styles.desktopTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    filteredProducts.length > 0 &&
                    filteredProducts.every((p) =>
                      selectedProducts.includes(p._id),
                    )
                  }
                />
              </th>
              <th className={styles.th}>Image</th>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Price</th>
              <th className={styles.th}>Stock</th>
              <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product._id} className={styles.tr}>
                <td className={styles.td}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => handleSelectProduct(product._id)}
                  />
                </td>
                <td className={styles.td}>
                  <Image
                    src={product.images[0] || "/placeholder.png"}
                    alt={product.name}
                    width={48}
                    height={48}
                    className={styles.tableImage}
                  />
                </td>
                <td className={`${styles.td} ${styles.productName}`}>
                  {product.name}
                </td>
                <td className={styles.td}>{product.category}</td>
                <td className={`${styles.td} ${styles.productPrice}`}>
                  {formatPrice(product.price)}
                </td>
                <td className={styles.td}>{product.stock}</td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={styles.actionLinks}>
                    <Link
                      href={`/admin/products/${product._id}`}
                      className={styles.editLink}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className={styles.deleteLink}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (Shared) */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
          {filteredProducts.length} results
        </div>
        <div className={styles.pageControls}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          {/* Simplified pagination for now */}
          <span
            className={styles.pageBtn}
            style={{ border: "none", background: "transparent" }}
          >
            {currentPage} / {totalPages || 1}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
