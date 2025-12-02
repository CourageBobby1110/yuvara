"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./AdminOrderDetails.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import AdminLoader from "@/components/AdminLoader";

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

  if (loading) return <AdminLoader />;
  if (!order) return <div className={styles.loading}>Order not found</div>;

  // Convert NGN total to USD for formatPrice
  const rateNGN = exchangeRates["NGN"] || 1500;
  const totalInUSD = order.total / rateNGN;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Order Details</h1>
        <Link href="/admin/orders" className={styles.backLink}>
          Back to Orders
        </Link>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Items */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Items</h2>
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
            <span>{formatPrice(totalInUSD)}</span>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className={styles.detailsColumn}>
          {/* Customer Info */}
          <div className={styles.card}>
            <h3 className={styles.detailCardTitle}>Customer</h3>
            <p className={styles.detailText}>{order.user?.name || "Guest"}</p>
            <p className={styles.detailSubText}>{order.user?.email}</p>
            {order.shippingAddress?.phone && (
              <div className={styles.phoneContainer}>
                <span className={styles.phoneLabel}>Phone: </span>
                <a
                  href={`tel:${order.shippingAddress.phone}`}
                  className={styles.phoneLink}
                >
                  {order.shippingAddress.phone}
                </a>
              </div>
            )}
          </div>

          {/* Shipping Info */}
          <div className={styles.card}>
            <h3 className={styles.detailCardTitle}>Shipping Address</h3>
            <div className={styles.addressText}>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Status Management */}
          <div className={styles.card}>
            <h3 className={styles.detailCardTitle}>Status Management</h3>
            <div className={styles.statusRow}>
              Current Status:{" "}
              <span className={styles.currentStatus}>{order.status}</span>
            </div>
            <div className={styles.statusButtons}>
              {["processing", "shipped", "delivered", "cancelled"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updating || order.status === status}
                    className={`${styles.statusButton} ${
                      order.status === status ? styles.statusButtonActive : ""
                    }`}
                  >
                    Mark as {status}
                  </button>
                )
              )}
            </div>

            {/* CJ Dropshipping Fulfillment */}
            <div className="mt-4 pt-4 border-t border-gray-100">
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
                      }
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
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                {updating ? "Sending..." : "Fulfill with CJ Dropshipping"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
