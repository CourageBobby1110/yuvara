"use client";

import { useState, useEffect } from "react";
import styles from "./AdminMarketing.module.css";
import AdminLoader from "@/components/AdminLoader";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
}

export default function MarketingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/products"),
      ]);

      if (usersRes.ok && productsRes.ok) {
        const usersData = await usersRes.json();
        const productsData = await productsRes.json();
        setUsers(usersData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(users.map((u) => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (!selectedProduct || selectedUsers.length === 0) {
      alert("Please select a product and at least one user");
      return;
    }

    if (!confirm(`Send notification to ${selectedUsers.length} users?`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          userIds: selectedUsers,
        }),
      });

      if (res.ok) {
        alert("Notifications sent successfully!");
        setSelectedUsers([]);
        setSelectedProduct("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send notifications");
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      alert("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Marketing Dashboard</h1>
        <p className={styles.subtitle}>
          Send targeted product notifications to your customers
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Select Product</h2>
          <div className={styles.formGroup}>
            <label className={styles.label}>Choose a product to promote</label>
            <select
              className={styles.select}
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Select a product...</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - ${product.price}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Select Recipients</h2>
          <div className={styles.selectAll}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={
                selectedUsers.length === users.length && users.length > 0
              }
              onChange={handleSelectAll}
            />
            <span className={styles.label} style={{ marginBottom: 0 }}>
              Select All Users ({users.length})
            </span>
          </div>

          <div className={styles.userList}>
            {users.map((user) => (
              <div
                key={user._id}
                className={styles.userItem}
                onClick={() => handleUserSelect(user._id)}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedUsers.includes(user._id)}
                  readOnly
                />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={sending || !selectedProduct || selectedUsers.length === 0}
        >
          {sending
            ? "Sending..."
            : `Send Notification to ${selectedUsers.length} Users`}
        </button>
      </div>
    </div>
  );
}
