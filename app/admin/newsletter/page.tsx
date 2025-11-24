"use client";

import { useState, useEffect } from "react";
import styles from "./AdminNewsletter.module.css";

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "subscribers">(
    "compose"
  );
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Compose Form State
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (activeTab === "subscribers") {
      fetchSubscribers();
    }
  }, [activeTab]);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/subscribers");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;

    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubscribers(subscribers.filter((s) => s._id !== id));
      } else {
        alert("Failed to delete subscriber");
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
    }
  };

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !confirm(
        "Are you sure you want to send this newsletter to all subscribers?"
      )
    )
      return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, markdownBody: body }),
      });

      if (res.ok) {
        alert("Newsletter sent successfully!");
        setSubject("");
        setBody("");
      } else {
        const data = await res.json();
        alert(`Failed to send: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert("An error occurred while sending the newsletter.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Newsletter Management</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "compose" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("compose")}
        >
          Compose
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "subscribers" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("subscribers")}
        >
          Subscribers
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "compose" ? (
          <form onSubmit={handleSendNewsletter}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Subject</label>
              <input
                type="text"
                className={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Enter newsletter subject"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Content (Markdown)</label>
              <textarea
                className={styles.textarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="# Heading&#10;&#10;Write your newsletter content here using Markdown..."
              />
              <p className={styles.helperText}>
                Supports standard Markdown syntax.
              </p>
            </div>

            <button
              type="submit"
              className={styles.sendButton}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Newsletter"}
            </button>
          </form>
        ) : (
          <>
            {isLoading ? (
              <div className={styles.emptyState}>Loading subscribers...</div>
            ) : subscribers.length === 0 ? (
              <div className={styles.emptyState}>No subscribers found.</div>
            ) : (
              <>
                {/* Mobile Subscriber Cards */}
                <div className={styles.mobileList}>
                  {subscribers.map((subscriber) => (
                    <div key={subscriber._id} className={styles.subscriberCard}>
                      <div className={styles.subscriberCardEmail}>
                        {subscriber.email}
                      </div>
                      <div className={styles.subscriberCardFooter}>
                        <span className={styles.subscriberCardDate}>
                          Joined{" "}
                          {new Date(subscriber.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteSubscriber(subscriber._id)}
                          className={styles.deleteButton}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className={styles.desktopTableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Subscribed Date</th>
                        <th className={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber._id} className={styles.tr}>
                          <td className={styles.td}>{subscriber.email}</td>
                          <td className={styles.td}>
                            {new Date(
                              subscriber.createdAt
                            ).toLocaleDateString()}
                          </td>
                          <td className={styles.td}>
                            <button
                              onClick={() =>
                                handleDeleteSubscriber(subscriber._id)
                              }
                              className={styles.deleteButton}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
