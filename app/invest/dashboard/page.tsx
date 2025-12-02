"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Dashboard.module.css";
import YuvaraLoader from "@/components/YuvaraLoader";

interface InvestorData {
  investor: {
    name: string;
    email: string;
    initialAmount: number;
    startDate: string;
    status: string;
    messages: any[];
  };
  growth: {
    currentValue: number;
    daysElapsed: number;
    daysRemaining: number;
    percentage: number;
    isMatured: boolean;
  };
}

export default function InvestmentDashboardPage() {
  const [data, setData] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const router = useRouter();
  const { formatPrice, exchangeRates } = useCurrency();

  useEffect(() => {
    const token = localStorage.getItem("investorToken");
    if (!token) {
      router.push("/invest");
      return;
    }

    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const res = await fetch("/api/invest/data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("investorToken");
        router.push("/invest");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch data");
      const jsonData = await res.json();
      setData(jsonData);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to request a withdrawal?")) return;

    setWithdrawLoading(true);
    setWithdrawMessage("");
    const token = localStorage.getItem("investorToken");

    try {
      const res = await fetch("/api/invest/withdraw", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Withdrawal failed");

      setWithdrawMessage(json.message);
      // Refresh data to show updated status
      if (token) fetchData(token);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("investorToken");
    localStorage.removeItem("investorName");
    router.push("/invest");
  };

  // Helper to convert NGN amount to USD then format with global currency
  const formatAmount = (amountInNGN: number) => {
    // Assuming exchangeRates['NGN'] is the rate of NGN per 1 USD
    // So 1 USD = X NGN => 1 NGN = 1/X USD
    const rate = exchangeRates["NGN"] || 1500; // Fallback to 1500 if undefined
    const amountInUSD = amountInNGN / rate;
    return formatPrice(amountInUSD);
  };

  if (loading)
    return (
      <div
        className={styles.container}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <YuvaraLoader text="Loading Dashboard..." />
      </div>
    );
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!data) return null;

  const { investor, growth } = data;

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
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Investment Dashboard</h1>
          <div className={styles.userInfo}>
            <span className={styles.welcomeText}>Welcome, {investor.name}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Status Cards */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Initial Investment</h3>
            <p className={styles.cardValue}>
              {formatAmount(investor.initialAmount)}
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Current Value</h3>
            <p className={styles.cardValueGreen}>
              {formatAmount(growth.currentValue)}
            </p>
            <p className={styles.profitText}>
              +{formatAmount(growth.currentValue - investor.initialAmount)}{" "}
              Profit
            </p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Status</h3>
            <div className="mt-2 flex items-center">
              <span
                className={`${styles.statusBadge} ${getStatusClass(
                  investor.status
                )}`}
              >
                {investor.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Growth Progress */}
        <div className={`${styles.card} mb-8`}>
          <h3 className={styles.sectionTitle}>Investment Progress</h3>
          <div className={styles.progressContainer}>
            <div className={styles.progressLabels}>
              <div>
                <span className={styles.progressBadge}>
                  {Math.min(100, Math.round(growth.percentage))}% Completed
                </span>
              </div>
              <div className="text-right">
                <span className={styles.progressText}>
                  {growth.daysElapsed} / 30 Days
                </span>
              </div>
            </div>
            <div className={styles.progressBarBg}>
              <div
                style={{ width: `${Math.min(100, growth.percentage)}%` }}
                className={styles.progressBarFill}
              ></div>
            </div>
            <p className={styles.progressFooter}>
              {growth.isMatured
                ? "Investment period completed. You can now withdraw your funds."
                : `${growth.daysRemaining} days remaining until maturity.`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={`${styles.card} mb-8`}>
          <h3 className={styles.sectionTitle}>Actions</h3>

          {withdrawMessage && (
            <div className={styles.messageBox}>{withdrawMessage}</div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={
              !growth.isMatured ||
              investor.status !== "active" ||
              withdrawLoading
            }
            className={`${styles.withdrawButton} ${
              !growth.isMatured || investor.status !== "active"
                ? styles.withdrawButtonDisabled
                : styles.withdrawButtonActive
            }`}
          >
            {withdrawLoading ? "Processing..." : "Withdraw Funds"}
          </button>

          {!growth.isMatured && (
            <p className={styles.maturityText}>
              Withdrawal will be available on{" "}
              {new Date(
                new Date(investor.startDate).getTime() +
                  30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}
              .
            </p>
          )}
        </div>

        {/* Messages / Support */}
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Messages & Support</h3>

          {investor.messages.length > 0 ? (
            <div className={styles.messageList}>
              {investor.messages.map((msg, idx) => (
                <div key={idx} className={styles.messageItem}>
                  <h4 className={styles.messageTitle}>{msg.title}</h4>
                  <p className={styles.messageContent}>{msg.content}</p>
                  <span className={styles.messageDate}>
                    {new Date(msg.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noMessages}>No messages from admin.</p>
          )}

          <div className={styles.supportSection}>
            <h4 className={styles.supportTitle}>Report an Issue</h4>
            <p className={styles.supportText}>
              Need help? Send a message to the admin directly.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const subject = (
                  form.elements.namedItem("subject") as HTMLInputElement
                ).value;
                const message = (
                  form.elements.namedItem("message") as HTMLTextAreaElement
                ).value;

                if (!subject || !message)
                  return alert("Please fill in all fields");

                setSendingReport(true);
                try {
                  const token = localStorage.getItem("investorToken");
                  const res = await fetch("/api/invest/report", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ subject, message }),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error);
                  alert(json.message);
                  form.reset();
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setSendingReport(false);
                }
              }}
              className={styles.form}
            >
              <div className={styles.formGroup}>
                <label className={styles.label}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  required
                  className={styles.input}
                  placeholder="e.g., Withdrawal Issue"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Message</label>
                <textarea
                  name="message"
                  required
                  rows={3}
                  className={styles.textarea}
                  placeholder="Describe your issue..."
                ></textarea>
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={sendingReport}
                style={{ opacity: sendingReport ? 0.7 : 1 }}
              >
                {sendingReport ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
