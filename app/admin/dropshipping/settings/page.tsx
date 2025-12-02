"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

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
      // First save the settings
      await axios.post("/api/admin/dropshipping/settings", {
        cjDropshippingApiKey: apiKey,
        cjDropshippingUserId: userId,
      });

      // Then attempt to connect/auth
      const { data } = await axios.post("/api/admin/dropshipping/auth", {
        apiKey,
        userId,
      });

      if (data.success) {
        toast.success("Successfully connected to CJ Dropshipping!");
        setConnected(true);
        // Refresh settings to get new expiry
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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Dropshipping Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
              <Key className="mr-2 h-5 w-5 text-blue-500" />
              CJ Dropshipping Configuration
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Configure your CJ Dropshipping API credentials to enable product
              search and import.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                connected
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {connected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Not Connected
                </>
              )}
            </div>
            {connected && expiry && (
              <p className="text-xs text-gray-400 mt-2">
                Token expires: {new Date(expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter your CJ Dropshipping API Key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in CJ Dashboard {">"} Authorization {">"} API {">"} API Key
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              User ID (Optional)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter your CJ User ID"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={loading || connecting}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Only
              </>
            )}
          </button>

          <button
            onClick={handleConnect}
            disabled={loading || connecting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Save & Connect
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
