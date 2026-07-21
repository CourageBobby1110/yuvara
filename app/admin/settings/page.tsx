"use client";

import { useState, useEffect } from "react";
import AdminSkeleton from "@/components/AdminSkeleton";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
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
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
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
