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
  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [markupActive, setMarkupActive] = useState(false);

  const { currency, setCurrency, formatPrice } = useCurrency();

  // Search & Pagination State
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

      // Sanitize data to ensure images are always an array of strings
      const sanitizedData = Array.isArray(data)
        ? data.map((p: any) => ({
            ...p,
            images: Array.isArray(p.images)
              ? p.images
                  .map((img: any) => {
                    let str = String(img || "").trim();
                    if (!str) return "";

                    // Handle JSON stringified arrays or strings (e.g., '["url"]' or '"url"')
                    if (str.startsWith("[") || str.startsWith('"')) {
                      // Try extracting URL with regex first (most robust for malformed JSON)
                      const urlMatch = str.match(/https?:\/\/[^"'\s\]]+/);
                      if (urlMatch) {
                        str = urlMatch[0];
                      } else {
                        // Fallback: manually strip brackets and quotes if no http detected
                        str = str.replace(/[\[\]"']/g, "");
                      }
                    }

                    // Clean quotes if they remain
                    str = str.replace(/^["']|["']$/g, "");

                    if (str.startsWith("//")) return `https:${str}`;
                    if (!str.startsWith("/") && !str.startsWith("http")) {
                      return `https://${str}`;
                    }
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

    // Use selected products if any, otherwise use ALL filtered products
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
      // 1. Update prices via bulk-update
      const res = await fetch("/api/products/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targetIds, modifier }),
      });

      if (res.ok) {
        // 2. Save the new toggle state to settings
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
      console.error("Error updating prices", error);
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
          if (typeof settings.isMarkupActive === "boolean") {
            setMarkupActive(settings.isMarkupActive);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

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
        `Are you sure you want to delete ${selectedProducts.length} products?`
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
      console.error("Error bulk deleting", error);
      toast.error("Something went wrong");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible products (paginated or filtered? usually filtered)
      // Let's select all filtered products for better UX
      setSelectedProducts(filteredProducts.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>

        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search products..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.actionsWrapper}>
          <div className={styles.toggleWrapper}>
            <span className={styles.toggleLabel}>10%Markup</span>
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
              className={`${styles.actionButton} ${styles.deleteAction} mr-2`}
            >
              Delete Selected ({selectedProducts.length})
            </button>
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
            Add New Product
          </Link>
        </div>
      </div>

      {/* Mobile Product Cards */}
      <div className={styles.mobileList}>
        {paginatedProducts.map((product) => (
          <div key={product._id} className={styles.productCard}>
            <div className="p-2">
              <input
                type="checkbox"
                checked={selectedProducts.includes(product._id)}
                onChange={() => handleSelectProduct(product._id)}
                className="w-5 h-5"
              />
            </div>
            <div className={styles.productCardImageWrapper}>
              <Image
                src={product.images[0] || "/placeholder.png"}
                alt={product.name}
                fill
                className={styles.productImage}
              />
            </div>
            <div className={styles.productCardContent}>
              <div className={styles.productCardName}>{product.name}</div>
              <div className={styles.productCardCategory}>
                {product.category}
              </div>
              <div className={styles.productCardFooter}>
                <div className={styles.productCardPrice}>
                  {formatPrice(product.price)}
                </div>
                <div className={styles.productCardStock}>
                  Stock: {product.stock}
                </div>
              </div>
              <div className={styles.productCardActions}>
                <Link
                  href={`/admin/products/${product._id}`}
                  className={`${styles.actionButton} ${styles.editAction}`}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className={`${styles.actionButton} ${styles.deleteAction}`}
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

      {/* Desktop Table */}
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
                      selectedProducts.includes(p._id)
                    )
                  }
                  className="w-4 h-4"
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
                    className="w-4 h-4"
                  />
                </td>
                <td className={styles.td}>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={product.images[0] || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className={styles.productImage}
                    />
                  </div>
                </td>
                <td className={`${styles.td} ${styles.productName}`}>
                  {product.name}
                </td>
                <td className={`${styles.td} ${styles.productCategory}`}>
                  {product.category}
                </td>
                <td className={`${styles.td} ${styles.productPrice}`}>
                  {formatPrice(product.price)}
                </td>
                <td className={`${styles.td} ${styles.productStock}`}>
                  {product.stock}
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={styles.actions}>
                    <Link
                      href={`/admin/products/${product._id}`}
                      className={styles.editLink}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing{" "}
            {filteredProducts.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
            of {filteredProducts.length} products
          </div>

          <div className={styles.paginationControls}>
            <select
              className={styles.itemsPerPage}
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <div className={styles.paginationButtons}>
              <button
                className={styles.pageButton}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Simple page numbers */}
              {(() => {
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + 4);

                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }

                const pageNumbers = [];
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }

                return pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`${styles.pageButton} ${
                      currentPage === pageNum ? styles.activePage : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ));
              })()}

              <button
                className={styles.pageButton}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
