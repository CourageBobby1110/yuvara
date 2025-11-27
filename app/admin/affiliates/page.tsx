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
  hasPendingWithdrawal?: boolean;
}

export default function AdminAffiliatesPage() {
  const { currency, exchangeRates } = useCurrency();
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);

  const formatAmount = (amountInNaira: number) => {
    // Convert Naira to USD (Base)
    const amountInUSD = amountInNaira / (exchangeRates["NGN"] || 1500);
    // Convert USD to selected currency
    const converted = amountInUSD * (exchangeRates[currency] || 1);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(converted);
  };

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

      {/* Desktop Table View */}
      <div className={styles.tableWrapper}>
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
                    <td className={styles.td} data-label="Affiliate">
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
                    <td className={styles.td} data-label="Code">
                      <span className={styles.code}>{user.referralCode}</span>
                    </td>
                    <td className={styles.td} data-label="Referrals">
                      <span className={styles.stat}>{user.referralCount}</span>
                    </td>
                    <td className={styles.td} data-label="Total Earnings">
                      <span className={styles.amount}>
                        {formatAmount(user.totalEarnings)}
                      </span>
                    </td>
                    <td className={styles.td} data-label="Unpaid Balance">
                      <div className={styles.balanceWrapper}>
                        <span
                          className={`${styles.amount} ${
                            user.affiliateBalance > 0
                              ? styles.balanceDue
                              : styles.balancePaid
                          }`}
                        >
                          {formatAmount(user.affiliateBalance)}
                        </span>
                        {user.hasPendingWithdrawal && (
                          <span className={styles.pendingBadge}>Pending</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.td} data-label="Bank Details">
                      {user.affiliateBankDetails?.accountNumber ? (
                        <div className={styles.bankDetails}>
                          <p className={styles.bankName}>
                            {user.affiliateBankDetails.bankName}
                          </p>
                          <p className={styles.accountNumber}>
                            {user.affiliateBankDetails.accountNumber}
                          </p>
                          <p className={styles.accountName}>
                            {user.affiliateBankDetails.accountName}
                          </p>
                        </div>
                      ) : (
                        <span className={styles.notSet}>Not set</span>
                      )}
                    </td>
                    <td className={styles.td} data-label="Actions">
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

      {/* Mobile Card View */}
      <div className={styles.mobileView}>
        {affiliates.length > 0 ? (
          affiliates.map((user) => (
            <div key={user._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.userCell}>
                  <div className={styles.avatar}>{user.name?.[0] || "U"}</div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
                <span className={styles.code}>{user.referralCode}</span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Referrals</span>
                  <span className={styles.value}>{user.referralCount}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Total Earnings</span>
                  <span className={styles.value}>
                    {formatAmount(user.totalEarnings)}
                  </span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Unpaid Balance</span>
                  <div className={styles.balanceWrapper}>
                    <span
                      className={`${styles.value} ${
                        user.affiliateBalance > 0
                          ? styles.balanceDue
                          : styles.balancePaid
                      }`}
                    >
                      {formatAmount(user.affiliateBalance)}
                    </span>
                    {user.hasPendingWithdrawal && (
                      <span className={styles.pendingBadge}>Pending</span>
                    )}
                  </div>
                </div>

                {user.affiliateBankDetails?.accountNumber && (
                  <div className={styles.cardRow}>
                    <span className={styles.label}>Bank Details</span>
                    <div className={styles.bankDetails}>
                      <p className={styles.bankName}>
                        {user.affiliateBankDetails.bankName}
                      </p>
                      <p className={styles.accountNumber}>
                        {user.affiliateBankDetails.accountNumber}
                      </p>
                      <p className={styles.accountName}>
                        {user.affiliateBankDetails.accountName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {user.affiliateBalance > 0 && (
                <div className={styles.cardFooter}>
                  <button
                    onClick={() => handleMarkPaid(user._id)}
                    className={styles.payButton}
                  >
                    Mark Paid
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>No affiliates found.</div>
        )}
      </div>
    </div>
  );
}
