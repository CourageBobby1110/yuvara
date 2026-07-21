"use client";

import Link from "next/link";
import {
  Search,
  Settings,
  Package,
  ExternalLink,
  RefreshCw,
  Loader2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import styles from "./Dropshipping.module.css";

export default function DropshippingDashboard() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await axios.post("/api/admin/dropshipping/sync");
      toast.success(data.message || "Products synced successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to sync products");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dropshipping Center</h1>
          <p className={styles.subtitle}>
            Find, import, and sell products from global suppliers.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={styles.syncButton}
          >
            {syncing ? (
              <Loader2 size={16} className={styles.spinnerIcon} />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className={styles.syncLabel}>
              {syncing ? "Syncing..." : "Sync Prices"}
            </span>
          </button>
          <span className={styles.poweredBy}>
            <Zap size={12} />
            CJ Dropshipping
          </span>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {/* Search Card */}
        <Link href="/admin/dropshipping/search" className={styles.dashCard}>
          <div className={styles.cardIconWrapper} style={{ backgroundColor: "#eff6ff" }}>
            <Search size={24} style={{ color: "#2563eb" }} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Find Products</h3>
            <p className={styles.cardDescription}>
              Search millions of products. Filter by category, price, and warehouse.
            </p>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardLink} style={{ color: "#2563eb" }}>
              Start Searching
            </span>
            <ArrowRight size={14} style={{ color: "#2563eb" }} />
          </div>
        </Link>

        {/* Imported Products Card */}
        <Link href="/admin/products?source=dropshipping" className={styles.dashCard}>
          <div className={styles.cardIconWrapper} style={{ backgroundColor: "#faf5ff" }}>
            <Package size={24} style={{ color: "#9333ea" }} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Imported Products</h3>
            <p className={styles.cardDescription}>
              View and manage imported products. Update prices and sync inventory.
            </p>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardLink} style={{ color: "#9333ea" }}>
              Manage Inventory
            </span>
            <ArrowRight size={14} style={{ color: "#9333ea" }} />
          </div>
        </Link>

        {/* Settings Card */}
        <Link href="/admin/dropshipping/settings" className={styles.dashCard}>
          <div className={styles.cardIconWrapper} style={{ backgroundColor: "#f9fafb" }}>
            <Settings size={24} style={{ color: "#6b7280" }} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Configuration</h3>
            <p className={styles.cardDescription}>
              Connect your CJ account, set pricing rules, and configure auto-sync.
            </p>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardLink} style={{ color: "#6b7280" }}>
              Configure
            </span>
            <ArrowRight size={14} style={{ color: "#6b7280" }} />
          </div>
        </Link>
      </div>

      {/* Getting Started */}
      <div className={styles.infoBanner}>
        <div className={styles.infoContent}>
          <h3 className={styles.infoTitle}>Getting Started</h3>
          <p className={styles.infoText}>
            Connect your CJ Dropshipping account in Settings to start importing products.
          </p>
        </div>
        <Link href="/admin/dropshipping/settings" className={styles.infoButton}>
          Setup API Connection
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
