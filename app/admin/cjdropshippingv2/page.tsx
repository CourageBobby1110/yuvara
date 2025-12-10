"use client";

import { useState } from "react";
import axios from "axios";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CJExactSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [importing, setImporting] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setProduct(null);

    try {
      const res = await axios.get(
        `/api/admin/dropshipping/search?q=${encodeURIComponent(query)}`
      );
      if (res.data.products && res.data.products.length > 0) {
        setProduct(res.data.products[0]);
      } else {
        toast.error("No product found for this URL/ID");
      }
    } catch (error) {
      toast.error("Failed to search product");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (product: any) => {
    setImporting(product.pid);
    try {
      const res = await axios.post("/api/admin/dropshipping/import", {
        pid: product.pid,
      });

      if (res.data.success) {
        toast.success("Product imported successfully");
        router.push("/admin/products");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to import product");
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CJ Exact Search (V2)</h1>
        <p className="text-gray-500">
          Paste a direct product URL (e.g., from qksource.com) or a PID to find
          the exact item.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-10">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste URL here..."
            className="flex-1 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !query}
            className="px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Search className="w-6 h-6" />
            )}
          </button>
        </div>
      </form>

      {product && (
        <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 flex flex-col md:flex-row gap-8 items-start animate-fade-in-up">
          <div className="relative w-full md:w-64 aspect-square bg-gray-50 rounded-xl overflow-hidden shrink-0">
            <Image
              src={product.productImage}
              alt={product.productName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 mb-2 truncate">
              {product.productName}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                PID: {product.pid}
              </span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                SKU: {product.productSku}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-2xl font-bold text-blue-600">
                ${product.sellPrice || "0.00"}
              </span>
              <span className="text-sm text-gray-500">Excl. Shipping</span>
            </div>

            <button
              onClick={() => handleImport(product)}
              disabled={importing === product.pid}
              className="w-full md:w-auto px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {importing === product.pid && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {importing === product.pid ? "Importing..." : "Import Product"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
