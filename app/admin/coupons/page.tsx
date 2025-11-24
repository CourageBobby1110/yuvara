"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./AdminCoupons.module.css";
import AdminLoader from "@/components/AdminLoader";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  expirationDate?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  minPrice: number;
  maxPrice?: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editMinPrice, setEditMinPrice] = useState<number>(0);
  const [editMaxPrice, setEditMaxPrice] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coupon._id,
          isActive: !coupon.isActive,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCoupons(coupons.map((c) => (c._id === coupon._id ? updated : c)));
      } else {
        alert("Failed to update coupon");
      }
    } catch (error) {
      console.error("Update error", error);
      alert("Failed to update coupon");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon._id);
    setEditValue(coupon.value);
    setEditMinPrice(coupon.minPrice || 0);
    setEditMaxPrice(coupon.maxPrice);
  };

  const handleSaveEdit = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coupon._id,
          value: editValue,
          minPrice: editMinPrice,
          maxPrice: editMaxPrice,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCoupons(coupons.map((c) => (c._id === coupon._id ? updated : c)));
        setEditingId(null);
      } else {
        alert("Failed to update coupon value");
      }
    } catch (error) {
      console.error("Update error", error);
      alert("Failed to update coupon value");
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCoupons(coupons.filter((c) => c._id !== couponId));
      } else {
        alert("Failed to delete coupon");
      }
    } catch (error) {
      console.error("Delete error", error);
      alert("Failed to delete coupon");
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Coupons</h1>
        <Link href="/admin/coupons/new" className={styles.addButton}>
          Create New Coupon
        </Link>
      </div>

      {/* Mobile Coupon Cards */}
      <div className={styles.mobileList}>
        {coupons.length === 0 ? (
          <div className={styles.emptyState}>
            No coupons found. Create one to get started.
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon._id} className={styles.couponCard}>
              <div className={styles.couponCardHeader}>
                <div className={styles.couponCode}>{coupon.code}</div>
                <span
                  className={`${styles.statusBadge} ${
                    coupon.isActive ? styles.active : styles.inactive
                  }`}
                >
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className={styles.couponCardDetails}>
                <div className={styles.couponCardDetail}>
                  <div className={styles.detailLabel}>Discount</div>
                  <div className={styles.detailValue}>
                    {editingId === coupon._id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className={styles.editInput}
                      />
                    ) : coupon.discountType === "percentage" ? (
                      `${coupon.value}%`
                    ) : (
                      `₦${coupon.value.toLocaleString()}`
                    )}
                  </div>
                </div>
                <div className={styles.couponCardDetail}>
                  <div className={styles.detailLabel}>Usage</div>
                  <div className={styles.detailValue}>
                    {coupon.usedCount} /{" "}
                    {coupon.usageLimit === null ? "∞" : coupon.usageLimit}
                  </div>
                </div>
                <div className={styles.couponCardDetail}>
                  <div className={styles.detailLabel}>Expires</div>
                  <div className={styles.detailValue}>
                    {coupon.expirationDate
                      ? new Date(coupon.expirationDate).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>

                <div className={styles.couponCardDetail}>
                  <div className={styles.detailLabel}>Price Range</div>
                  <div className={styles.detailValue}>
                    {editingId === coupon._id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editMinPrice}
                          onChange={(e) =>
                            setEditMinPrice(Number(e.target.value))
                          }
                          className={styles.editInput}
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={editMaxPrice || ""}
                          onChange={(e) =>
                            setEditMaxPrice(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                          className={styles.editInput}
                          placeholder="Max"
                        />
                      </div>
                    ) : (
                      <>
                        {coupon.minPrice > 0
                          ? `Min: ₦${coupon.minPrice.toLocaleString()}`
                          : "No Min"}
                        {coupon.maxPrice
                          ? ` - Max: ₦${coupon.maxPrice.toLocaleString()}`
                          : ""}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.actionButtons}>
                {editingId === coupon._id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(coupon)}
                      className={`${styles.actionButton} ${styles.saveButton}`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                    >
                      Edit Value
                    </button>
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`${styles.actionButton} ${styles.toggleButton}`}
                    >
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className={styles.desktopTableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Code</th>
              <th className={styles.th}>Discount</th>
              <th className={styles.th}>Usage</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Price Range</th>
              <th className={styles.th}>Expires</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No coupons found. Create one to get started.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon._id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.couponCode}`}>
                    {coupon.code}
                  </td>
                  <td className={styles.td}>
                    {editingId === coupon._id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className={styles.editInput}
                      />
                    ) : coupon.discountType === "percentage" ? (
                      `${coupon.value}%`
                    ) : (
                      `₦${coupon.value.toLocaleString()}`
                    )}
                  </td>
                  <td className={styles.td}>
                    {coupon.usedCount} /{" "}
                    {coupon.usageLimit === null ? "∞" : coupon.usageLimit}
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${
                        coupon.isActive ? styles.active : styles.inactive
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {editingId === coupon._id ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={editMinPrice}
                          onChange={(e) =>
                            setEditMinPrice(Number(e.target.value))
                          }
                          className={styles.editInput}
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          value={editMaxPrice || ""}
                          onChange={(e) =>
                            setEditMaxPrice(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                          className={styles.editInput}
                          placeholder="Max"
                        />
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div>
                          Min: ₦{coupon.minPrice?.toLocaleString() || 0}
                        </div>
                        {coupon.maxPrice && (
                          <div>Max: ₦{coupon.maxPrice.toLocaleString()}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    {coupon.expirationDate
                      ? new Date(coupon.expirationDate).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      {editingId === coupon._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(coupon)}
                            className={`${styles.actionButton} ${styles.saveButton}`}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`${styles.actionButton} ${styles.toggleButton}`}
                          >
                            {coupon.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
