"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLoader from "@/components/AdminLoader";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./AdminProducts.module.css";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, setCurrency, formatPrice } = useCurrency();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p._id !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product", error);
    }
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
                <td colSpan={6} className={styles.emptyState}>
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }

                return (
                  <button
                    key={pageNum}
                    className={`${styles.pageButton} ${
                      currentPage === pageNum ? styles.activePage : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

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
