"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./AdminGiftCards.module.css";
import AdminLoader from "@/components/AdminLoader";

interface GiftCard {
  _id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  purchasedBy?: {
    name: string;
    email: string;
  };
  recipientEmail?: string;
  recipientName?: string;
  status: "active" | "used" | "expired" | "cancelled";
  purchaseDate: string;
  paymentReference?: string;
  lastUsedDate?: string;
  isActive: boolean;
  usageHistory: Array<{
    orderId: string;
    amountUsed: number;
    date: string;
  }>;
}

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create modal state
  const [newCard, setNewCard] = useState({
    code: "",
    amount: "",
    recipientEmail: "",
    recipientName: "",
    message: "",
  });

  useEffect(() => {
    fetchGiftCards();
  }, [page, statusFilter, searchTerm]);

  const fetchGiftCards = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: statusFilter,
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/gift-cards?${params}`);
      const data = await res.json();

      if (res.ok) {
        setGiftCards(data.giftCards);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch gift cards", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (giftCard: GiftCard) => {
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: giftCard._id,
          isActive: !giftCard.isActive,
        }),
      });

      if (res.ok) {
        fetchGiftCards();
      } else {
        alert("Failed to update gift card");
      }
    } catch (error) {
      console.error("Update error", error);
      alert("Failed to update gift card");
    }
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCard.code,
          amount: Number(newCard.amount),
          recipientEmail: newCard.recipientEmail,
          recipientName: newCard.recipientName,
          message: newCard.message,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCard({
          code: "",
          amount: "",
          recipientEmail: "",
          recipientName: "",
          message: "",
        });
        fetchGiftCards();
        alert("Gift card created successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create gift card");
      }
    } catch (error) {
      console.error("Create error", error);
      alert("Failed to create gift card");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gift card?")) return;

    try {
      const res = await fetch(`/api/admin/gift-cards?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchGiftCards();
        alert("Gift card deleted successfully");
      } else {
        alert("Failed to delete gift card");
      }
    } catch (error) {
      console.error("Delete error", error);
      alert("Failed to delete gift card");
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gift Cards</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className={styles.createButton}
        >
          Create Gift Card
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by code, email, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Mobile Cards */}
      <div className={styles.mobileList}>
        {giftCards.length === 0 ? (
          <div className={styles.emptyState}>No gift cards found.</div>
        ) : (
          giftCards.map((card) => (
            <div key={card._id} className={styles.giftCardCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardCode}>{card.code}</div>
                <span
                  className={`${styles.statusBadge} ${styles[card.status]}`}
                >
                  {card.status}
                </span>
              </div>

              <div className={styles.cardDetails}>
                <div className={styles.cardDetail}>
                  <div className={styles.detailLabel}>Balance</div>
                  <div className={styles.detailValue}>
                    ₦{card.currentBalance.toLocaleString()} / ₦
                    {card.initialBalance.toLocaleString()}
                  </div>
                </div>
                {card.recipientEmail && (
                  <div className={styles.cardDetail}>
                    <div className={styles.detailLabel}>Recipient</div>
                    <div className={styles.detailValue}>
                      {card.recipientName || card.recipientEmail}
                    </div>
                  </div>
                )}
                <div className={styles.cardDetail}>
                  <div className={styles.detailValue}>
                    {new Date(card.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
                {card.purchasedBy && (
                  <div className={styles.cardDetail}>
                    <div className={styles.detailLabel}>Purchased By</div>
                    <div className={styles.detailValue}>
                      {card.purchasedBy.name} ({card.purchasedBy.email})
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => handleToggleActive(card)}
                  className={`${styles.actionButton} ${
                    card.isActive
                      ? styles.deactivateButton
                      : styles.activateButton
                  }`}
                >
                  {card.isActive ? "Deactivate" : "Activate"}
                </button>
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
              <th className={styles.th}>Balance</th>
              <th className={styles.th}>Initial</th>
              <th className={styles.th}>Recipient</th>
              <th className={styles.th}>Purchased By</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Purchased</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {giftCards.map((card) => (
              <tr key={card._id} className={styles.tr}>
                <td className={styles.td}>
                  <code>{card.code}</code>
                </td>
                <td className={styles.td}>
                  ₦{card.currentBalance.toLocaleString()}
                </td>
                <td className={styles.td}>
                  ₦{card.initialBalance.toLocaleString()}
                </td>
                <td className={styles.td}>
                  {card.recipientName || card.recipientEmail || "-"}
                </td>
                <td className={styles.td}>
                  {card.purchasedBy ? (
                    <div>
                      <div className={styles.userName}>
                        {card.purchasedBy.name}
                      </div>
                      <div className={styles.userEmail}>
                        {card.purchasedBy.email}
                      </div>
                    </div>
                  ) : card.paymentReference ? (
                    <span className={styles.unknownUser}>
                      Purchased (User Unknown)
                    </span>
                  ) : (
                    <span className={styles.adminUser}>Admin / Manual</span>
                  )}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.statusBadge} ${styles[card.status]}`}
                  >
                    {card.status}
                  </span>
                </td>
                <td className={styles.td}>
                  {new Date(card.purchaseDate).toLocaleDateString()}
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleToggleActive(card)}
                      className={`${styles.actionButton} ${
                        card.isActive
                          ? styles.deactivateButton
                          : styles.activateButton
                      }`}
                    >
                      {card.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(card._id)}
                      className={styles.deleteButton}
                      title="Delete Gift Card"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={styles.pageButton}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create Gift Card</h2>
            <form onSubmit={handleCreateGiftCard} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Code *</label>
                <input
                  type="text"
                  value={newCard.code}
                  onChange={(e) =>
                    setNewCard({
                      ...newCard,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Amount (₦) *</label>
                <input
                  type="number"
                  value={newCard.amount}
                  onChange={(e) =>
                    setNewCard({ ...newCard, amount: e.target.value })
                  }
                  placeholder="10000"
                  required
                  min="1000"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Recipient Email</label>
                <input
                  type="email"
                  value={newCard.recipientEmail}
                  onChange={(e) =>
                    setNewCard({ ...newCard, recipientEmail: e.target.value })
                  }
                  placeholder="recipient@example.com"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Recipient Name</label>
                <input
                  type="text"
                  value={newCard.recipientName}
                  onChange={(e) =>
                    setNewCard({ ...newCard, recipientName: e.target.value })
                  }
                  placeholder="John Doe"
                  className={styles.input}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
