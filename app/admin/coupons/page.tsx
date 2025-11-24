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
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

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
                    {coupon.discountType === "percentage"
                      ? `${coupon.value}%`
                      : `₦${coupon.value.toLocaleString()}`}
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
              <th className={styles.th}>Expires</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
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
                    {coupon.discountType === "percentage"
                      ? `${coupon.value}%`
                      : `₦${coupon.value.toLocaleString()}`}
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
                    {coupon.expirationDate
                      ? new Date(coupon.expirationDate).toLocaleDateString()
                      : "Never"}
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
