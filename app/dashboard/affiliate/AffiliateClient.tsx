"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Affiliate.module.css";
import LogoSpinner from "@/components/LogoSpinner";

interface AffiliateData {
  isAffiliate: boolean;
  affiliateBalance: number;
  totalEarnings: number;
  referralCode: string;
  referralCount: number;
  affiliateBankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  userName?: string;
  withdrawals?: any[];
}

export default function AffiliateClient({
  initialData,
}: {
  initialData: AffiliateData;
}) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<AffiliateData>(initialData);
  const [activating, setActivating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    if (!data.affiliateBankDetails?.accountNumber) {
      toast.error("Please save your bank details first");
      return;
    }

    if (confirm("Are you sure you want to withdraw your entire balance?")) {
      setWithdrawing(true);
      try {
        const res = await fetch("/api/affiliate/withdraw", {
          method: "POST",
        });

        const json = await res.json();

        if (res.ok) {
          toast.success("Withdrawal request submitted successfully!");
          setData((prev) => ({
            ...prev,
            affiliateBalance: 0,
          }));
          router.refresh();
        } else {
          toast.error(json.error || "Failed to withdraw funds");
        }
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setWithdrawing(false);
      }
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/user/affiliate", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Affiliate account activated!");
        const json = await res.json();
        // Update local state with new affiliate status
        setData((prev) => ({
          ...prev,
          isAffiliate: true,
          referralCode: json.referralCode,
        }));
        router.refresh(); // Refresh server data
      } else {
        toast.error("Failed to activate account");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActivating(false);
    }
  };

  const copyLink = () => {
    if (data?.referralCode) {
      const link = `${window.location.origin}?ref=${data.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (activating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoSpinner />
      </div>
    );
  }

  if (!data?.isAffiliate) {
    return (
      <div className={styles.container}>
        <div className={styles.activationCard}>
          <h1 className={styles.activationTitle}>Become an Affiliate</h1>
          <p className={styles.activationText}>
            Join the Yuvara Affiliate Program today. Earn 10% commission on
            every sale you refer. Track your earnings in real-time and get paid
            directly to your bank account.
          </p>
          <button
            onClick={handleActivate}
            disabled={activating}
            className={styles.activateButton}
          >
            {activating ? "Activating..." : "Activate Affiliate Account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Affiliate Dashboard</h1>
        <p className={styles.subtitle}>Welcome back, {data.userName}</p>
      </div>

      <div className={styles.grid}>
        {/* Balance Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Available Balance</h2>
          <div className={styles.statValue}>
            {formatNaira(data.affiliateBalance)}
          </div>
          <p className={styles.statLabel}>Ready for payout</p>
          {data.affiliateBalance > 0 && (
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className={styles.withdrawButton}
            >
              {withdrawing ? "Processing..." : "Withdraw Funds"}
            </button>
          )}
        </div>

        {/* Total Earnings Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Total Earnings</h2>
          <div className={styles.statValue}>
            {formatNaira(data.totalEarnings)}
          </div>
          <p className={styles.statLabel}>Lifetime earnings</p>
        </div>

        {/* Referrals Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Total Referrals</h2>
          <div className={styles.statValue}>{data.referralCount}</div>
          <p className={styles.statLabel}>Successful conversions</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Link Generation Card */}
        <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <h2 className={styles.cardTitle}>Your Referral Link</h2>
          <p className={styles.statLabel} style={{ marginBottom: "1rem" }}>
            Share this link to earn commissions.
          </p>
          <div className={styles.linkWrapper}>
            <input
              readOnly
              value={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }?ref=${data.referralCode}`}
              className={styles.linkInput}
            />
            <button onClick={copyLink} className={styles.copyButton}>
              Copy Link
            </button>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <h2 className={styles.cardTitle}>Bank Details</h2>
          <p className={styles.statLabel} style={{ marginBottom: "1rem" }}>
            Enter your bank details to receive payouts.
          </p>
          <BankDetailsForm
            initialData={data.affiliateBankDetails}
            onSave={() => router.refresh()}
          />
        </div>

        {/* Withdrawal History */}
        {data.withdrawals && data.withdrawals.length > 0 && (
          <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.cardTitle}>Withdrawal History</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.withdrawals.map((w: any) => (
                    <tr key={w._id}>
                      <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                      <td>{formatNaira(w.amount)}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[w.status]
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BankDetailsForm({
  initialData,
  onSave,
}: {
  initialData?: any;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bankName: initialData?.bankName || "",
    accountNumber: initialData?.accountNumber || "",
    accountName: initialData?.accountName || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankDetails: formData }),
      });

      if (res.ok) {
        toast.success("Bank details saved successfully");
        onSave();
      } else {
        toast.error("Failed to save bank details");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.bankForm}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Bank Name</label>
        <input
          type="text"
          required
          className={styles.input}
          value={formData.bankName}
          onChange={(e) =>
            setFormData({ ...formData, bankName: e.target.value })
          }
          placeholder="e.g. Access Bank"
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Account Number</label>
        <input
          type="text"
          required
          className={styles.input}
          value={formData.accountNumber}
          onChange={(e) =>
            setFormData({ ...formData, accountNumber: e.target.value })
          }
          placeholder="0123456789"
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Account Name</label>
        <input
          type="text"
          required
          className={styles.input}
          value={formData.accountName}
          onChange={(e) =>
            setFormData({ ...formData, accountName: e.target.value })
          }
          placeholder="John Doe"
        />
      </div>
      <button type="submit" disabled={loading} className={styles.saveButton}>
        {loading ? "Saving..." : "Save Details"}
      </button>
    </form>
  );
}
