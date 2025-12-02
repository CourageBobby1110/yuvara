"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";

export default function DobaSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setProducts([]);

    try {
      const res = await fetch(
        `/api/admin/doba/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products);
        if (data.products.length === 0) {
          setError("No products found.");
        }
      } else {
        setError(data.error || "Failed to fetch products");
      }
    } catch (err) {
      setError("An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product: any) => {
    setImporting(product.id);
    try {
      const res = await fetch("/api/admin/doba/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Product imported successfully!");
      } else {
        toast.error(data.error || "Failed to import product");
      }
    } catch (err) {
      toast.error("An error occurred during import");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Doba Dropshipping
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Search and import products from Doba
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="text-sm text-blue-600 hover:underline"
        >
          Configure API Keys
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products on Doba..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Search"
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 h-12">
                {product.title}
              </h3>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${product.price}
                  </p>
                </div>
                {product.shipping > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Shipping</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${product.shipping}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500">
                  Stock: {product.inventory}
                </div>
                <button
                  onClick={() => handleImport(product)}
                  disabled={importing === product.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {importing === product.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Download size={16} />
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
