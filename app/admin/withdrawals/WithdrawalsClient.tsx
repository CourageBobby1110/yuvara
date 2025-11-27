"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Withdrawals.module.css";

export default function WithdrawalsClient({
  withdrawals,
}: {
  withdrawals: any[];
}) {
  const router = useRouter();
  const { currency, exchangeRates } = useCurrency();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

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

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Withdrawal marked as ${status}`);
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (filter === "all") return true;
    return w.status === filter;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Withdrawal Requests</h1>
        <div className={styles.filters}>
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`${styles.filterButton} ${
                filter === f ? styles.activeFilter : ""
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Affiliate</th>
                <th>Amount</th>
                <th>Bank Details</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((w) => (
                <tr key={w._id}>
                  <td>
                    <div className={styles.userCell}>
                      <span className={styles.userName}>{w.user?.name}</span>
                      <span className={styles.userEmail}>{w.user?.email}</span>
                    </div>
                  </td>
                  <td className={styles.amount}>{formatAmount(w.amount)}</td>
                  <td>
                    <div className={styles.bankDetails}>
                      <div>{w.bankDetails?.bankName}</div>
                      <div>{w.bankDetails?.accountNumber}</div>
                      <div className={styles.accountName}>
                        {w.bankDetails?.accountName}
                      </div>
                    </div>
                  </td>
                  <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[w.status]}`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td>
                    {w.status === "pending" && (
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleAction(w._id, "approved")}
                          disabled={processingId === w._id}
                          className={`${styles.actionButton} ${styles.approve}`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(w._id, "rejected")}
                          disabled={processingId === w._id}
                          className={`${styles.actionButton} ${styles.reject}`}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredWithdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No withdrawal requests found
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
