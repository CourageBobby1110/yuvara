"use client";

import { useState, useEffect } from "react";
import styles from "./WhatsApp.module.css";
import AdminLoader from "@/components/AdminLoader";

interface WhatsAppSession {
  _id: string;
  phone: string;
  name: string;
  userId?: string;
  state: string;
  lastMessageAt: string;
  registeredAt?: string;
  messageCount: number;
  lastMessage: string;
  lastMessageRole: string;
  cart: { name: string; price: number; quantity: number }[];
  createdAt: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SessionDetail {
  _id: string;
  phone: string;
  name: string;
  state: string;
  conversationHistory: ConversationMessage[];
  cart: { name: string; price: number; quantity: number }[];
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    email?: string;
  };
  dvaAccountNumber?: string;
  dvaBankName?: string;
  registeredAt?: string;
}

interface Stats {
  totalSessions: number;
  activeLast24h: number;
  registeredUsers: number;
  withItemsInCart: number;
}

export default function AdminWhatsAppPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);
  const [chatDetail, setChatDetail] = useState<SessionDetail | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "registered" | "cart">("all");
  const [promoSending, setPromoSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp");
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (phone: string) => {
    if (expandedPhone === phone) {
      setExpandedPhone(null);
      setChatDetail(null);
      return;
    }

    setExpandedPhone(phone);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/admin/whatsapp?phone=${phone}`);
      const data = await res.json();
      if (res.ok) {
        setChatDetail(data.session);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const triggerPromo = async () => {
    if (!confirm("Send promotional messages to all active WhatsApp users?")) return;

    setPromoSending(true);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setToast({
          message: `✅ ${data.message}`,
          type: "success",
        });
      } else {
        setToast({
          message: `❌ ${data.error || "Failed to send promotions"}`,
          type: "error",
        });
      }
    } catch (error) {
      setToast({ message: "❌ Network error", type: "error" });
    } finally {
      setPromoSending(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "active") {
      return (
        s.lastMessageAt &&
        new Date(s.lastMessageAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
    }
    if (filter === "registered") return !!s.userId;
    if (filter === "cart") return s.cart && s.cart.length > 0;
    return true;
  });

  const formatTime = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60 * 1000) return "Just now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return (name || "?").charAt(0).toUpperCase();
  };

  if (loading) {
    return <AdminLoader />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>WhatsApp Bot</h1>
          <p className={styles.subtitle}>
            Monitor AI conversations and manage promotions
          </p>
        </div>
        <button
          className={styles.promoButton}
          onClick={triggerPromo}
          disabled={promoSending}
        >
          {promoSending ? "📨 Sending..." : "📣 Send Promotions"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalSessions}</div>
            <div className={styles.statLabel}>Total Conversations</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.activeLast24h}</div>
            <div className={styles.statLabel}>Active (24h)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.registeredUsers}</div>
            <div className={styles.statLabel}>Registered Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.withItemsInCart}</div>
            <div className={styles.statLabel}>Items in Cart</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        {(["all", "active", "registered", "cart"] as const).map((f) => (
          <button
            key={f}
            className={`${styles.filterButton} ${filter === f ? styles.active : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? `All (${sessions.length})`
              : f === "active"
                ? `Active (${stats?.activeLast24h || 0})`
                : f === "registered"
                  ? `Registered (${stats?.registeredUsers || 0})`
                  : `Has Cart (${stats?.withItemsInCart || 0})`}
          </button>
        ))}
      </div>

      {/* Session List */}
      {filteredSessions.length === 0 ? (
        <div className={styles.empty}>
          No WhatsApp conversations yet. Once users message the bot, conversations will appear here.
        </div>
      ) : (
        <div className={styles.sessionList}>
          {filteredSessions.map((s) => (
            <div key={s._id} className={styles.sessionCard}>
              {/* Session Header */}
              <div
                className={styles.sessionHeader}
                onClick={() => fetchChat(s.phone)}
              >
                <div className={styles.avatar}>{getInitials(s.name)}</div>
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionName}>
                    {s.name || "Unknown"}
                  </div>
                  <div className={styles.sessionPhone}>{s.phone}</div>
                  {s.lastMessage && (
                    <div className={styles.sessionPreview}>
                      {s.lastMessageRole === "assistant" ? "🤖 " : "👤 "}
                      {s.lastMessage}
                    </div>
                  )}
                </div>
                <div className={styles.sessionMeta}>
                  <span className={styles.sessionTime}>
                    {formatTime(s.lastMessageAt)}
                  </span>
                  <div className={styles.badges}>
                    {s.messageCount > 0 && (
                      <span className={`${styles.badge} ${styles.badgeActive}`}>
                        {s.messageCount} msgs
                      </span>
                    )}
                    {s.userId && (
                      <span className={`${styles.badge} ${styles.badgeRegistered}`}>
                        Registered
                      </span>
                    )}
                    {s.cart && s.cart.length > 0 && (
                      <span className={`${styles.badge} ${styles.badgeCart}`}>
                        🛒 {s.cart.length}
                      </span>
                    )}
                    {s.state !== "idle" && (
                      <span className={`${styles.badge} ${styles.badgeState}`}>
                        {s.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Chat View */}
              {expandedPhone === s.phone && (
                <div className={styles.chatView}>
                  {chatLoading ? (
                    <div className={styles.chatEmpty}>Loading conversation...</div>
                  ) : chatDetail?.conversationHistory &&
                    chatDetail.conversationHistory.length > 0 ? (
                    <div className={styles.chatMessages}>
                      {chatDetail.conversationHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`${styles.chatBubble} ${
                            msg.role === "user"
                              ? styles.userBubble
                              : styles.botBubble
                          }`}
                        >
                          {msg.content}
                          <div className={styles.chatTimestamp}>
                            {msg.role === "user" ? "👤 Customer" : "🤖 Bot"}
                            {msg.timestamp &&
                              ` · ${new Date(msg.timestamp).toLocaleTimeString()}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.chatEmpty}>
                      No messages in this conversation yet
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
