"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./Shipping.module.css";

interface ShippingRate {
  _id: string;
  country: string;
  state: string;
  fee: number;
  isActive: boolean;
}

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Ghana",
];

export default function AdminShippingPage() {
  const { data: session } = useSession();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [selectedCountry, setSelectedCountry] = useState("Nigeria");
  const [newState, setNewState] = useState("");
  const [newFee, setNewFee] = useState("");

  useEffect(() => {
    fetchRates();
  }, [selectedCountry]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipping?country=${selectedCountry}`);
      const data = await res.json();
      setRates(data);
    } catch (error) {
      console.error("Failed to fetch rates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate: ShippingRate) => {
    setEditingId(rate._id);
    setEditFee(rate.fee);
  };

  const handleSave = async (rate: ShippingRate) => {
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: rate.state,
          fee: editFee,
          country: selectedCountry,
        }),
      });

      if (res.ok) {
        setRates(
          rates.map((r) => (r._id === rate._id ? { ...r, fee: editFee } : r))
        );
        setEditingId(null);
      } else {
        alert("Failed to update rate");
      }
    } catch (error) {
      console.error("Update error", error);
      alert("Failed to update rate");
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newState || !newFee) return;

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: newState,
          fee: Number(newFee),
          country: selectedCountry,
        }),
      });

      if (res.ok) {
        const newRate = await res.json();
        if (newRate.country === selectedCountry) {
          const exists = rates.find((r) => r.state === newRate.state);
          if (exists) {
            setRates(
              rates.map((r) => (r.state === newRate.state ? newRate : r))
            );
          } else {
            setRates(
              [...rates, newRate].sort((a, b) => a.state.localeCompare(b.state))
            );
          }
        }
        setNewState("");
        setNewFee("");
      } else {
        alert("Failed to add rate");
      }
    } catch (error) {
      console.error("Add error", error);
      alert("Failed to add rate");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Shipping Rates</h1>

        <div className={styles.headerControls}>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className={styles.select}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              fetch("/api/admin/seed-shipping").then(() => fetchRates())
            }
            className={styles.seedButton}
          >
            Seed Defaults
          </button>
        </div>
      </div>

      {/* Add New Rate Form */}
      <div className={styles.formCard}>
        <h3 className={styles.formTitle}>
          Add/Update Rate for {selectedCountry}
        </h3>
        <form onSubmit={handleAddRate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>State/Region</label>
            <input
              type="text"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              placeholder="e.g. California"
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Fee (NGN)</label>
            <input
              type="number"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              placeholder="0"
              className={styles.input}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Add Rate
          </button>
        </form>
      </div>

      <div className={styles.tableCard}>
        {/* Mobile List View */}
        <div className={styles.mobileList}>
          {loading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : rates.length === 0 ? (
            <div className={styles.emptyState}>
              No rates found for {selectedCountry}. Add one above.
            </div>
          ) : (
            rates.map((rate) => (
              <div key={rate._id} className={styles.shippingCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardState}>{rate.state}</div>
                  <div className={styles.cardFee}>
                    ₦{rate.fee.toLocaleString()}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(rate)}
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className={styles.desktopTableWrapper}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>State/Region</th>
                  <th className={styles.tableHeadCell}>Shipping Fee</th>
                  <th
                    className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {loading ? (
                  <tr>
                    <td colSpan={3} className={styles.emptyState}>
                      Loading...
                    </td>
                  </tr>
                ) : rates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.emptyState}>
                      No rates found for {selectedCountry}. Add one above.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate._id} className={styles.tableRow}>
                      <td className={styles.tableCell}>{rate.state}</td>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellSecondary}`}
                      >
                        {editingId === rate._id ? (
                          <input
                            type="number"
                            value={editFee}
                            onChange={(e) => setEditFee(Number(e.target.value))}
                            className={styles.editInput}
                          />
                        ) : (
                          `₦${rate.fee.toLocaleString()}`
                        )}
                      </td>
                      <td
                        className={`${styles.tableCell} ${styles.tableCellRight}`}
                      >
                        {editingId === rate._id ? (
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleSave(rate)}
                              className={`${styles.actionButton} ${styles.saveButton}`}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className={`${styles.actionButton} ${styles.cancelButton}`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(rate)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
