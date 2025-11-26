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
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  // Process Google Data for Chart
  const googleChartData =
    data?.google?.rows?.map((row: any) => ({
      date: row.dimensionValues[0].value,
      activeUsers: parseInt(row.metricValues[0].value),
      eventCount: parseInt(row.metricValues[1].value),
      sessions: parseInt(row.metricValues[2].value),
    })) || [];

  // Process Facebook Data (Simplified as we don't have exact structure without live data)
  // Assuming data.facebook.data is an array of events
  const fbEvents = data?.facebook?.data || [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Analytics Dashboard</h1>

      {errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Errors:</p>
          <ul className="list-disc pl-5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
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
            <p className="text-gray-500">No Google Analytics data available.</p>
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
            <p className="text-gray-500">No Facebook Pixel data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
