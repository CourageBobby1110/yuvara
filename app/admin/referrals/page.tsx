"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./AdminReferrals.module.css";
import AdminLoader from "@/components/AdminLoader";

interface ReferralBatch {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxWinners: number;
  currentWinners: number;
  isActive: boolean;
}

export default function AdminReferralsPage() {
  const [batches, setBatches] = useState<ReferralBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    maxWinners: 20,
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error("Failed to fetch batches", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ name: "", startDate: "", endDate: "", maxWinners: 20 });
        fetchBatches();
      }
    } catch (error) {
      console.error("Failed to create batch", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Referral Campaigns</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-semibold mb-4">Create New Batch</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border-gray-200 focus:border-black focus:ring-black"
                placeholder="e.g., November Giveaway"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border-gray-200 focus:border-black focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full rounded-lg border-gray-200 focus:border-black focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Winners
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxWinners}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxWinners: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-lg border-gray-200 focus:border-black focus:ring-black"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Campaign"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active & Past Campaigns</h2>
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{batch.name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(batch.startDate).toLocaleDateString()} -{" "}
                    {new Date(batch.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    batch.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {batch.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Winners Claimed</span>
                  <span className="font-medium">
                    {batch.currentWinners} / {batch.maxWinners}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (batch.currentWinners / batch.maxWinners) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {batches.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No campaigns found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
