"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Affiliate.module.css";

interface AffiliateData {
  isAffiliate: boolean;
  affiliateBalance: number;
  totalEarnings: number;
  referralCode: string;
  referralCount: number;
}

export default function AffiliateDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/user/affiliate");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch affiliate data", error);
    } finally {
      setLoading(false);
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
        fetchData(); // Refresh data
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

  if (loading)
    return <div className={styles.loading}>Loading dashboard...</div>;

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
        <p className={styles.subtitle}>Welcome back, {session?.user?.name}</p>
      </div>

      <div className={styles.grid}>
        {/* Balance Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Available Balance</h2>
          <div className={styles.statValue}>
            {formatPrice(data.affiliateBalance)}
          </div>
          <p className={styles.statLabel}>Ready for payout</p>
        </div>

        {/* Total Earnings Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Total Earnings</h2>
          <div className={styles.statValue}>
            {formatPrice(data.totalEarnings)}
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
      </div>
    </div>
  );
}
