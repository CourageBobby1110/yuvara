"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./Analytics.module.css";
import { BarChart3, Globe, AlertTriangle } from "lucide-react";
import AdminSkeleton from "@/components/AdminSkeleton";

function AnalyticsSkeletonLoader() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.skeletonTitle} />
      </div>
      <div className={styles.skeletonStats}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonStatCard}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
        ))}
      </div>
      <div className={styles.skeletonChartCard}>
        <div className={styles.skeletonLineMed} />
        <div className={styles.skeletonChartArea}>
          {[30, 55, 40, 70, 60, 85, 95].map((h, i) => (
            <div key={i} className={styles.skeletonBar} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className={styles.skeletonGrid}>
        <div className={styles.skeletonChartCard}>
          <div className={styles.skeletonLineMed} />
          <div className={styles.skeletonChartArea}>
            {[40, 60, 35, 75, 50, 80].map((h, i) => (
              <div key={i} className={styles.skeletonBar} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className={styles.skeletonChartCard}>
          <div className={styles.skeletonLineMed} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        setData(json);
        if (json.errors && json.errors.length > 0) {
          setErrors(json.errors);
        }
      } catch (err) {
        console.error(err);
        setErrors(["Failed to fetch analytics data"]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <AnalyticsSkeletonLoader />;

  const internalChartData = data?.internal || [];
  const googleChartData =
    data?.google?.rows?.map((row: any) => ({
      date: row.dimensionValues[0].value,
      activeUsers: parseInt(row.metricValues[0].value),
      sessions: parseInt(row.metricValues[2].value),
    })) || [];
  const fbEvents = data?.facebook?.data || [];

  const totalPageViews = internalChartData.reduce(
    (sum: number, d: any) => sum + (d.pageViews || 0),
    0
  );
  const totalVisitors = internalChartData.reduce(
    (sum: number, d: any) => sum + (d.visitors || 0),
    0
  );
  const avgDaily = internalChartData.length
    ? Math.round(totalPageViews / internalChartData.length)
    : 0;

  const formatDate = (tick: string) => {
    const parts = tick.split("-");
    if (parts.length === 3) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${months[parseInt(parts[1]) - 1]} ${parts[2]}`;
    }
    return tick;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Traffic and engagement overview</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={16} />
          <div>
            <p className={styles.errorTitle}>Integration Notices</p>
            <ul className={styles.errorList}>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {internalChartData.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{totalPageViews.toLocaleString()}</span>
              <span className={styles.statLabel}>Page Views</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconActive}`}>
              <Globe size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{totalVisitors.toLocaleString()}</span>
              <span className={styles.statLabel}>Unique Visitors</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{avgDaily.toLocaleString()}</span>
              <span className={styles.statLabel}>Avg. Daily</span>
            </div>
          </div>
        </div>
      )}

      {/* Internal Traffic Chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Website Traffic</h2>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotGold}`} />
              Page Views
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.legendDotDark}`} />
              Visitors
            </span>
          </div>
        </div>
        {internalChartData.length > 0 ? (
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={internalChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#9ca3af"
                  fontSize={11}
                  dy={10}
                />
                <YAxis stroke="#9ca3af" fontSize={11} dx={-5} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  labelFormatter={(label) => {
                    const parts = label.split("-");
                    if (parts.length === 3) {
                      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                      return date.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      });
                    }
                    return label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pageViews"
                  stroke="#bfa15f"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Page Views"
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  name="Unique Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <BarChart3 size={40} className={styles.emptyIcon} />
            <p>No traffic data logged yet.</p>
          </div>
        )}
      </div>

      {/* Bottom Grid: Google + Facebook */}
      <div className={styles.bottomGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Google Analytics</h2>
            <span className={styles.badge}>Last 7 Days</span>
          </div>
          {googleChartData.length > 0 ? (
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={googleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                    fontSize={11}
                  />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Globe size={32} className={styles.emptyIcon} />
              <p>No Google Analytics data available.</p>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Facebook Pixel</h2>
            <span className={styles.badge}>Events</span>
          </div>
          {fbEvents.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Event</th>
                    <th className={`${styles.th} ${styles.thRight}`}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {fbEvents.map((event: any, idx: number) => (
                    <tr key={idx} className={styles.tr}>
                      <td className={styles.td}>{event.aggregation}</td>
                      <td className={`${styles.td} ${styles.tdBold}`}>{event.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <BarChart3 size={32} className={styles.emptyIcon} />
              <p>No Facebook Pixel data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
