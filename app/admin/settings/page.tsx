"use client";

import { useState, useEffect } from "react";
import AdminLoader from "@/components/AdminLoader";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const [settings, setSettings] = useState({
    googleTagManagerId: "",
    googleAnalyticsId: "",
    klaviyoPublicKey: "",
    tiktokPixelId: "",
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

  if (loading) return <AdminLoader />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Store Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Marketing Integrations</h2>
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Tag Manager ID (GTM-XXXXXX)
              </label>
              <input
                type="text"
                name="googleTagManagerId"
                value={settings.googleTagManagerId}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="GTM-XXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Analytics ID (G-XXXXXX)
              </label>
              <input
                type="text"
                name="googleAnalyticsId"
                value={settings.googleAnalyticsId}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="G-XXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klaviyo Public API Key (Company ID)
              </label>
              <input
                type="text"
                name="klaviyoPublicKey"
                value={settings.klaviyoPublicKey}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="e.g. XyZ123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                name="tiktokPixelId"
                value={settings.tiktokPixelId}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                placeholder="e.g. C1234567890"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">
            Dropshipping Integrations
          </h2>
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CJ Dropshipping Configuration
              </label>
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  CJ Dropshipping settings have moved to a dedicated page to
                  support secure authentication.
                </p>
                <a
                  href="/admin/dropshipping/settings"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Go to CJ Dropshipping Settings &rarr;
                </a>
              </div>
            </div>

            <div className="border-t pt-6 mt-2">
              <h3 className="font-medium text-gray-900 mb-4">
                Doba Integration
              </h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doba App Key
                  </label>
                  <input
                    type="text"
                    name="dobaAppKey"
                    value={(settings as any).dobaAppKey || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Enter your Doba App Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doba App Secret
                  </label>
                  <input
                    type="password"
                    name="dobaAppSecret"
                    value={(settings as any).dobaAppSecret || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Enter your Doba App Secret"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {userRole === "admin" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 pb-10">
            <h2 className="text-lg font-semibold mb-4 text-purple-700">
              Bulk Background Synchronizer
            </h2>
            <div className="p-5 bg-purple-50 rounded-md border border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                 <p className="text-sm font-medium text-gray-900">
                   Current State: <span className="font-bold text-black">{(settings as any).lastSyncStatus || "Idle"}</span>
                 </p>
                 <p className="text-sm text-gray-700 mt-1">
                   Items Synced Today: <span className="font-bold">{(settings as any).productsSyncedToday || 0}</span>
                 </p>
              </div>
              <div className="flex gap-2">
                {(settings as any).lastSyncStatus === "Running" && (
                  <button
                    type="button"
                    onClick={handleStopBulkSync}
                    className="bg-red-600 outline-none hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition-colors whitespace-nowrap"
                  >
                    Stop Syncing
                  </button>
                )}
                <button
                   type="button"
                   onClick={handleTriggerBulkSync}
                   disabled={(settings as any).lastSyncStatus === "Running"}
                   className="bg-purple-600 outline-none hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2 px-6 rounded-md shadow-sm transition-colors whitespace-nowrap"
                 >
                   {(settings as any).lastSyncStatus === "Running" ? "Synchronizing..." : "Start Syncing"}
                 </button>
               </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 max-w-2xl">
              This module asynchronously iterates through unsynced products safely. It mimics sequential fetching to prevent CJ API rate limits (429 errors). If a limit is detected, it automatically suspends the runner and sets the status to "Rate limit reached".
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
