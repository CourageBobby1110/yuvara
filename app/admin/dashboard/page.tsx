"use client";
import AdminLoader from "@/components/AdminLoader";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "./AdminDashboard.module.css";
import { useCurrency } from "@/context/CurrencyContext";

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    activeOrders: 0,
    customers: 0,
  });

  const { formatPrice, exchangeRates } = useCurrency();

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();

      if (data.error) {
        console.error("Error fetching stats:", data.error);
        return;
      }

      // Revenue is in NGN. Convert to USD for formatPrice compatibility
      const rateNGN = exchangeRates["NGN"] || 1500;
      const revenueUSD = data.revenue / rateNGN;

      setStats({
        revenue: revenueUSD,
        activeOrders: data.activeOrders,
        customers: data.customers,
      });

      setOrders(data.recentOrders);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    // ... (keep existing switch case)
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

  if (status === "loading" || loading) return <AdminLoader />;

  if (!session) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.welcomeText}>
            Here's what's happening with your store today.
          </p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Revenue</p>
          <div className={styles.statValueWrapper}>
            {session?.user?.role === "worker" ? (
              <h3
                className={styles.statValue}
                style={{ filter: "blur(8px)", userSelect: "none" }}
              >
                $0,000.00
              </h3>
            ) : (
              <h3 className={styles.statValue}>{formatPrice(stats.revenue)}</h3>
            )}
          </div>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Active Orders</p>
          <div className={styles.statValueWrapper}>
            <h3 className={styles.statValue}>{stats.activeOrders}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Customers</p>
          <div className={styles.statValueWrapper}>
            <h3 className={styles.statValue}>{stats.customers}</h3>
          </div>
        </div>
      </div>

      <div className={styles.recentOrdersContainer}>
        <div className={styles.recentOrdersHeader}>
          <h3 className={styles.recentOrdersTitle}>Recent Orders</h3>
          <Link href="/admin/orders" className={styles.viewAllLink}>
            View All
          </Link>
        </div>

        {/* Mobile Order Cards */}
        <div className={styles.mobileOrders}>
          {orders.map((order) => {
            const rateNGN = exchangeRates["NGN"] || 1500;
            const totalInUSD = order.total / rateNGN;
            return (
              <div key={order._id} className={styles.orderCard}>
                <div className={styles.orderCardHeader}>
                  <span className={styles.orderCardId}>
                    #{order._id.toString().slice(-6).toUpperCase()}
                  </span>
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
                  <div>
                    <div className={styles.orderCardCustomer}>
                      {order.user?.name || "Unknown"}
                    </div>
                    <div className={styles.orderCardDate}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.orderCardTotal}>
                    {formatPrice(totalInUSD)}
                  </div>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className={styles.emptyState}>No recent orders found</div>
          )}
        </div>

        {/* Desktop Table */}
        <div className={styles.desktopTableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order ID</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} ${styles.thRight}`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                // Convert NGN total to USD for formatPrice
                const rateNGN = exchangeRates["NGN"] || 1500;
                const totalInUSD = order.total / rateNGN;

                return (
                  <tr key={order._id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdOrderId}`}>
                      #{order._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td className={`${styles.td} ${styles.tdCustomer}`}>
                      {order.user?.name || "Unknown"}
                    </td>
                    <td className={`${styles.td} ${styles.tdDate}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
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
                    <td className={`${styles.td} ${styles.tdTotal}`}>
                      {formatPrice(totalInUSD)}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
