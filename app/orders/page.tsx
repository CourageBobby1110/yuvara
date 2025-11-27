"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Orders.module.css";

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; image: string; quantity: number; price: number }[];
}

const ORDER_STEPS = ["placed", "processing", "shipped", "delivered"];

const getStepStatus = (orderStatus: string, step: string) => {
  const statusIndex = ORDER_STEPS.indexOf(orderStatus.toLowerCase());
  const stepIndex = ORDER_STEPS.indexOf(step);

  if (statusIndex === -1) return "pending"; // Handle cancelled or unknown
  if (stepIndex < statusIndex) return "completed";
  if (stepIndex === statusIndex) return "current";
  return "pending";
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { formatPrice, exchangeRates } = useCurrency();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o._id === orderId ? { ...o, status: "cancelled" } : o
          )
        );
        alert("Order cancelled successfully.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel error", error);
      alert("Failed to cancel order");
    }
  };

  // Helper to normalize NGN price to USD for formatPrice
  const normalizePrice = (priceInNGN: number) => {
    const rate = exchangeRates["NGN"] || 1500;
    return priceInNGN / rate;
  };

  // Filter and Sort
  const filteredOrders = orders.filter((order) =>
    order._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortOption === "date-desc")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortOption === "date-asc")
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortOption === "amount-desc") return b.total - a.total;
    if (sortOption === "amount-asc") return a.total - b.total;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Orders</h1>

          <div className={styles.controls}>
            {/* Search */}
            <div className={styles.searchWrapper}>
              <div className={styles.searchIconWrapper}>
                <svg
                  className={styles.searchIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.searchInput}
              />
            </div>

            {/* Sort */}
            <div className={styles.sortWrapper}>
              <label className={styles.sortLabel}>Sort by:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              You haven't placed any orders yet.
            </p>
            <Link href="/" className={styles.emptyLink}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {paginatedOrders.length === 0 ? (
              <div className={styles.noResults}>
                No orders found matching your search.
              </div>
            ) : (
              paginatedOrders.map((order) => (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.headerInfo}>
                      <div className={styles.headerLabel}>Order Placed</div>
                      <div className={styles.headerValue}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.headerInfo}>
                      <div className={styles.headerLabel}>Total</div>
                      <div className={styles.headerValue}>
                        {/* Order Total is in NGN, so we normalize it */}
                        {formatPrice(normalizePrice(order.total))}
                      </div>
                    </div>
                    <div className={styles.headerInfo}>
                      <div className={styles.headerLabel}>Order #</div>
                      <div className={styles.headerValue}>
                        {order._id.substring(0, 8).toUpperCase()}...
                      </div>
                    </div>
                    <div className={styles.headerActions}>
                      <span
                        className={`${styles.statusBadge} ${
                          order.status === "delivered"
                            ? styles.statusDelivered
                            : order.status === "shipped"
                            ? styles.statusShipped
                            : order.status === "cancelled"
                            ? styles.statusCancelled
                            : styles.statusPending
                        }`}
                      >
                        {order.status}
                      </span>

                      {(order.status === "pending" ||
                        order.status === "processing") && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className={styles.cancelButton}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Status Stepper */}
                  {order.status !== "cancelled" && (
                    <div className={styles.stepperContainer}>
                      <div className={styles.stepper}>
                        {/* Progress Line Fill */}
                        <div
                          className={styles.progressLine}
                          style={{
                            width: `${
                              (ORDER_STEPS.indexOf(order.status.toLowerCase()) /
                                (ORDER_STEPS.length - 1)) *
                              100
                            }%`,
                          }}
                        />

                        {ORDER_STEPS.map((step, index) => {
                          const status = getStepStatus(order.status, step);
                          return (
                            <div
                              key={step}
                              className={`${styles.step} ${
                                status === "completed"
                                  ? styles.stepCompleted
                                  : status === "current"
                                  ? styles.stepCurrent
                                  : ""
                              }`}
                            >
                              <div className={styles.stepIcon}>
                                {status === "completed" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : (
                                  <span>{index + 1}</span>
                                )}
                              </div>
                              <div className={styles.stepLabel}>{step}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.orderItems}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className={styles.itemRow}>
                        <div className={styles.itemImageWrapper}>
                          <Image
                            src={item.image || "/placeholder.png"}
                            alt={item.name}
                            fill
                            className={styles.itemImage}
                          />
                        </div>
                        <div className={styles.itemDetails}>
                          <h4 className={styles.itemName}>{item.name}</h4>
                          <p className={styles.itemQty}>Qty: {item.quantity}</p>
                        </div>
                        <div className={styles.itemPrice}>
                          {/* Item price is already in USD, so NO normalization needed */}
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageButton}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
