"use client";

import { useState, useEffect } from "react";
import styles from "./AdminReferrals.module.css";
import AdminSkeleton from "@/components/AdminSkeleton";
import { Plus } from "lucide-react";

interface ReferralBatch {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxWinners: number;
  currentWinners: number;
  isActive: boolean;
}

export default function AdminReferralsPage() {
  const [batches, setBatches] = useState<ReferralBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    maxWinners: 20,
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error("Failed to fetch batches", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", startDate: "", endDate: "", maxWinners: 20 });
        fetchBatches();
      }
    } catch (error) {
      console.error("Failed to create batch", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <AdminSkeleton variant="table" />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Referral Campaigns</h1>
        <p className={styles.subtitle}>Manage referral campaigns and winners</p>
      </div>

      <div className={styles.grid}>
        {/* Create Form */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Create New Batch</h2>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Campaign Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={styles.input}
                placeholder="e.g., November Giveaway"
              />
            </div>
            <div className={styles.dateRow}>
              <div className={styles.field}>
                <label className={styles.label}>Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Max Winners</label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxWinners}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxWinners: parseInt(e.target.value),
                  })
                }
                className={styles.input}
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className={styles.submitButton}
            >
              <Plus size={16} />
              {isCreating ? "Creating..." : "Create Campaign"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className={styles.listSection}>
          <h2 className={styles.sectionTitle}>Active & Past Campaigns</h2>
          <div className={styles.campaignList}>
            {batches.map((batch) => (
              <div key={batch._id} className={styles.card}>
                <div className={styles.batchHeader}>
                  <div className={styles.batchInfo}>
                    <h3 className={styles.batchName}>{batch.name}</h3>
                    <p className={styles.batchDates}>
                      {new Date(batch.startDate).toLocaleDateString()} -{" "}
                      {new Date(batch.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`${styles.badge} ${
                      batch.isActive ? styles.badgeActive : styles.badgeInactive
                    }`}
                  >
                    {batch.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span className={styles.progressLabel}>Winners Claimed</span>
                    <span className={styles.progressValue}>
                      {batch.currentWinners} / {batch.maxWinners}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.min(
                          100,
                          (batch.currentWinners / batch.maxWinners) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {batches.length === 0 && (
              <div className={styles.emptyState}>No campaigns found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
