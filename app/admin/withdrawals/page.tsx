"use client";

import { useState, useEffect } from "react";
import styles from "./AdminWithdrawals.module.css";
import YuvaraLoader from "@/components/YuvaraLoader";
import { useCurrency } from "@/context/CurrencyContext";

interface Withdrawal {
  _id: string;
  investor: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  status: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/withdrawals");
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      const data = await res.json();
      setWithdrawals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Action failed");
      }

      // Refresh list
      fetchWithdrawals();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "approved":
        return styles.statusApproved;
      case "rejected":
        return styles.statusRejected;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Withdrawal Requests</h1>
        <button className={styles.refreshButton} onClick={fetchWithdrawals}>
          <span>↻</span> Refresh
        </button>
      </div>

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "4rem" }}
        >
          <YuvaraLoader text="Loading Requests..." />
        </div>
      ) : (
        <div className={styles.grid}>
          {withdrawals.length === 0 ? (
            <div className={styles.emptyState} style={{ gridColumn: "1 / -1" }}>
              No withdrawal requests found.
            </div>
          ) : (
            withdrawals.map((item) => (
              <div key={item._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.investorName}>
                      {item.investor?.name ||
                        item.bankDetails?.accountName ||
                        "Unknown"}
                    </div>
                    <div className={styles.investorEmail}>
                      {item.investor?.email || "No email linked"}
                    </div>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.row}>
                    <span className={styles.label}>Amount</span>
                    <span className={styles.amount}>
                      ₦{item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Date</span>
                    <span className={styles.value}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.bankDetails}>
                    <div className={styles.row}>
                      <span className={styles.bankLabel}>Bank</span>
                      <span className={styles.bankValue}>
                        {item.bankDetails?.bankName}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span className={styles.bankLabel}>Acct No.</span>
                      <span className={styles.bankValue}>
                        {item.bankDetails?.accountNumber}
                      </span>
                    </div>
                    <div className={styles.row}>
                      <span className={styles.bankLabel}>Acct Name</span>
                      <span className={styles.bankValue}>
                        {item.bankDetails?.accountName}
                      </span>
                    </div>
                  </div>
                </div>

                {item.status === "pending" && (
                  <div className={styles.cardFooter}>
                    <button
                      onClick={() => handleAction(item._id, "rejected")}
                      disabled={!!processingId}
                      className={`${styles.actionButton} ${
                        styles.rejectButton
                      } ${
                        processingId === item._id ? styles.disabledButton : ""
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(item._id, "approved")}
                      disabled={!!processingId}
                      className={`${styles.actionButton} ${
                        styles.approveButton
                      } ${
                        processingId === item._id ? styles.disabledButton : ""
                      }`}
                    >
                      {processingId === item._id ? "..." : "Approve"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
