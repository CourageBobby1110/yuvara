"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Dashboard.module.css";
import YuvaraLoader from "@/components/YuvaraLoader";
import { Download } from "lucide-react";

interface InvestorData {
  investor: {
    name: string;
    email: string;
    initialAmount: number;
    activeCapital: number;
    startDate: string;
    status: string;
    messages: any[];
    withdrawnProfit: number;
    bankDetails: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    rolloverHistory: any[];
    pendingTopUp: number;
    termsAccepted: boolean;
  };
  withdrawals: any[];
  growth: {
    currentValue: number;
    daysElapsed: number;
    daysRemaining: number;
    percentage: number;
    isMatured: boolean;
    isGracePeriod: boolean;
    gracePeriodDaysRemaining: number;
    totalProfit: number;
    availableProfit: number;
    accumulatedProfit: number;
    profitRate: number; // Added
  };
}

import InvestmentAgreementModal from "@/components/InvestmentAgreementModal";

export default function InvestmentDashboardPage() {
  const [data, setData] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [updatingBank, setUpdatingBank] = useState(false);

  // Terms State
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreeing, setAgreeing] = useState(false);

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

      // Check for Terms Acceptance
      if (jsonData.investor && !jsonData.investor.termsAccepted) {
        setShowAgreement(true);
      }

      if (jsonData.investor.bankDetails) {
        setBankDetails(jsonData.investor.bankDetails);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAgreeTerms = async () => {
    setAgreeing(true);
    const token = localStorage.getItem("investorToken");
    try {
      const res = await fetch("/api/invest/accept-terms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to accept terms");

      // Update local state
      if (data) {
        setData({
          ...data,
          investor: {
            ...data.investor,
            termsAccepted: true,
          },
        });
      }
      setShowAgreement(false);
      alert("Agreement Signed Successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to sign agreement. Please try again.");
    } finally {
      setAgreeing(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBank(true);
    const token = localStorage.getItem("investorToken");
    try {
      const res = await fetch("/api/invest/update-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankDetails),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      alert("Bank details updated successfully");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingBank(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (!bankDetails.bankName || !bankDetails.accountNumber) {
      alert("Please save your bank details first.");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (amount > data.growth.availableProfit) {
      alert("Insufficient available profit");
      return;
    }

    if (!confirm(`Are you sure you want to withdraw ${formatAmount(amount)}?`))
      return;

    setWithdrawLoading(true);
    setWithdrawMessage("");
    const token = localStorage.getItem("investorToken");

    try {
      const res = await fetch("/api/invest/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Withdrawal failed");

      setWithdrawMessage(json.message);
      setWithdrawAmount("");
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
      {showAgreement && (
        <InvestmentAgreementModal
          investorName={investor.name}
          amount={investor.initialAmount}
          startDate={investor.startDate}
          onAgree={handleAgreeTerms}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Investment Dashboard</h1>
          <div className={styles.userInfo}>
            <span className={styles.welcomeText}>Hi, {investor.name}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Status Cards */}
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Active Capital</h3>
            <p className={styles.cardValue}>
              {formatAmount(investor.activeCapital || investor.initialAmount)}
            </p>
            {investor.activeCapital > investor.initialAmount && (
              <div className="text-xs text-green-600 mt-1 font-medium bg-green-50 inline-block px-2 py-1 rounded-full">
                Compounded: +
                {formatAmount(investor.activeCapital - investor.initialAmount)}
              </div>
            )}
          </div>

          {/* Pending Top Up Indicator */}
          {investor.pendingTopUp > 0 && (
            <div
              className={styles.card}
              style={{
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
              }}
            >
              <h3 className={styles.cardLabel} style={{ color: "#1E40AF" }}>
                Pending Top Up
              </h3>
              <p className={styles.cardValue} style={{ color: "#1E3A8A" }}>
                {formatAmount(investor.pendingTopUp)}
              </p>
              <div className="text-xs text-blue-600 mt-1 font-medium">
                Verifying... Will activate next cycle.
              </div>
            </div>
          )}

          {/* Accumulated Profit Card (Old Profit) */}
          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Accumulated Profit (Old)</h3>
            <p className={styles.cardValue}>
              {formatAmount(growth.accumulatedProfit || 0)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Profits rolled over from previous cycles.
            </div>
          </div>

          {/* Current Cycle Profit Card */}
          <div className={styles.card}>
            <h3 className={styles.cardLabel}>
              Current Cycle Profit ({growth.profitRate}% Growth)
            </h3>
            <p className={styles.cardValue}>
              {formatAmount(growth.totalProfit)}
            </p>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${Math.min(growth.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.floor(growth.daysElapsed)} days elapsed</span>
              <span>{Math.ceil(growth.daysRemaining)} days left</span>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardLabel}>Available Balance</h3>
            <p className={styles.cardValue}>
              {formatAmount(growth.availableProfit)}
            </p>
            {growth.isGracePeriod ? (
              <div className="mt-2 text-xs text-green-600 font-bold uppercase animate-pulse">
                Window Open: {growth.gracePeriodDaysRemaining} Days Left
              </div>
            ) : (
              <div className="mt-2 text-xs text-amber-600 font-semibold uppercase">
                Locked (Accruing)
              </div>
            )}
          </div>
        </div>

        {/* Growth Progress */}
        <div className={`${styles.card} mb-8`}>
          <h3 className={styles.sectionTitle}>Cycle Progress</h3>
          <div className={styles.progressContainer}>
            <div className={styles.progressLabels}>
              <div>
                <span className={styles.progressBadge}>
                  {Math.min(100, Math.round(growth.percentage))}% MATURED
                </span>
              </div>
              <div className="text-right">
                <span className={styles.progressText}>
                  {growth.daysElapsed} / 30 DAYS
                </span>
              </div>
            </div>
            <div className={styles.progressBarBg}>
              <div
                style={{ width: `${Math.min(100, growth.percentage)}%` }}
                className={styles.progressBarFill}
              ></div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              {growth.isGracePeriod ? (
                <div>
                  <strong>🎉 Maturity reached!</strong>
                  <p className="mt-1">
                    You are in the 7-day grace period. You can withdraw your
                    profit now. Any unwithdrawn profit will be added to your
                    capital for the next cycle.
                  </p>
                </div>
              ) : growth.isMatured ? (
                // Should technically not happen due to rollover logic but good fallback
                <p>Cycle ending...</p>
              ) : (
                <p>
                  Investment is accruing. Next withdrawal window opens in{" "}
                  <strong>{growth.daysRemaining} days</strong>.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* History Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Withdrawal History */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Withdrawal History</h3>
            <div className="overflow-x-auto">
              {data.withdrawals && data.withdrawals.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.withdrawals.map((w: any) => (
                      <tr key={w._id}>
                        <td className="py-2">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 font-medium">
                          {formatAmount(w.amount)}
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              w.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : w.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm">No withdrawals yet.</p>
              )}
            </div>
          </div>

          {/* Top Up / Rollover History */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Transaction History</h3>
            <div className="overflow-x-auto">
              {investor.rolloverHistory &&
              investor.rolloverHistory.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Added Capital</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {investor.rolloverHistory.map((h: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2">
                          {new Date(h.date).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          {h.isTopUp ? (
                            <span className="text-blue-600 font-medium">
                              Top Up
                            </span>
                          ) : (
                            <span className="text-purple-600 font-medium">
                              Rollover
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right font-medium text-green-600">
                          +{formatAmount(h.amountAdded)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm">No transactions yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout for Actions & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Bank Details */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Bank Account</h3>
            <form onSubmit={handleUpdateBank} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Bank Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={bankDetails.bankName}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bankName: e.target.value })
                  }
                  required
                  placeholder="e.g. Chase Bank"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Account Number</label>
                <input
                  type="text"
                  className={styles.input}
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      accountNumber: e.target.value,
                    })
                  }
                  required
                  placeholder="0123456789"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Account Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={bankDetails.accountName}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      accountName: e.target.value,
                    })
                  }
                  required
                  placeholder="John Doe"
                />
              </div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={updatingBank}
              >
                {updatingBank ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>

          {/* Withdraw Action */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Withdraw Funds</h3>

            {withdrawMessage && (
              <div className={styles.messageBox}>{withdrawMessage}</div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm text-gray-600">
              <p>
                Available for withdrawal:{" "}
                <strong className="text-green-600">
                  {formatAmount(growth.availableProfit)}
                </strong>
              </p>
              <p className="mt-1 text-xs">
                Funds will be sent to your saved bank account.
              </p>
            </div>

            <form onSubmit={handleWithdraw}>
              <div
                className={styles.formGroup}
                style={{ marginBottom: "1rem" }}
              >
                <label className={styles.label}>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.input}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  max={growth.availableProfit}
                />
              </div>
              <button
                type="submit"
                disabled={
                  !growth.availableProfit ||
                  growth.availableProfit <= 0 ||
                  withdrawLoading
                }
                className={`${
                  !growth.availableProfit || growth.availableProfit <= 0
                    ? styles.withdrawButtonDisabled
                    : styles.withdrawButtonActive
                } ${styles.withdrawButton}`}
              >
                {withdrawLoading ? "Processing..." : "Request Withdrawal"}
              </button>
            </form>
          </div>
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
            <div className={styles.noMessages}>
              <svg
                className={styles.emptyIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h4 className={styles.emptyTitle}>No messages yet</h4>
              <p className={styles.emptyText}>
                You're all caught up! Updates from the admin team will appear
                here.
              </p>
            </div>
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
        {/* Download Agreement Section */}
        <div className={styles.downloadSection}>
          <button
            onClick={() => window.open("/invest/agreement", "_blank")}
            className={styles.downloadButton}
          >
            <Download size={20} />
            Download Signed Agreement
          </button>
        </div>
      </main>
    </div>
  );
}
