"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { toast } from "sonner";

export default function BulkImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [importStatus, setImportStatus] = useState<
    Record<string, "pending" | "loading" | "success" | "error">
  >({});
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultStock, setDefaultStock] = useState("100");
  const [markupPercentage, setMarkupPercentage] = useState("50");

  const handleFetchList = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProducts([]);
    setSelectedProducts(new Set());
    setImportStatus({});

    try {
      const res = await fetch("/api/admin/scraper/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch listings");
      }

      setProducts(data.products);
      // Auto-select all by default
      const allUrls = new Set<string>(
        data.products.map((p: any) => p.url as string)
      );
      setSelectedProducts(allUrls);
      toast.success(`Found ${data.products.length} products`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (productUrl: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productUrl)) {
      newSelection.delete(productUrl);
    } else {
      newSelection.add(productUrl);
    }
    setSelectedProducts(newSelection);
  };

  const handleBulkImport = async () => {
    if (!defaultCategory) {
      toast.error("Please select a default category for these products");
      return;
    }

    const productsToImport = products.filter((p) =>
      selectedProducts.has(p.url)
    );

    console.log("Starting bulk import...", {
      selectedCount: selectedProducts.size,
      defaultCategory,
      productsToImportCount: productsToImport.length,
    });

    // Initialize status
    const initialStatus: any = {};
    productsToImport.forEach((p) => (initialStatus[p.url] = "pending"));
    setImportStatus(initialStatus);

    for (const product of productsToImport) {
      console.log(`Processing product: ${product.url}`);
      setImportStatus((prev) => ({ ...prev, [product.url]: "loading" }));

      try {
        // 1. Fetch Details
        console.log(`Fetching details for ${product.url}...`);
        const detailsRes = await fetch("/api/admin/import-aliexpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: product.url }),
        });

        if (!detailsRes.ok) {
          const errorText = await detailsRes.text();
          console.error(
            `Failed to fetch details for ${product.url}:`,
            detailsRes.status,
            errorText
          );
          throw new Error("Failed to fetch details");
        }
        const details = await detailsRes.json();
        console.log(`Details fetched for ${product.url}:`, details);

        // 2. Calculate Price
        const originalPrice = details.price || 0;
        const shipping = details.shippingFee || 0;
        const totalCost = originalPrice + shipping;
        const sellingPrice =
          totalCost * (1 + parseFloat(markupPercentage) / 100);

        // 3. Prepare Payload
        const payload = {
          name: details.title,
          description: details.description,
          price: parseFloat(sellingPrice.toFixed(2)),
          category: defaultCategory,
          stock: parseInt(defaultStock),
          slug:
            details.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .slice(0, 50) +
            "-" +
            Date.now().toString().slice(-4),
          images: details.images.slice(0, 5),
          variants: details.variants || [],
          sizes: details.sizes || [],
          colors: details.colors || [],
          productUrl: details.originalUrl,
          isFeatured: false,
          reviewsEnabled: true,
        };
        console.log(`Payload prepared for ${product.url}:`, payload);

        // 4. Save Product
        const saveRes = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!saveRes.ok) {
          const errorText = await saveRes.text();
          console.error(
            `Failed to save product ${product.url}:`,
            saveRes.status,
            errorText
          );
          throw new Error("Failed to save product: " + errorText);
        }

        const savedProduct = await saveRes.json();
        console.log(`Product saved successfully:`, savedProduct);

        setImportStatus((prev) => ({ ...prev, [product.url]: "success" }));
      } catch (error: any) {
        console.error(`Error processing ${product.url}:`, error);
        setImportStatus((prev) => ({ ...prev, [product.url]: "error" }));
        toast.error(`Failed to import product: ${error.message}`);
      }
    }

    toast.success("Bulk import process completed");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Bulk Product Import</h1>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <form onSubmit={handleFetchList} className="flex gap-4">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter Category URL (Jumia, Amazon, etc.)"
            className="flex-1 p-3 border rounded-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Scan Page"}
          </button>
        </form>
      </div>

      {products.length > 0 && (
        <div className="space-y-6">
          {/* Settings Section */}
          <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Category
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Category</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Stock
              </label>
              <input
                type="number"
                value={defaultStock}
                onChange={(e) => setDefaultStock(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Markup Percentage (%)
              </label>
              <input
                type="number"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Selected: {selectedProducts.size} / {products.length}
            </div>
            <button
              onClick={handleBulkImport}
              disabled={selectedProducts.size === 0 || !defaultCategory}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Selected Products
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.url}
                className={`border rounded-lg p-4 relative ${
                  selectedProducts.has(product.url)
                    ? "border-blue-500 bg-blue-50"
                    : "bg-white"
                }`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.url)}
                    onChange={() => toggleSelection(product.url)}
                    className="w-5 h-5"
                  />
                </div>

                {/* Status Badge */}
                {importStatus[product.url] && (
                  <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold z-10
                                ${
                                  importStatus[product.url] === "success"
                                    ? "bg-green-100 text-green-800"
                                    : importStatus[product.url] === "error"
                                    ? "bg-red-100 text-red-800"
                                    : importStatus[product.url] === "loading"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                  >
                    {importStatus[product.url].toUpperCase()}
                  </div>
                )}

                <div className="relative h-48 mb-3 bg-gray-100 rounded overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <h3
                  className="font-medium text-sm line-clamp-2 mb-2"
                  title={product.title}
                >
                  {product.title}
                </h3>
                <div className="text-lg font-bold text-gray-900">
                  {product.price}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {product.platform}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
