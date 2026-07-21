"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./AdminOrderDetails.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import AdminSkeleton from "@/components/AdminSkeleton";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Truck,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  ShoppingBag,
} from "lucide-react";

interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  user: { name: string; email: string };
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    email: string;
  };
  paymentReference: string;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  pending: { color: "#92400e", bg: "#fef3c7", icon: <Clock size={14} /> },
  processing: { color: "#1e40af", bg: "#dbeafe", icon: <Package size={14} /> },
  shipped: { color: "#6b21a8", bg: "#f3e8ff", icon: <Truck size={14} /> },
  delivered: { color: "#166534", bg: "#dcfce7", icon: <CheckCircle size={14} /> },
  cancelled: { color: "#991b1b", bg: "#fee2e2", icon: <XCircle size={14} /> },
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const resolvedParams = React.use(params);
  const { formatPrice, exchangeRates } = useCurrency();

  useEffect(() => {
    fetchOrder();
  }, [resolvedParams.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Failed to fetch order", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrder({ ...order, status: newStatus });
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AdminSkeleton variant="detail" />;
  if (!order) return <div className={styles.loading}>Order not found</div>;

  const rateNGN = exchangeRates["NGN"] || 1500;
  const totalInUSD = order.total / rateNGN;
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin/orders" className={styles.backLink}>
            <ArrowLeft size={18} />
            Orders
          </Link>
          <h1 className={styles.title}>
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <div className={styles.headerMeta}>
            <span className={styles.dateText}>
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.icon}
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          {/* Items Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <ShoppingBag size={18} className={styles.cardIcon} />
                <h2 className={styles.sectionTitle}>Items</h2>
              </div>
              <span className={styles.itemCount}>
                {order.items.length} {order.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className={styles.itemsList}>
              {order.items.map((item, index) => (
                <div key={index} className={styles.item}>
                  <div className={styles.itemImageWrapper}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className={styles.itemImage}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemQty}>Qty: {item.quantity}</div>
                  </div>
                  <div className={styles.itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalAmount}>{formatPrice(totalInUSD)}</span>
            </div>
          </div>

          {/* Status Management */}
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <Truck size={18} className={styles.cardIcon} />
              <h3 className={styles.sectionTitle}>Update Status</h3>
            </div>
            <div className={styles.statusGrid}>
              {["processing", "shipped", "delivered", "cancelled"].map(
                (status) => {
                  const cfg = STATUS_CONFIG[status];
                  const isActive = order.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updating || isActive}
                      className={`${styles.statusButton} ${
                        isActive ? styles.statusButtonActive : ""
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color }
                          : undefined
                      }
                    >
                      {cfg.icon}
                      {status}
                    </button>
                  );
                },
              )}
            </div>

            <div className={styles.fulfillmentSection}>
              <button
                onClick={async () => {
                  if (!confirm("Send this order to CJ Dropshipping?")) return;
                  setUpdating(true);
                  try {
                    const res = await fetch(
                      "/api/admin/dropshipping/orders/create",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: order._id }),
                      },
                    );
                    const data = await res.json();
                    if (res.ok) {
                      alert("Order sent to CJ! CJ Order ID: " + data.cjOrderId);
                      setOrder({ ...order, status: "processing" });
                    } else {
                      alert("Failed: " + data.error);
                    }
                  } catch (err) {
                    alert("Error sending to CJ");
                  } finally {
                    setUpdating(false);
                  }
                }}
                disabled={updating}
                className={styles.fulfillButton}
              >
                <Send size={16} />
                {updating ? "Sending..." : "Fulfill with CJ Dropshipping"}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.detailsColumn}>
          {/* Customer Info */}
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <User size={18} className={styles.cardIcon} />
              <h3 className={styles.detailCardTitle}>Customer</h3>
            </div>
            <div className={styles.detailRows}>
              <div className={styles.detailRow}>
                <span className={styles.detailRowLabel}>Name</span>
                <span className={styles.detailRowValue}>
                  {order.user?.name || "Guest"}
                </span>
              </div>
              {order.user?.email && (
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>Email</span>
                  <a href={`mailto:${order.user.email}`} className={styles.detailRowLink}>
                    <Mail size={14} />
                    {order.user.email}
                  </a>
                </div>
              )}
              {order.shippingAddress?.phone && (
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>Phone</span>
                  <a href={`tel:${order.shippingAddress.phone}`} className={styles.detailRowLink}>
                    <Phone size={14} />
                    {order.shippingAddress.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <MapPin size={18} className={styles.cardIcon} />
              <h3 className={styles.detailCardTitle}>Shipping Address</h3>
            </div>
            <div className={styles.addressBlock}>
              <p className={styles.addressLine}>{order.shippingAddress.street}</p>
              <p className={styles.addressLine}>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
              <p className={styles.addressLine}>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Payment */}
          <div className={styles.card}>
            <div className={styles.cardTitleGroup}>
              <Package size={18} className={styles.cardIcon} />
              <h3 className={styles.detailCardTitle}>Payment</h3>
            </div>
            <div className={styles.detailRows}>
              <div className={styles.detailRow}>
                <span className={styles.detailRowLabel}>Status</span>
                <span className={styles.detailRowValue} style={{ textTransform: "capitalize" }}>
                  {order.paymentStatus || "N/A"}
                </span>
              </div>
              {order.paymentReference && (
                <div className={styles.detailRow}>
                  <span className={styles.detailRowLabel}>Reference</span>
                  <span className={styles.detailRowMono}>{order.paymentReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
