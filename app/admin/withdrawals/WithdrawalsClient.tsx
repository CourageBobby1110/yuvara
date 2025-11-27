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

      {/* Desktop Table View */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Affiliate</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Bank Details</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((w) => (
                <tr key={w._id}>
                  <td className={styles.td} data-label="Affiliate">
                    <div className={styles.userCell}>
                      <span className={styles.userName}>{w.user?.name}</span>
                      <span className={styles.userEmail}>{w.user?.email}</span>
                    </div>
                  </td>
                  <td className={styles.td} data-label="Amount">
                    <span className={styles.amount}>
                      {formatAmount(w.amount)}
                    </span>
                  </td>
                  <td className={styles.td} data-label="Bank Details">
                    <div className={styles.bankDetails}>
                      <p className={styles.bankName}>
                        {w.bankDetails?.bankName}
                      </p>
                      <p className={styles.accountNumber}>
                        {w.bankDetails?.accountNumber}
                      </p>
                      <p className={styles.accountName}>
                        {w.bankDetails?.accountName}
                      </p>
                    </div>
                  </td>
                  <td className={styles.td} data-label="Date">
                    <span className={styles.date}>
                      {new Date(w.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className={styles.td} data-label="Status">
                    <span
                      className={`${styles.statusBadge} ${styles[w.status]}`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className={styles.td} data-label="Actions">
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

      {/* Mobile Card View */}
      <div className={styles.mobileView}>
        {filteredWithdrawals.length > 0 ? (
          filteredWithdrawals.map((w) => (
            <div key={w._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.userCell}>
                  <span className={styles.userName}>{w.user?.name}</span>
                  <span className={styles.userEmail}>{w.user?.email}</span>
                </div>
                <span className={`${styles.statusBadge} ${styles[w.status]}`}>
                  {w.status}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Amount</span>
                  <span className={styles.amount}>
                    {formatAmount(w.amount)}
                  </span>
                </div>

                <div className={styles.cardRow}>
                  <span className={styles.label}>Date</span>
                  <span className={styles.value}>
                    {new Date(w.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.cardRow}>
                  <span className={styles.label}>Bank Details</span>
                  <div className={styles.bankDetails}>
                    <p className={styles.bankName}>{w.bankDetails?.bankName}</p>
                    <p className={styles.accountNumber}>
                      {w.bankDetails?.accountNumber}
                    </p>
                    <p className={styles.accountName}>
                      {w.bankDetails?.accountName}
                    </p>
                  </div>
                </div>
              </div>

              {w.status === "pending" && (
                <div className={styles.cardFooter}>
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
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>No withdrawal requests found</div>
        )}
      </div>
    </div>
  );
}
