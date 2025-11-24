"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./Referrals.module.css";

interface ReferralData {
  referralCode: string;
  referralCount: number;
  coupons: any[];
  referredUsers: any[];
}

export default function ReferralDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/user/referrals");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      alert("Referral code copied!");
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!data) return <div className={styles.error}>Failed to load data.</div>;

  const progress = Math.min(100, (data.referralCount / 20) * 100);
  const remaining = Math.max(0, 20 - data.referralCount);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Invite Friends & Earn Rewards</h1>
          <p className={styles.subtitle}>
            Refer 20 friends and get a FREE product (up to ₦5,000)!
          </p>
        </div>

        <div className={styles.grid}>
          {/* Stats Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Your Progress</h2>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>
                  {data.referralCount} Referrals
                </span>
                <span className={styles.progressGoal}>Goal: 20</span>
              </div>
              <div className={styles.progressBarWrapper}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={styles.progressText}>
                {remaining > 0
                  ? `Just ${remaining} more referrals to unlock your reward!`
                  : "Congratulations! You've unlocked a reward!"}
              </p>
            </div>

            <div className={styles.codeSection}>
              <p className={styles.codeLabel}>Your Referral Code</p>
              <div className={styles.codeWrapper}>
                <span className={styles.code}>
                  {data.referralCode || "Generating..."}
                </span>
                <button
                  onClick={copyToClipboard}
                  className={styles.copyButton}
                  title="Copy Code"
                >
                  <svg
                    className={styles.icon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Rewards Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Your Rewards</h2>

            {data.coupons.length > 0 ? (
              <div className={styles.couponsList}>
                {data.coupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    className={`${styles.couponItem} ${
                      coupon.isUsed ? styles.couponUsed : styles.couponActive
                    }`}
                  >
                    <div className={styles.couponHeader}>
                      <span className={styles.couponCode}>{coupon.code}</span>
                      <span
                        className={`${styles.couponStatus} ${
                          coupon.isUsed
                            ? styles.statusUsed
                            : styles.statusActive
                        }`}
                      >
                        {coupon.isUsed ? "REDEEMED" : "ACTIVE"}
                      </span>
                    </div>
                    <p className={styles.couponText}>
                      {coupon.isUsed
                        ? `Used on ${new Date(
                            coupon.usedAt
                          ).toLocaleDateString()}`
                        : "Use this code at checkout for a free item!"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg
                  className={styles.emptyIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
                <p>No rewards earned yet.</p>
                <p className={styles.couponText}>
                  Start inviting friends to earn!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Referred Users List */}
        <div className={styles.tableSection}>
          <h2 className={styles.cardTitle}>
            Referred Friends ({data.referredUsers?.length || 0})
          </h2>

          {data.referredUsers && data.referredUsers.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>User</th>
                    <th className={styles.th}>Joined Date</th>
                    <th className={`${styles.th} text-right`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referredUsers.map((user: any) => (
                    <tr key={user._id}>
                      <td className={styles.td}>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>
                            {user.name?.[0] || "U"}
                          </div>
                          <span className={styles.userName}>{user.name}</span>
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.dateCell}`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`${styles.td} text-right`}>
                        <span className={styles.statusBadge}>Registered</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyState}>
              No referrals yet. Share your code to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
