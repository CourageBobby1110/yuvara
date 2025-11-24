"use client";

import { useState, useEffect } from "react";
import styles from "./Messages.module.css";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read" | "archived";
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "archived">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        setMessages(
          messages.map((msg) =>
            msg._id === id ? { ...msg, status: status as any } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages(messages.filter((msg) => msg._id !== id));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "all") return true;
    return msg.status === filter;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Messages</h1>
        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${
              filter === "all" ? styles.active : ""
            }`}
            onClick={() => setFilter("all")}
          >
            All ({messages.length})
          </button>
          <button
            className={`${styles.filterButton} ${
              filter === "unread" ? styles.active : ""
            }`}
            onClick={() => setFilter("unread")}
          >
            Unread ({messages.filter((m) => m.status === "unread").length})
          </button>
          <button
            className={`${styles.filterButton} ${
              filter === "read" ? styles.active : ""
            }`}
            onClick={() => setFilter("read")}
          >
            Read ({messages.filter((m) => m.status === "read").length})
          </button>
          <button
            className={`${styles.filterButton} ${
              filter === "archived" ? styles.active : ""
            }`}
            onClick={() => setFilter("archived")}
          >
            Archived ({messages.filter((m) => m.status === "archived").length})
          </button>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className={styles.empty}>No messages found</div>
      ) : (
        <div className={styles.messageList}>
          {filteredMessages.map((msg) => (
            <div
              key={msg._id}
              className={`${styles.messageCard} ${
                msg.status === "unread" ? styles.unread : ""
              }`}
            >
              <div
                className={styles.messageHeader}
                onClick={() => toggleExpand(msg._id)}
              >
                <div className={styles.messageInfo}>
                  <h3 className={styles.messageName}>{msg.name}</h3>
                  <p className={styles.messageEmail}>{msg.email}</p>
                  <p className={styles.messageDate}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className={styles.statusBadge}>
                  <span className={`${styles.badge} ${styles[msg.status]}`}>
                    {msg.status}
                  </span>
                </div>
              </div>

              {expandedId === msg._id && (
                <div className={styles.messageBody}>
                  <div className={styles.messageContent}>
                    <h4>Message:</h4>
                    <p>{msg.message}</p>
                  </div>

                  <div className={styles.actions}>
                    {msg.status === "unread" && (
                      <button
                        className={styles.actionButton}
                        onClick={() => updateStatus(msg._id, "read")}
                      >
                        Mark as Read
                      </button>
                    )}
                    {msg.status !== "archived" && (
                      <button
                        className={styles.actionButton}
                        onClick={() => updateStatus(msg._id, "archived")}
                      >
                        Archive
                      </button>
                    )}
                    <a
                      href={`mailto:${msg.email}`}
                      className={styles.actionButton}
                    >
                      Reply via Email
                    </a>
                    <button
                      className={`${styles.actionButton} ${styles.delete}`}
                      onClick={() => deleteMessage(msg._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
