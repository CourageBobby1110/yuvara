"use client";

import { useState, useEffect } from "react";
import AdminSkeleton from "@/components/AdminSkeleton";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import styles from "./Settings.module.css";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const [settings, setSettings] = useState({
    googleTagManagerId: "",
    googleAnalyticsId: "",
    googleSiteVerification: "",
    klaviyoPublicKey: "",
    tiktokPixelId: "",
    facebookPixelId: "",
    lastSyncStatus: "",
    productsSyncedToday: 0,
    pinterestAccessToken: "",
    pinterestBoardId: "",
    pinterestLastSyncStatus: "Trial Access Pending",
    pinterestSyncedCount: 0,
    pinterestLastSyncDate: null,
  });

  const [syncingPinterest, setSyncingPinterest] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleFetchBoards = async () => {
    setLoadingBoards(true);
    try {
      const res = await fetch("/api/admin/pinterest/boards");
      const data = await res.json();
      if (res.ok && data.boards) {
        setBoards(data.boards);
        toast.success(`Found ${data.boards.length} Pinterest boards`);
      } else if (data.isTrialPending) {
        toast.info(data.error || "Trial access pending review by Pinterest.");
      } else {
        toast.error(data.error || "Failed to load boards from Pinterest");
      }
    } catch {
      toast.error("Network error fetching boards");
    } finally {
      setLoadingBoards(false);
    }
  };

  const handlePinterestSync = async (forceResync = false) => {
    setSyncingPinterest(true);
    toast.info("Connecting to Pinterest API...");
    try {
      const res = await fetch("/api/admin/pinterest/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceResync,
          boardId: settings.pinterestBoardId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Synced successfully!");
        fetchSettings();
      } else if (data.isTrialPending) {
        toast.warning(
          data.error ||
            "Pinterest Developer App is pending review. Pins will sync once approved."
        );
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to sync to Pinterest");
      }
    } catch {
      toast.error("Network error during sync");
    } finally {
      setSyncingPinterest(false);
    }
  };

  const handleCopyFeed = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://yuvara.com.ng";
    const url = `${origin}/api/pinterest/feed`;
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    toast.success("Pinterest XML Feed URL copied!");
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBulkSync = async () => {
    toast.info("Starting bulk synchronizer...");
    try {
      const res = await fetch("/api/admin/dropshipping/bulk-sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
         toast.success(data.message || "Background runner dispatched");
         fetchSettings();
      } else {
         toast.error(data.error || "Failed to trigger sync");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleStopBulkSync = async () => {
    toast.info("Stopping synchronizer...");
    try {
      const res = await fetch("/api/admin/dropshipping/bulk-sync/stop", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
         toast.success(data.message || "Background runner stopped");
         fetchSettings();
      } else {
         toast.error(data.error || "Failed to stop sync");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  if (loading) return <AdminSkeleton variant="form" />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Store Settings</h1>
        <p className={styles.subtitle}>Manage your store integrations and configuration</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Marketing Integrations</h2>

          <div className={styles.field}>
            <label className={styles.label}>Google Tag Manager ID</label>
            <input
              type="text"
              name="googleTagManagerId"
              value={settings.googleTagManagerId}
              onChange={handleChange}
              className={styles.input}
              placeholder="GTM-XXXXXX"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Google Analytics ID</label>
            <input
              type="text"
              name="googleAnalyticsId"
              value={settings.googleAnalyticsId}
              onChange={handleChange}
              className={styles.input}
              placeholder="G-XXXXXX"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Google Site Verification Token</label>
            <input
              type="text"
              name="googleSiteVerification"
              value={settings.googleSiteVerification}
              onChange={handleChange}
              className={styles.input}
              placeholder="google-site-verification-id"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Klaviyo Public API Key</label>
            <input
              type="text"
              name="klaviyoPublicKey"
              value={settings.klaviyoPublicKey}
              onChange={handleChange}
              className={styles.input}
              placeholder="XyZ123"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>TikTok Pixel ID</label>
            <input
              type="text"
              name="tiktokPixelId"
              value={settings.tiktokPixelId}
              onChange={handleChange}
              className={styles.input}
              placeholder="C1234567890"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Facebook Pixel ID</label>
            <input
              type="text"
              name="facebookPixelId"
              value={settings.facebookPixelId}
              onChange={handleChange}
              className={styles.input}
              placeholder="1234567890123456"
            />
          </div>
        </div>

        {/* Pinterest Integration Card */}
        <div className={styles.pinterestCard}>
          <div className={styles.pinterestHeader}>
            <div className={styles.pinterestTitleArea}>
              <div className={styles.pinterestLogoBadge} aria-label="Pinterest">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 384 512"
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: "block" }}
                >
                  <path d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-28.8 0-51.9-24-44.4-53.7l19.5-82.5c7.5-30.6-14.7-56.1-43.5-56.1-36.9 0-66 38.4-66 89.1 0 32.7 11.4 55.2 11.4 55.2L42.9 444.6C30.3 498 33 507.9 33.6 510c1.2 3.9 6.6 5.4 8.7 2.4 3-4.2 41.7-57.9 54.3-107.1 3.9-15 20.4-78.9 20.4-78.9 9.6 18.3 37.8 34.5 67.8 34.5 91.2 0 157.2-83.7 157.2-192.9C342 77.3 277.2 6.5 204 6.5z" />
                </svg>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <h2 className={styles.pinterestTitle}>Pinterest Integration &amp; Auto-Pinning</h2>
                  <span className={styles.pinterestBadge}>Rich Pins Ready</span>
                </div>
                <p className={styles.pinterestSubtitle}>
                  Connect your store to Pinterest. Publish products with real-time prices, high-res photos, and direct links to checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Trial / Status Notice */}
          {settings.pinterestLastSyncStatus === "Trial Access Pending" || !settings.pinterestSyncedCount ? (
            <div className={`${styles.pinterestNotice} ${styles.noticeWarning}`}>
              <Clock className={styles.noticeIcon} size={18} />
              <div>
                <strong>Trial Access Under Review by Pinterest</strong>
                <p style={{ margin: "0.2rem 0 0" }}>
                  Your Access Token is configured and saved. Pinterest Developer accounts take 1–2 business days for trial review. As soon as Pinterest approves your app, the Sync button below will publish all your products automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className={`${styles.pinterestNotice} ${styles.noticeSuccess}`}>
              <CheckCircle2 className={styles.noticeIcon} size={18} />
              <div>
                <strong>Pinterest Connected</strong>
                <p style={{ margin: "0.2rem 0 0" }}>
                  {settings.pinterestSyncedCount} product(s) synchronized. Rich Pins schema is active across all product pages.
                </p>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className={styles.pinterestStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Sync Status</span>
              <span className={styles.statValue}>
                {settings.pinterestLastSyncStatus || "Pending Approval"}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Products Synced</span>
              <span className={styles.statValue}>
                {settings.pinterestSyncedCount || 0}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Last Sync</span>
              <span className={styles.statValue}>
                {settings.pinterestLastSyncDate
                  ? new Date(settings.pinterestLastSyncDate).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
          </div>

          {/* Token Input */}
          <div className={styles.field}>
            <label className={styles.label}>Pinterest Access Token</label>
            <div style={{ position: "relative" }}>
              <input
                type={showToken ? "text" : "password"}
                name="pinterestAccessToken"
                value={settings.pinterestAccessToken || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your Pinterest access token"
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
                aria-label="Toggle token visibility"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Board Selection */}
          <div className={styles.field}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
              <label className={styles.label} style={{ margin: 0 }}>Target Pinterest Board</label>
              <button
                type="button"
                onClick={handleFetchBoards}
                disabled={loadingBoards}
                style={{
                  background: "none",
                  border: "none",
                  color: "#E60023",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <RefreshCw size={12} className={loadingBoards ? "animate-spin" : ""} />
                {loadingBoards ? "Checking..." : "Load My Boards"}
              </button>
            </div>

            {boards.length > 0 ? (
              <select
                name="pinterestBoardId"
                value={settings.pinterestBoardId || ""}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="">-- Select a Board --</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="pinterestBoardId"
                value={settings.pinterestBoardId || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter Board ID or leave empty to auto-create 'Yuvara Official Store'"
              />
            )}
          </div>

          {/* Actions */}
          <div className={styles.pinterestActions}>
            <button
              type="button"
              onClick={() => handlePinterestSync(false)}
              disabled={syncingPinterest}
              className={styles.btnPinterest}
            >
              {syncingPinterest ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 384 512"
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: "inline-block" }}
                >
                  <path d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-28.8 0-51.9-24-44.4-53.7l19.5-82.5c7.5-30.6-14.7-56.1-43.5-56.1-36.9 0-66 38.4-66 89.1 0 32.7 11.4 55.2 11.4 55.2L42.9 444.6C30.3 498 33 507.9 33.6 510c1.2 3.9 6.6 5.4 8.7 2.4 3-4.2 41.7-57.9 54.3-107.1 3.9-15 20.4-78.9 20.4-78.9 9.6 18.3 37.8 34.5 67.8 34.5 91.2 0 157.2-83.7 157.2-192.9C342 77.3 277.2 6.5 204 6.5z" />
                </svg>
              )}
              {syncingPinterest ? "Syncing to Pinterest..." : "Sync Products to Pinterest"}
            </button>

            <button
              type="button"
              onClick={() => handlePinterestSync(true)}
              disabled={syncingPinterest}
              className={styles.btnSecondaryAction}
            >
              Force Re-sync All
            </button>
          </div>

          {/* Feed URL Box */}
          <div className={styles.feedBox}>
            <div className={styles.feedText}>
              <span>📡 Catalog Feed:</span>
              <span className={styles.feedCode}>/api/pinterest/feed</span>
            </div>
            <div className={styles.feedButtons}>
              <button
                type="button"
                onClick={handleCopyFeed}
                className={styles.btnSecondaryAction}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
              >
                {copiedFeed ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                {copiedFeed ? "Copied!" : "Copy Feed URL"}
              </button>
              <a
                href="/api/pinterest/feed"
                target="_blank"
                rel="noreferrer"
                className={styles.btnSecondaryAction}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", textDecoration: "none" }}
              >
                <ExternalLink size={13} />
                Preview Feed
              </a>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Dropshipping Integrations</h2>

          <div className={styles.field}>
            <label className={styles.label}>CJ Dropshipping Configuration</label>
            <div className={styles.infoBox}>
              <p className={styles.infoText}>
                CJ Dropshipping settings have moved to a dedicated page to support secure authentication.
              </p>
              <a href="/admin/dropshipping/settings" className={styles.infoLink}>
                Go to CJ Dropshipping Settings &rarr;
              </a>
            </div>
          </div>

          <hr className={styles.separator} />

          <h3 className={styles.sectionTitle}>Doba Integration</h3>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Doba App Key</label>
              <input
                type="text"
                name="dobaAppKey"
                value={(settings as any).dobaAppKey || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your Doba App Key"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Doba App Secret</label>
              <input
                type="password"
                name="dobaAppSecret"
                value={(settings as any).dobaAppSecret || ""}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your Doba App Secret"
              />
            </div>
          </div>
        </div>

        {userRole === "admin" && (
          <div className={styles.syncCard}>
            <h2 className={styles.syncTitle}>Bulk Background Synchronizer</h2>
            <div className={styles.syncBody}>
              <div className={styles.syncInfo}>
                <p className={styles.syncLabel}>
                  Current State: <span className={styles.syncValue}>{(settings as any).lastSyncStatus || "Idle"}</span>
                </p>
                <p className={styles.syncLabel}>
                  Items Synced Today: <span className={styles.syncValue}>{(settings as any).productsSyncedToday || 0}</span>
                </p>
              </div>
              <div className={styles.syncActions}>
                {(settings as any).lastSyncStatus === "Running" && (
                  <button type="button" onClick={handleStopBulkSync} className={styles.btnDanger}>
                    Stop Syncing
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTriggerBulkSync}
                  disabled={(settings as any).lastSyncStatus === "Running"}
                  className={styles.btnPurple}
                >
                  {(settings as any).lastSyncStatus === "Running" ? "Synchronizing..." : "Start Syncing"}
                </button>
              </div>
            </div>
            <p className={styles.syncNote}>
              This module asynchronously iterates through unsynced products safely. It mimics sequential fetching to prevent CJ API rate limits (429 errors). If a limit is detected, it automatically suspends the runner and sets the status to &quot;Rate limit reached&quot;.
            </p>
          </div>
        )}

        <div className={styles.footer}>
          <button type="submit" disabled={saving} className={styles.btnSave}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
