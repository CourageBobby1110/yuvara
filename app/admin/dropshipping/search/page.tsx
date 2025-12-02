"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Loader2,
  AlertCircle,
  ExternalLink,
  Plug,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

export default function DropshippingSearch() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data } = await axios.get("/api/admin/dropshipping/settings");
      setConnected(data.cjConnected);
    } catch (error) {
      console.error("Failed to check connection:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, pageNum = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setPage(pageNum);

    // Only clear products if it's a new search, not pagination
    if (pageNum === 1) setProducts([]);

    try {
      const { data } = await axios.get(
        `/api/admin/dropshipping/search?q=${encodeURIComponent(
          query
        )}&page=${pageNum}`
      );
      if (data.error) {
        toast.error(data.error);
      } else {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        // Likely auth error
        setConnected(false);
      }
      toast.error(error.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product: any) => {
    setImporting(product.pid);
    try {
      // We send the PID to the backend to fetch full details and save
      await axios.post("/api/admin/dropshipping/import", { pid: product.pid });
      toast.success("Product imported successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to import product");
    } finally {
      setImporting(null);
    }
  };

  const totalPages = Math.ceil(total / 60);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <Plug className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Connect to CJ Dropshipping
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            To search and import products, you need to connect your CJ
            Dropshipping account first. It only takes a minute.
          </p>
          <Link
            href="/admin/dropshipping/settings"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Go to Settings & Connect
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Find Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Search the CJ Dropshipping catalog and import directly to your
            store.
          </p>
        </div>
        <Link
          href="/admin/dropshipping/settings"
          className="text-sm text-blue-600 hover:underline"
        >
          Configure API Settings
        </Link>
      </div>

      <form onSubmit={(e) => handleSearch(e, 1)} className="mb-10 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-6 w-6" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword or paste CJ Product URL..."
            className="w-full pl-14 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm disabled:opacity-50 transition-colors flex items-center text-lg"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Search"}
        </button>
      </form>

      <div className="mb-10 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-900 dark:text-blue-300">
            Pro Tip: Paste a CJ Product URL
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
            Found a product you like on cjdropshipping.com? Just copy and paste
            the full URL here to find and import that exact product instantly.
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {products.map((product) => (
              <div
                key={product.pid}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="aspect-square relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    CJ
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3 h-12 leading-snug"
                    title={product.productName}
                  >
                    {product.productName}
                  </h3>
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Cost Price</p>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${product.sellPrice}
                      </span>
                    </div>
                  </div>

                  {product.shippingInfo && product.shippingInfo.length > 0 && (
                    <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Est. Shipping:
                      </p>
                      <div className="space-y-1">
                        {product.shippingInfo.map((info: any) => (
                          <div
                            key={info.country}
                            className="flex justify-between text-gray-600 dark:text-gray-400"
                          >
                            <span>{info.country}:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                              ${info.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleImport(product)}
                    disabled={importing === product.pid}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95"
                  >
                    {importing === product.pid ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Download className="h-5 w-5 mr-2" />
                    )}
                    {importing === product.pid
                      ? "Importing..."
                      : "Import Product"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pb-10">
              <button
                onClick={() => handleSearch(undefined, page - 1)}
                disabled={page <= 1 || loading}
                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handleSearch(undefined, page + 1)}
                disabled={page >= totalPages || loading}
                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        searched &&
        !loading && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              We couldn't find any products matching "{query}". If you pasted a
              URL, make sure it's a valid CJ Dropshipping product link.
              Otherwise, try different keywords.
            </p>
          </div>
        )
      )}

      {!searched && !loading && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
            <Search className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Start your search
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Enter a keyword above to find winning products from CJ
            Dropshipping's massive catalog.
          </p>
        </div>
      )}
    </div>
  );
}
