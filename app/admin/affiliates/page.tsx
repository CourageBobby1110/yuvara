"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import AdminLoader from "@/components/AdminLoader";
import styles from "./Affiliates.module.css";
import { toast } from "sonner";

interface AffiliateUser {
  _id: string;
  name: string;
  email: string;
  referralCode: string;
  referralCount: number;
  affiliateBalance: number;
  totalEarnings: number;
  affiliateBankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export default function AdminAffiliatesPage() {
  const { formatPrice } = useCurrency();
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data);
      }
    } catch (error) {
      console.error("Failed to fetch affiliates", error);
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to mark this balance as paid? This will reset the balance to 0."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/affiliates/${userId}/pay`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Marked as paid");
        fetchAffiliates();
      } else {
        toast.error("Failed to update balance");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Affiliate Management</h1>
        <p className={styles.subtitle}>Track and manage affiliate partners.</p>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Affiliate</th>
              <th className={styles.th}>Code</th>
              <th className={styles.th}>Referrals</th>
              <th className={styles.th}>Total Earnings</th>
              <th className={styles.th}>Unpaid Balance</th>
              <th className={styles.th}>Bank Details</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length > 0 ? (
              affiliates.map((user) => (
                <tr key={user._id}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {user.name?.[0] || "U"}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.code}>{user.referralCode}</span>
                  </td>
                  <td className={styles.td}>{user.referralCount}</td>
                  <td className={styles.td}>
                    <span className={styles.amount}>
                      {formatPrice(user.totalEarnings)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={styles.amount}
                      style={{
                        color:
                          user.affiliateBalance > 0 ? "#ef4444" : "#10b981",
                      }}
                    >
                      {formatPrice(user.affiliateBalance)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {user.affiliateBankDetails?.accountNumber ? (
                      <div className="text-sm">
                        <p className="font-medium">
                          {user.affiliateBankDetails.bankName}
                        </p>
                        <p>{user.affiliateBankDetails.accountNumber}</p>
                        <p className="text-gray-500">
                          {user.affiliateBankDetails.accountName}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {user.affiliateBalance > 0 && (
                      <button
                        onClick={() => handleMarkPaid(user._id)}
                        className={styles.payButton}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No affiliates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
