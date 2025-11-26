"use client";

import { useState, useEffect } from "react";
import AdminLoader from "@/components/AdminLoader";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    googleTagManagerId: "",
    googleAnalyticsId: "",
    klaviyoPublicKey: "",
    tiktokPixelId: "",
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
