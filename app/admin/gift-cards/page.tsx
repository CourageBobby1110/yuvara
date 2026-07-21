"use client";

import { useState, useEffect } from "react";
import styles from "./AdminGiftCards.module.css";
import AdminSkeleton from "@/components/AdminSkeleton";
import { Search, Plus, Trash2, Power, PowerOff, Gift, X } from "lucide-react";

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
      } else {
        alert("Failed to delete gift card");
      }
    } catch (error) {
      console.error("Delete error", error);
      alert("Failed to delete gift card");
    }
  };

  if (loading) return <AdminSkeleton variant="table" />;

  const activeCount = giftCards.filter((c) => c.status === "active").length;
  const usedCount = giftCards.filter((c) => c.status === "used").length;
  const totalValue = giftCards.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Gift Cards</h1>
          <p className={styles.subtitle}>Manage and track all gift cards</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={styles.createButton}
        >
          <Plus size={18} />
          Create Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Gift size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{giftCards.length}</span>
            <span className={styles.statLabel}>Total Cards</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconActive}`}>
            <Power size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconUsed}`}>
            <Gift size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{usedCount}</span>
            <span className={styles.statLabel}>Used</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by code, email, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
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
          <div className={styles.emptyState}>
            <Gift size={48} className={styles.emptyIcon} />
            <p>No gift cards found.</p>
          </div>
        ) : (
          giftCards.map((card) => {
            const usedPercent =
              card.initialBalance > 0
                ? ((card.initialBalance - card.currentBalance) /
                    card.initialBalance) *
                  100
                : 0;

            return (
              <div key={card._id} className={styles.giftCardCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardCodeSection}>
                    <Gift size={16} className={styles.cardGiftIcon} />
                    <code className={styles.cardCode}>{card.code}</code>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${styles[card.status]}`}
                  >
                    {card.status}
                  </span>
                </div>

                <div className={styles.balanceSection}>
                  <div className={styles.balanceHeader}>
                    <span className={styles.balanceLabel}>Balance</span>
                    <span className={styles.balanceAmount}>
                      &#8358;{card.currentBalance.toLocaleString()}
                      <span className={styles.balanceInitial}>
                        /&#8358;{card.initialBalance.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${100 - usedPercent}%` }}
                    />
                  </div>
                </div>

                <div className={styles.cardDetails}>
                  {card.recipientEmail && (
                    <div className={styles.cardDetail}>
                      <span className={styles.detailLabel}>Recipient</span>
                      <span className={styles.detailValue}>
                        {card.recipientName || card.recipientEmail}
                      </span>
                    </div>
                  )}
                  <div className={styles.cardDetail}>
                    <span className={styles.detailLabel}>Purchased</span>
                    <span className={styles.detailValue}>
                      {new Date(card.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  {card.purchasedBy && (
                    <div className={styles.cardDetail}>
                      <span className={styles.detailLabel}>By</span>
                      <span className={styles.detailValue}>
                        {card.purchasedBy.name}
                      </span>
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
                    {card.isActive ? (
                      <>
                        <PowerOff size={14} /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power size={14} /> Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(card._id)}
                    className={styles.deleteButton}
                    title="Delete Gift Card"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
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
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {giftCards.map((card) => (
              <tr key={card._id} className={styles.tr}>
                <td className={styles.td}>
                  <code className={styles.tableCode}>{card.code}</code>
                </td>
                <td className={styles.td}>
                  <span className={styles.tableBalance}>
                    &#8358;{card.currentBalance.toLocaleString()}
                  </span>
                </td>
                <td className={styles.td}>
                  <span className={styles.tableInitial}>
                    &#8358;{card.initialBalance.toLocaleString()}
                  </span>
                </td>
                <td className={styles.td}>
                  {card.recipientName || card.recipientEmail || (
                    <span className={styles.noData}>-</span>
                  )}
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
                <td className={`${styles.td} ${styles.dateCell}`}>
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
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {giftCards.length === 0 && (
          <div className={styles.emptyState}>
            <Gift size={48} className={styles.emptyIcon} />
            <p>No gift cards found.</p>
          </div>
        )}
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
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create Gift Card</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={styles.modalClose}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateGiftCard} className={styles.form}>
              <div className={styles.formRow}>
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
                  <label className={styles.label}>Amount (&#8358;) *</label>
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
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Recipient Email</label>
                  <input
                    type="email"
                    value={newCard.recipientEmail}
                    onChange={(e) =>
                      setNewCard({
                        ...newCard,
                        recipientEmail: e.target.value,
                      })
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
                      setNewCard({
                        ...newCard,
                        recipientName: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    className={styles.input}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Message</label>
                <input
                  type="text"
                  value={newCard.message}
                  onChange={(e) =>
                    setNewCard({ ...newCard, message: e.target.value })
                  }
                  placeholder="Happy Birthday!"
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
                  <Plus size={18} />
                  Create Gift Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
