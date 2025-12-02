"use client";

import Link from "next/link";
import {
  Search,
  Settings,
  Package,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dropshipping Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
            Seamlessly find, import, and sell products from global suppliers.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {syncing ? "Syncing..." : "Sync Prices"}
          </button>
          <div className="hidden md:block">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Powered by CJ Dropshipping
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Search Card */}
        <Link
          href="/admin/dropshipping/search"
          className="group relative overflow-hidden p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-xl"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Search className="h-32 w-32 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Search className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Find Products
            </h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Search millions of products from CJ Dropshipping. Filter by
              category, price, and warehouse location.
            </p>
            <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-medium">
              Start Searching <ExternalLink className="ml-2 h-4 w-4" />
            </div>
          </div>
        </Link>

        {/* Imported Products Card */}
        <Link
          href="/admin/products?source=dropshipping"
          className="group relative overflow-hidden p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-xl"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="h-32 w-32 text-purple-600" />
          </div>
          <div className="relative z-10">
            <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Imported Products
            </h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              View and manage the products you've already imported. Update
              prices and sync inventory.
            </p>
            <div className="mt-6 flex items-center text-purple-600 dark:text-purple-400 font-medium">
              Manage Inventory <ExternalLink className="ml-2 h-4 w-4" />
            </div>
          </div>
        </Link>

        {/* Settings Card */}
        <Link
          href="/admin/dropshipping/settings"
          className="group relative overflow-hidden p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow-xl"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Settings className="h-32 w-32 text-gray-600" />
          </div>
          <div className="relative z-10">
            <div className="h-14 w-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Settings className="h-7 w-7 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Configuration
            </h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Connect your CJ Dropshipping account, set global pricing rules,
              and configure auto-sync.
            </p>
            <div className="mt-6 flex items-center text-gray-600 dark:text-gray-400 font-medium">
              Configure <ExternalLink className="ml-2 h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-12 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-8 border border-blue-100 dark:border-blue-900/20">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Getting Started
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          To start importing products, you'll need to connect your CJ
          Dropshipping account. Go to Settings to enter your API credentials.
        </p>
        <Link
          href="/admin/dropshipping/settings"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Setup API Connection
        </Link>
      </div>
    </div>
  );
}
