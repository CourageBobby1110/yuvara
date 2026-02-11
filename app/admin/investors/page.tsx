"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminInvestors.module.css";
import YuvaraLoader from "@/components/YuvaraLoader";

interface Investor {
  _id: string;
  name: string;
  email: string;
  accessPin: string;
  initialAmount: number;
  status: string;
  startDate: string;
  pendingTopUp: number;
  customProfitRate?: number;
}

export default function AdminInvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    accessPin: "",
    initialAmount: 0,
    status: "active",
    customProfitRate: "",
  });
  // Top Up State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);

  const [globalProfitRate, setGlobalProfitRate] = useState<number | "">("");
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchInvestors();
    fetchGlobalSettings();
  }, []);

  const fetchInvestors = async () => {
    try {
      const res = await fetch("/api/admin/investors");
      if (!res.ok) throw new Error("Failed to fetch investors");
      const data = await res.json();
      setInvestors(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/investment");
      if (res.ok) {
        const data = await res.json();
        setGlobalProfitRate(data.investmentProfitRate);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const updateGlobalProfitRate = async () => {
    const rate = Number(globalProfitRate);
    if (rate < 0 || isNaN(rate)) {
      alert("Please enter a valid percentage (0 or higher).");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to set the global profit rate to ${rate}%? This will affect ALL active investments.`,
      )
    ) {
      return;
    }

    setUpdatingSettings(true);
    try {
      const res = await fetch("/api/admin/settings/investment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profitRate: rate }),
      });

      if (!res.ok) throw new Error("Failed to update settings");
      alert(`Global Profit Rate updated to ${rate}%`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingInvestor
        ? `/api/admin/investors/${editingInvestor._id}`
        : "/api/admin/investors";
      const method = editingInvestor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Operation failed");
      }

      setIsModalOpen(false);
      setEditingInvestor(null);
      resetForm();
      fetchInvestors();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this investor?")) return;
    try {
      const res = await fetch(`/api/admin/investors/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchInvestors();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (investor: Investor) => {
    setEditingInvestor(investor);
    setFormData({
      name: investor.name,
      email: investor.email,
      password: "", // Don't show existing password
      accessPin: investor.accessPin,
      initialAmount: investor.initialAmount,
      status: investor.status,
      customProfitRate:
        investor.customProfitRate !== undefined &&
        investor.customProfitRate !== null
          ? investor.customProfitRate.toString()
          : "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      accessPin: "",
      initialAmount: 0,
      status: "active",
      customProfitRate: "",
    });
  };

  const openTopUpModal = (investor: Investor) => {
    setEditingInvestor(investor);
    setIsTopUpModalOpen(true);
    setTopUpAmount("");
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestor) return;

    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to add ₦${amount.toLocaleString()} to ${
          editingInvestor.name
        }'s capital?`,
      )
    ) {
      return;
    }

    setTopUpLoading(true);
    try {
      const res = await fetch(
        `/api/admin/investors/${editingInvestor._id}/top-up`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Top-up failed");

      alert("Top-up successful!");
      setIsTopUpModalOpen(false);
      setEditingInvestor(null);
      fetchInvestors(); // Refresh list to see new capital
    } catch (error: any) {
      alert(error.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const generateCredentials = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    const randomPass = Math.random().toString(36).slice(-8);
    setFormData({ ...formData, accessPin: randomPin, password: randomPass });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active":
        return styles.statusActive;
      case "withdrawal_requested":
        return styles.statusWithdrawalRequested;
      case "completed":
        return styles.statusCompleted;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Investors Management</h1>
        <button
          onClick={() => {
            setEditingInvestor(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className={styles.addButton}
        >
          Add New Investor
        </button>
      </div>

      {/* Global Settings Card */}
      <div className={styles.globalSettingsCard}>
        <h3 className={styles.settingsTitle}>Global Investment Settings</h3>
        <div className={styles.settingsContent}>
          <div className={styles.settingsInputGroup}>
            <label className={styles.settingsLabel}>
              Monthly Profit Percentage (%)
            </label>
            <div className={styles.settingsInputWrapper}>
              <input
                type="number"
                value={globalProfitRate}
                onChange={(e) =>
                  setGlobalProfitRate(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className={styles.settingsInput}
              />
              <button
                onClick={updateGlobalProfitRate}
                disabled={updatingSettings}
                className={styles.settingsButton}
              >
                {updatingSettings ? "Updating..." : "Update Rate"}
              </button>
            </div>
          </div>
          <p className={styles.settingsDescription}>
            This controls the monthly ROI for{" "}
            <strong>ALL active investors</strong>. Currently, an investment of
            ₦10,000 will yield{" "}
            <strong>
              ₦
              {(
                (10000 * (Number(globalProfitRate) || 0)) /
                100
              ).toLocaleString()}
            </strong>{" "}
            profit.
          </p>
        </div>
      </div>

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
        >
          <YuvaraLoader text="Loading Investors..." />
        </div>
      ) : (
        <div className={styles.grid}>
          {investors.map((investor) => (
            <div key={investor._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.investorName}>{investor.name}</div>
                  <div className={styles.investorEmail}>{investor.email}</div>
                </div>
                <span
                  className={`${styles.statusBadge} ${getStatusClass(
                    investor.status,
                  )}`}
                >
                  {investor.status.replace("_", " ")}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.row}>
                  <span className={styles.label}>Access Pin</span>
                  <span className={styles.value}>{investor.accessPin}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Initial Amount</span>
                  <span className={styles.value}>
                    ₦{investor.initialAmount.toLocaleString()}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Start Date</span>
                  <span className={styles.value}>
                    {new Date(investor.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Profit Rate</span>
                  <span className={styles.value}>
                    {investor.customProfitRate !== undefined &&
                    investor.customProfitRate !== null
                      ? `${investor.customProfitRate}% (Custom)`
                      : `${globalProfitRate}% (Global)`}
                  </span>
                </div>
                {investor.pendingTopUp > 0 && (
                  <div className={styles.row}>
                    <span
                      className={styles.label}
                      style={{ color: "#3b82f6", fontWeight: "600" }}
                    >
                      Pending Cycle
                    </span>
                    <span
                      className={styles.value}
                      style={{ color: "#2563eb", fontWeight: "700" }}
                    >
                      ₦{investor.pendingTopUp.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button
                  onClick={() => openTopUpModal(investor)}
                  className={`${styles.actionButton} ${styles.topUpButton}`}
                >
                  Top Up
                </button>
                <button
                  onClick={() => openEditModal(investor)}
                  className={styles.actionButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(investor._id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editingInvestor ? "Edit Investor" : "New Investor"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.col}>
                  <label className={styles.label}>Access Pin</label>
                  <input
                    type="text"
                    value={formData.accessPin}
                    onChange={(e) =>
                      setFormData({ ...formData, accessPin: e.target.value })
                    }
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.col}>
                  <label className={styles.label}>
                    Password {editingInvestor && "(Leave blank to keep)"}
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={styles.input}
                    required={!editingInvestor}
                  />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={generateCredentials}
                  className={styles.generateLink}
                >
                  Generate Random Credentials
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Initial Amount (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initialAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialAmount: parseFloat(e.target.value),
                    })
                  }
                  className={styles.input}
                  required
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Custom Profit Rate (%)
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      fontWeight: "normal",
                      marginLeft: "0.5rem",
                    }}
                  >
                    (Leave blank to use Global Rate: {globalProfitRate}%)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.customProfitRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customProfitRate: e.target.value,
                    })
                  }
                  className={styles.input}
                  placeholder={`Global Rate: ${globalProfitRate}%`}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className={styles.input}
                >
                  <option value="active">Active</option>
                  <option value="withdrawal_requested">
                    Withdrawal Requested
                  </option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Top Up Modal */}
      {isTopUpModalOpen && editingInvestor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "400px" }}>
            <h2 className={styles.modalTitle}>Top Up Investment</h2>
            <p className="mb-4 text-sm text-gray-600">
              Add funds to <strong>{editingInvestor.name}</strong>. This will
              increase their active capital and daily profit immediately.
            </p>
            <form onSubmit={handleTopUp}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Amount to Add (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className={styles.input}
                  required
                  min="1"
                  placeholder="e.g. 50000"
                  autoFocus
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsTopUpModalOpen(false);
                    setEditingInvestor(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  style={{
                    backgroundColor: "#10B981",
                    color: "white",
                    opacity: topUpLoading ? 0.7 : 1,
                  }}
                  disabled={topUpLoading}
                >
                  {topUpLoading ? "Adding..." : "Confirm Top Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
