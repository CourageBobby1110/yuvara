"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./UserGiftCards.module.css";

interface GiftCard {
  _id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  status: "active" | "used" | "expired" | "cancelled";
  purchaseDate: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  isActive: boolean;
}

export default function UserGiftCardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "used">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchGiftCards();
    }
  }, [status, router]);

  const fetchGiftCards = async () => {
    try {
      const res = await fetch("/api/user/gift-cards");
      if (res.ok) {
        const data = await res.json();
        setGiftCards(data.giftCards || []);
      }
    } catch (error) {
      console.error("Failed to fetch gift cards", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = giftCards.filter((card) => {
    if (activeTab === "active")
      return card.status === "active" && card.currentBalance > 0;
    if (activeTab === "used")
      return card.status === "used" || card.currentBalance === 0;
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your gift cards...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Gift Cards</h1>
        <p className={styles.subtitle}>
          View and manage your gift card balances
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab("all")}
          className={`${styles.tab} ${
            activeTab === "all" ? styles.activeTab : ""
          }`}
        >
          All Cards
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`${styles.tab} ${
            activeTab === "active" ? styles.activeTab : ""
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab("used")}
          className={`${styles.tab} ${
            activeTab === "used" ? styles.activeTab : ""
          }`}
        >
          Used
        </button>
      </div>

      {/* Gift Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎁</div>
          <h3 className={styles.emptyTitle}>No Gift Cards Yet</h3>
          <p className={styles.emptyText}>
            {activeTab === "all"
              ? "You don't have any gift cards. Purchase one to get started!"
              : activeTab === "active"
              ? "You don't have any active gift cards."
              : "You don't have any used gift cards."}
          </p>
          <a href="/gift-cards" className={styles.purchaseButton}>
            Purchase Gift Card
          </a>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCards.map((card) => (
            <div key={card._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardStatus}>
                  <span
                    className={`${styles.statusBadge} ${
                      card.status === "active" && card.currentBalance > 0
                        ? styles.statusActive
                        : styles.statusUsed
                    }`}
                  >
                    {card.status === "active" && card.currentBalance > 0
                      ? "Active"
                      : "Used"}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.balance}>
                  <div className={styles.balanceLabel}>Current Balance</div>
                  <div className={styles.balanceAmount}>
                    ₦{card.currentBalance.toLocaleString()}
                  </div>
                  <div className={styles.balanceOriginal}>
                    of ₦{card.initialBalance.toLocaleString()}
                  </div>
                </div>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${
                        (card.currentBalance / card.initialBalance) * 100
                      }%`,
                    }}
                  />
                </div>

                <div className={styles.cardCode}>
                  <div className={styles.codeLabel}>Gift Card Code</div>
                  <div className={styles.code}>{card.code}</div>
                </div>

                {card.message && (
                  <div className={styles.message}>
                    <div className={styles.messageLabel}>Message</div>
                    <div className={styles.messageText}>{card.message}</div>
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <div className={styles.purchaseDate}>
                    Received {new Date(card.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {giftCards.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Balance</div>
            <div className={styles.summaryValue}>
              ₦
              {giftCards
                .reduce((sum, card) => sum + card.currentBalance, 0)
                .toLocaleString()}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Active Cards</div>
            <div className={styles.summaryValue}>
              {
                giftCards.filter(
                  (card) => card.status === "active" && card.currentBalance > 0
                ).length
              }
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Cards</div>
            <div className={styles.summaryValue}>{giftCards.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
