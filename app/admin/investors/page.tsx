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
  });

  const router = useRouter();

  useEffect(() => {
    fetchInvestors();
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
    });
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

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
        >
          <YuvaraLoader text="Loading Investors..." />
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Name / Email</th>
                <th className={styles.th}>Access Pin</th>
                <th className={styles.th}>Initial Amount</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Start Date</th>
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {investors.map((investor) => (
                <tr key={investor._id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.investorName}>{investor.name}</div>
                    <div className={styles.investorEmail}>{investor.email}</div>
                  </td>
                  <td className={`${styles.td} text-sm text-gray-500`}>
                    {investor.accessPin}
                  </td>
                  <td className={`${styles.td} text-sm text-gray-900`}>
                    ₦{investor.initialAmount.toLocaleString()}
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        investor.status
                      )}`}
                    >
                      {investor.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className={`${styles.td} text-sm text-gray-500`}>
                    {new Date(investor.startDate).toLocaleDateString()}
                  </td>
                  <td className={`${styles.td} text-right`}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
