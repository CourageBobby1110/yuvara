"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import styles from "./Analytics.module.css"; // We'll create this CSS module

function AnalyticsSkeleton() {
  return (
    <div className={styles.container}>
      <div className={`${styles.title} ${styles.shimmer} h-8 w-48 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>

      <div className={styles.grid}>
        {/* Main Chart Card Skeleton */}
        <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <div className="flex justify-between items-center mb-6">
            <div className={`${styles.shimmer} h-6 w-80 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
            <div className="flex gap-4">
              <div className={`${styles.shimmer} h-4 w-20 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-4 w-24 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
            </div>
          </div>
          {/* Mock Chart lines */}
          <div className="h-80 w-full flex flex-col justify-between pt-4">
            <div className="flex justify-between items-end h-64 gap-4 px-2">
              <div className={`${styles.shimmer} w-full h-[30%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
              <div className={`${styles.shimmer} w-full h-[50%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
              <div className={`${styles.shimmer} w-full h-[40%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
              <div className={`${styles.shimmer} w-full h-[70%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
              <div className={`${styles.shimmer} w-full h-[60%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
              <div className={`${styles.shimmer} w-full h-[85%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
              <div className={`${styles.shimmer} w-full h-[95%] rounded-t`} style={{ backgroundColor: "#f3f4f6" }}></div>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between px-2">
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-3 w-10 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
            </div>
          </div>
        </div>

        {/* Google Analytics Card Skeleton */}
        <div className={styles.card}>
          <div className={`${styles.shimmer} h-6 w-64 rounded mb-6`} style={{ backgroundColor: "#e5e7eb" }}></div>
          <div className="h-80 w-full flex items-center justify-center">
            <div className={`${styles.shimmer} w-full h-full rounded`} style={{ backgroundColor: "#f3f4f6" }}></div>
          </div>
        </div>

        {/* Facebook Pixel Card Skeleton */}
        <div className={styles.card}>
          <div className={`${styles.shimmer} h-6 w-56 rounded mb-6`} style={{ backgroundColor: "#e5e7eb" }}></div>
          <div className="h-80 w-full flex flex-col gap-4">
            <div className="flex justify-between border-b pb-2">
              <div className={`${styles.shimmer} h-4 w-24 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
              <div className={`${styles.shimmer} h-4 w-12 rounded`} style={{ backgroundColor: "#e5e7eb" }}></div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <div className={`${styles.shimmer} h-4 w-32 rounded`} style={{ backgroundColor: "#f3f4f6" }}></div>
                <div className={`${styles.shimmer} h-4 w-8 rounded`} style={{ backgroundColor: "#f3f4f6" }}></div>
              </div>
            ))}
          </div>
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

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  // Process Internal Traffic Data
  const internalChartData = data?.internal || [];

  // Process Google Data for Chart
  const googleChartData =
    data?.google?.rows?.map((row: any) => ({
      date: row.dimensionValues[0].value,
      activeUsers: parseInt(row.metricValues[0].value),
      eventCount: parseInt(row.metricValues[1].value),
      sessions: parseInt(row.metricValues[2].value),
    })) || [];

  // Process Facebook Data
  const fbEvents = data?.facebook?.data || [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Analytics Dashboard</h1>

      {errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded mb-6 text-sm">
          <p className="font-bold">Integration Notices:</p>
          <ul className="list-disc pl-5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
        {/* Internal Website Traffic Section (Primary Graph) */}
        <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={styles.cardTitle}>Website Traffic (Internal Database - Last 7 Days)</h2>
            <div className="flex gap-4 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#bfa15f]"></span> Page Views
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#111827]"></span> Unique Visitors
              </span>
            </div>
          </div>
          {internalChartData.length > 0 ? (
            <div className="h-80 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={internalChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => {
                      const parts = tick.split("-");
                      if (parts.length === 3) {
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return `${monthNames[parseInt(parts[1]) - 1]} ${parts[2]}`;
                      }
                      return tick;
                    }}
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
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    labelFormatter={(label) => {
                      const parts = label.split("-");
                      if (parts.length === 3) {
                        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        return date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                      }
                      return label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#bfa15f"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                    name="Page Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                    name="Unique Visitors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">No traffic data logged yet.</p>
          )}
        </div>

        {/* Google Analytics Section */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Google Analytics (Last 7 Days)</h2>
          {googleChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={googleChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#8884d8"
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#82ca9d"
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center text-sm">No Google Analytics data available.</p>
          )}
        </div>

        {/* Facebook Pixel Section */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Facebook Pixel Events</h2>
          {fbEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Event</th>
                    <th className="px-4 py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {fbEvents.map((event: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2 font-medium">
                        {event.aggregation}
                      </td>
                      <td className="px-4 py-2">{event.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center text-sm">No Facebook Pixel data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
