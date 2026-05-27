"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [markupActive, setMarkupActive] = useState(false);

  const { currency, setCurrency, formatPrice } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isWorker = session?.user?.role === "worker";

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
            category:
              p.category && p.category.includes(">")
                ? p.category.split(">").pop()?.trim() || p.category
                : p.category,
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
    const targetIds = filteredProducts.map((p) => p._id);

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

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeletePassword("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    if (!deletePassword) {
      toast.error("Password is required");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTargetId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product deleted successfully");
        setProducts(products.filter((p) => p._id !== deleteTargetId));
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
        setDeletePassword("");
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product", error);
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
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
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.actionsWrapper}>
            {!isWorker && (
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
            )}

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className={styles.currencySelect}
            >
              <option value="USD">USD ($)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>

            <Link href="/admin/products/new" className={styles.addButton}>
              + Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Component */}
      <div className={styles.mobileList}>
        {paginatedProducts.map((product) => (
          <div key={product._id} className={styles.productCard}>
            {/* Top Section: Image + Details */}
            <div className={styles.cardMain}>

              <div className={styles.productCardImageWrapper}>
                <Image
                  src={product.images[0] || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className={styles.productImage}
                />
              </div>

              <div className={styles.productCardContent}>
                <div>
                  <div className={styles.productCardCategory}>
                    {product.category}
                  </div>
                  <div className={styles.productCardName}>{product.name}</div>
                  <div className={styles.productCardStock}>
                    {product.stock} in stock
                  </div>
                </div>

                <div className={styles.productCardFooter}>
                  <div className={styles.productCardPrice}>
                    {formatPrice(product.price)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Full-Width Actions */}
            <div className={styles.productCardActions}>
              <Link
                href={`/admin/products/${product._id}`}
                className={`${styles.actionButton} ${styles.editAction}`}
              >
                Edit
              </Link>
              {!isWorker && (
                <button
                  onClick={() => handleDelete(product._id)}
                  className={`${styles.actionButton} ${styles.deleteAction}`} // Added deleteAction class
                >
                  Delete
                </button>
              )}
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
                    {!isWorker && (
                      <button
                        onClick={() => handleDelete(product._id)}
                        className={styles.deleteLink}
                      >
                        Delete
                      </button>
                    )}
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
        <div className={styles.paginationControls}>
          <div className={styles.paginationButtons}>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className={styles.pageButton}
              style={{ border: "none", background: "transparent", width: "auto", padding: "0 0.5rem" }}
            >
              {currentPage} / {totalPages || 1}
            </span>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmDelete();
            }}
            className={styles.modalContent}
          >
            <h2 className={styles.modalTitle}>Confirm Deletion</h2>
            <p className={styles.modalText}>
              This action cannot be undone. Please enter the administrator deletion password to proceed.
            </p>
            
            {/* Dummy hidden inputs to prevent browser autofill hijacking the main search input */}
            <input
              type="text"
              name="email"
              autoComplete="username"
              style={{ display: "none" }}
              readOnly
            />
            
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={styles.passwordInput}
              autoComplete="new-password"
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTargetId(null);
                  setDeletePassword("");
                }}
                className={styles.cancelBtn}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.confirmBtn}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
