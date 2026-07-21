"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, HelpCircle } from "lucide-react";
import AdminSkeleton from "@/components/AdminSkeleton";

export default function InvestmentSettingsPage() {
  const [profitRate, setProfitRate] = useState<number>(50);
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/investment")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load settings");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfitRate(data.investmentProfitRate ?? 50);
          setBankAccountNumber(data.bankAccountNumber ?? "2052394593");
          setBankName(data.bankName ?? "Kuda Bank");
          setBankAccountName(data.bankAccountName ?? "Chidi Courage Bobby");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error loading investment settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings/investment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profitRate,
          bankAccountNumber,
          bankName,
          bankAccountName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update settings");
      }

      toast.success("Investment settings updated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminSkeleton variant="form" />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Investment Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profit Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-150">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Returns Configuration
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Investment Return Rate (%)
            </label>
            <div className="relative rounded-md shadow-sm max-w-xs">
              <input
                type="number"
                min="0"
                max="1000"
                required
                className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-black focus:border-black focus:outline-none text-sm"
                value={profitRate}
                onChange={(e) => setProfitRate(Number(e.target.value))}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              The percentage profit returned to investors on their principal amount.
            </p>
          </div>
        </div>

        {/* Bank Account Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-150">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Incoming Investor Bank Details
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Configure the bank account details that new/incoming investors pay into when registering. These details are shown on the Investor Portal login instructions.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kuda Bank"
                className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-black focus:border-black focus:outline-none text-sm"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2052394593"
                className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-black focus:border-black focus:outline-none text-sm"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chidi Courage Bobby"
                className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-black focus:border-black focus:outline-none text-sm"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-md shadow-sm transition-colors text-sm"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
