"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./AdminOrders.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import AdminLoader from "@/components/AdminLoader";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Order {
  _id: string;
  user: { name: string; email: string };
  total: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { formatPrice, exchangeRates } = useCurrency();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#eab308"; // yellow-500
      case "processing":
        return "#3b82f6"; // blue-500
      case "shipped":
        return "#8b5cf6"; // violet-500
      case "delivered":
        return "#22c55e"; // green-500
      case "cancelled":
        return "#ef4444"; // red-500
      default:
        return "#6b7280"; // gray-500
    }
  };

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;

    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order._id.toLowerCase().includes(query) ||
        order.user?.name?.toLowerCase().includes(query) ||
        order.user?.email?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Orders</h1>
      </div>

      {/* Search Bar (Desktop) */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Mobile Order Cards */}
      <div className={styles.mobileList}>
        {filteredOrders.map((order) => {
          const rateNGN = exchangeRates["NGN"] || 1500;
          const totalInUSD = order.total / rateNGN;

          return (
            <div key={order._id} className={styles.orderCard}>
              <div className={styles.orderCardHeader}>
                <div className={styles.orderCardCustomer}>
                  <div className={styles.customerName}>
                    {order.user?.name || "Guest"}
                  </div>
                  <div className={styles.customerEmail}>
                    {order.user?.email}
                  </div>
                </div>
                <span
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: `${getStatusColor(order.status)}10`,
                    color: getStatusColor(order.status),
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div className={styles.orderCardDetails}>
                <div className={styles.orderCardDetail}>
                  <div className={styles.detailLabel}>Order ID</div>
                  <div className={styles.detailValue}>
                    {order._id.substring(0, 8)}...
                  </div>
                </div>
                <div className={styles.orderCardDetail}>
                  <div className={styles.detailLabel}>Date</div>
                  <div className={styles.detailValue}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={styles.orderCardDetail}>
                  <div className={styles.detailLabel}>Total</div>
                  <div className={styles.detailValue}>
                    {formatPrice(totalInUSD)}
                  </div>
                </div>
                <div className={styles.orderCardDetail}>
                  <div className={styles.detailLabel}>Payment</div>
                  <div className={styles.detailValue}>
                    {order.paymentStatus}
                  </div>
                </div>
              </div>

              <div className={styles.orderCardFooter}>
                <Link
                  href={`/admin/orders/${order._id}`}
                  className={styles.viewButton}
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className={styles.emptyState}>No orders found.</div>
        )}
      </div>

      {/* Desktop Table */}
      <div className={styles.desktopTableWrapper}>
        <div className={styles.tableScrollWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: "12%" }}>
                  Order ID
                </th>
                <th className={styles.th} style={{ width: "25%" }}>
                  Customer
                </th>
                <th className={styles.th} style={{ width: "13%" }}>
                  Date
                </th>
                <th className={styles.th} style={{ width: "13%" }}>
                  Total
                </th>
                <th className={styles.th} style={{ width: "12%" }}>
                  Status
                </th>
                <th className={styles.th} style={{ width: "13%" }}>
                  Payment
                </th>
                <th
                  className={`${styles.th} ${styles.thRight}`}
                  style={{ width: "12%" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const rateNGN = exchangeRates["NGN"] || 1500;
                const totalInUSD = order.total / rateNGN;

                return (
                  <tr key={order._id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.orderId}`}>
                      <span className={styles.truncate} title={order._id}>
                        {order._id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.customerName}>
                        <span
                          className={styles.truncate}
                          title={order.user?.name || "Guest"}
                        >
                          {order.user?.name || "Guest"}
                        </span>
                      </div>
                      <div className={styles.customerEmail}>
                        <span
                          className={styles.truncate}
                          title={order.user?.email}
                        >
                          {order.user?.email}
                        </span>
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.date}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`${styles.td} ${styles.total}`}>
                      {formatPrice(totalInUSD)}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: `${getStatusColor(order.status)}10`,
                          color: getStatusColor(order.status),
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.payment}`}>
                      {order.paymentStatus}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className={styles.viewLink}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing{" "}
            {filteredOrders.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
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
                // Logic to show pages around current page
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
