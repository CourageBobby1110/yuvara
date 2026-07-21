"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./AdminCoupons.module.css";
import AdminSkeleton from "@/components/AdminSkeleton";
import {
  Plus,
  Search,
  Trash2,
  Power,
  PowerOff,
  Pencil,
  Tag,
  X,
  Check,
  Percent,
  Clock,
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
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
    if (!confirm("Are you sure you want to delete this coupon?")) return;

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

  if (loading) return <AdminSkeleton variant="table" />;

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.discountType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = coupons.filter((c) => c.isActive).length;
  const expiredCount = coupons.filter(
    (c) => c.expirationDate && new Date(c.expirationDate) < new Date()
  ).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Coupons</h1>
          <p className={styles.subtitle}>Create and manage discount coupons</p>
        </div>
        <Link href="/admin/coupons/new" className={styles.createButton}>
          <Plus size={18} />
          Create Coupon
        </Link>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Tag size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{coupons.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconActive}`}>
            <Percent size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconExpired}`}>
            <Clock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{expiredCount}</span>
            <span className={styles.statLabel}>Expired</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.mobileList}>
        {filteredCoupons.length === 0 ? (
          <div className={styles.emptyState}>
            <Tag size={48} className={styles.emptyIcon} />
            <p>No coupons found.</p>
            <Link href="/admin/coupons/new" className={styles.emptyAction}>
              <Plus size={16} />
              Create your first coupon
            </Link>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div key={coupon._id} className={styles.couponCard}>
              <div className={styles.cardTop}>
                <div className={styles.cardCodeSection}>
                  <Tag size={16} className={styles.cardTagIcon} />
                  <code className={styles.couponCode}>{coupon.code}</code>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    coupon.isActive ? styles.active : styles.inactive
                  }`}
                >
                  {coupon.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className={styles.discountBanner}>
                {editingId === coupon._id ? (
                  <div className={styles.editInline}>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      className={styles.editInput}
                    />
                    <span className={styles.editSuffix}>
                      {coupon.discountType === "percentage" ? "%" : "\u20A6"}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className={styles.discountValue}>
                      {coupon.discountType === "percentage"
                        ? `${coupon.value}%`
                        : `\u20A6${coupon.value.toLocaleString()}`}
                    </span>
                    <span className={styles.discountType}>
                      {coupon.discountType === "percentage"
                        ? "Percentage off"
                        : "Fixed amount"}
                    </span>
                  </>
                )}
              </div>

              <div className={styles.cardDetails}>
                <div className={styles.cardDetail}>
                  <span className={styles.detailLabel}>Usage</span>
                  <span className={styles.detailValue}>
                    {coupon.usedCount} /{" "}
                    {coupon.usageLimit === null ? "\u221E" : coupon.usageLimit}
                  </span>
                </div>
                <div className={styles.cardDetail}>
                  <span className={styles.detailLabel}>Expires</span>
                  <span className={styles.detailValue}>
                    {coupon.expirationDate
                      ? new Date(coupon.expirationDate).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <div className={styles.cardDetail}>
                  <span className={styles.detailLabel}>Min. Order</span>
                  <span className={styles.detailValue}>
                    {editingId === coupon._id ? (
                      <input
                        type="number"
                        value={editMinPrice}
                        onChange={(e) =>
                          setEditMinPrice(Number(e.target.value))
                        }
                        className={styles.editInputSmall}
                        placeholder="Min"
                      />
                    ) : coupon.minPrice > 0 ? (
                      `\u20A6${coupon.minPrice.toLocaleString()}`
                    ) : (
                      "No minimum"
                    )}
                  </span>
                </div>
                <div className={styles.cardDetail}>
                  <span className={styles.detailLabel}>Max. Order</span>
                  <span className={styles.detailValue}>
                    {editingId === coupon._id ? (
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
                        className={styles.editInputSmall}
                        placeholder="Max"
                      />
                    ) : coupon.maxPrice ? (
                      `\u20A6${coupon.maxPrice.toLocaleString()}`
                    ) : (
                      "No maximum"
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                {editingId === coupon._id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(coupon)}
                      className={`${styles.actionButton} ${styles.saveButton}`}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`${styles.actionButton} ${
                        coupon.isActive
                          ? styles.deactivateButton
                          : styles.activateButton
                      }`}
                    >
                      {coupon.isActive ? (
                        <>
                          <PowerOff size={14} /> Deactivate
                        </>
                      ) : (
                        <>
                          <Power size={14} /> Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <Tag size={40} className={styles.emptyIcon} />
                    <p>No coupons found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr key={coupon._id} className={styles.tr}>
                  <td className={styles.td}>
                    <code className={styles.tableCode}>{coupon.code}</code>
                  </td>
                  <td className={styles.td}>
                    {editingId === coupon._id ? (
                      <div className={styles.editInline}>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) =>
                            setEditValue(Number(e.target.value))
                          }
                          className={styles.editInput}
                        />
                        <span className={styles.editSuffix}>
                          {coupon.discountType === "percentage"
                            ? "%"
                            : "\u20A6"}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.discountDisplay}>
                        {coupon.discountType === "percentage"
                          ? `${coupon.value}%`
                          : `\u20A6${coupon.value.toLocaleString()}`}
                      </span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.usageText}>
                      {coupon.usedCount} /{" "}
                      {coupon.usageLimit === null
                        ? "\u221E"
                        : coupon.usageLimit}
                    </span>
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
                      <div className={styles.editGroup}>
                        <input
                          type="number"
                          value={editMinPrice}
                          onChange={(e) =>
                            setEditMinPrice(Number(e.target.value))
                          }
                          className={styles.editInputSmall}
                          placeholder="Min"
                        />
                        <span className={styles.editDash}>-</span>
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
                          className={styles.editInputSmall}
                          placeholder="Max"
                        />
                      </div>
                    ) : (
                      <span className={styles.priceRangeText}>
                        {coupon.minPrice > 0
                          ? `\u20A6${coupon.minPrice.toLocaleString()}`
                          : "\u20A60"}
                        {coupon.maxPrice
                          ? ` - \u20A6${coupon.maxPrice.toLocaleString()}`
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.dateCell}`}>
                    {coupon.expirationDate
                      ? new Date(coupon.expirationDate).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.tableActions}>
                      {editingId === coupon._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(coupon)}
                            className={`${styles.actionButton} ${styles.saveButton}`}
                          >
                            <Check size={14} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                          >
                            <X size={14} /> Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`${styles.actionButton} ${
                              coupon.isActive
                                ? styles.deactivateButton
                                : styles.activateButton
                            }`}
                            title={
                              coupon.isActive ? "Deactivate" : "Activate"
                            }
                          >
                            {coupon.isActive ? (
                              <PowerOff size={14} />
                            ) : (
                              <Power size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
