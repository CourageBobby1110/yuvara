"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Key,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import styles from "./Settings.module.css";

export default function DropshippingSettings() {
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [connected, setConnected] = useState(false);
  const [expiry, setExpiry] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get("/api/admin/dropshipping/settings");
      setApiKey(data.cjDropshippingApiKey || "");
      setUserId(data.cjDropshippingUserId || "");
      setConnected(data.cjConnected);
      setExpiry(data.cjTokenExpiry);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post("/api/admin/dropshipping/settings", {
        cjDropshippingApiKey: apiKey,
        cjDropshippingUserId: userId,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey) {
      toast.error("Please enter an API Key first");
      return;
    }
    setConnecting(true);
    try {
      await axios.post("/api/admin/dropshipping/settings", {
        cjDropshippingApiKey: apiKey,
        cjDropshippingUserId: userId,
      });

      const { data } = await axios.post("/api/admin/dropshipping/auth", {
        apiKey,
        userId,
      });

      if (data.success) {
        toast.success("Successfully connected to CJ Dropshipping!");
        setConnected(true);
        fetchSettings();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to connect to CJ Dropshipping"
      );
    } finally {
      setConnecting(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 size={32} className={styles.spinnerIcon} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dropshipping Settings</h1>
        <p className={styles.subtitle}>Configure your CJ Dropshipping API credentials</p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardIcon}>
              <Key size={20} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>CJ Dropshipping Configuration</h2>
              <p className={styles.cardSubtitle}>
                Enable product search and import by connecting your account.
              </p>
            </div>
          </div>
          <div className={styles.cardHeaderRight}>
            <span
              className={`${styles.statusBadge} ${
                connected ? styles.statusConnected : styles.statusDisconnected
              }`}
            >
              {connected ? (
                <>
                  <CheckCircle2 size={14} />
                  Connected
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Not Connected
                </>
              )}
            </span>
            {connected && expiry && (
              <p className={styles.expiryText}>
                Token expires: {new Date(expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className={styles.formBody}>
          <div className={styles.field}>
            <label className={styles.label}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={styles.input}
              placeholder="Enter your CJ Dropshipping API Key"
            />
            <p className={styles.hint}>
              Found in CJ Dashboard &gt; Authorization &gt; API &gt; API Key
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>User ID (Optional)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={styles.input}
              placeholder="Enter your CJ User ID"
            />
          </div>
        </div>

        <div className={styles.cardFooter}>
          <button
            onClick={handleSave}
            disabled={loading || connecting}
            className={styles.secondaryButton}
          >
            {loading ? (
              <>
                <Loader2 size={16} className={styles.spinnerIcon} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Only
              </>
            )}
          </button>

          <button
            onClick={handleConnect}
            disabled={loading || connecting}
            className={styles.primaryButton}
          >
            {connecting ? (
              <>
                <Loader2 size={16} className={styles.spinnerIcon} />
                Connecting...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Save & Connect
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
