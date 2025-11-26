"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { UploadDropzone } from "@/lib/uploadthing";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "../new/AdminProductForm.module.css"; // Reuse styles

export default function ImportProductPage() {
  const router = useRouter();
  const currencyContext = useCurrency();
  const rates = currencyContext?.exchangeRates || {
    NGN: 1500,
    EUR: 0.92,
    GBP: 0.79,
    USD: 1,
  };
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "preview">("input");

  // Scraped Data & Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "", // This will be the FINAL selling price
    category: "",
    stock: "100",
    slug: "",
    sizes: "",
    productUrl: "",
    images: [] as string[],
    variants: [] as any[],
    options: [] as any[],
  });

  // Cost Calculation State
  const [costData, setCostData] = useState({
    originalPrice: 0,
    shippingFee: 0,
    markupType: "percent" as "percent" | "fixed",
    markupValue: 50, // Default 50%
  });

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/import-aliexpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch");
      }

      const data = await res.json();

      setFormData({
        ...formData,
        name: data.title,
        description: data.description,
        productUrl: data.originalUrl,
        images: data.images.slice(0, 5), // Take first 5 by default
        slug: data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
          .slice(0, 50), // Limit slug length
        variants: [], // Placeholder for now
        options: data.options || [],
      });

      setCostData({
        ...costData,
        originalPrice: data.price,
        shippingFee: data.shippingFee || 0,
      });

      setStep("preview");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Helper to convert USD to selected currency
  const toDisplay = (usdAmount: number) => {
    if (selectedCurrency === "USD") return usdAmount;
    const rate = rates[selectedCurrency as keyof typeof rates] || 1;
    return usdAmount * rate;
  };

  // Helper to convert selected currency back to USD
  const toUSD = (displayAmount: number) => {
    if (selectedCurrency === "USD") return displayAmount;
    const rate = rates[selectedCurrency as keyof typeof rates] || 1;
    return displayAmount / rate;
  };

  // Recalculate Final Price whenever cost factors change
  useEffect(() => {
    if (step === "preview") {
      const totalCost = costData.originalPrice + costData.shippingFee;
      let sellingPrice = totalCost;

      if (costData.markupType === "percent") {
        sellingPrice = totalCost * (1 + costData.markupValue / 100);
      } else {
        sellingPrice = totalCost + costData.markupValue;
      }

      setFormData((prev) => ({
        ...prev,
        price: sellingPrice.toFixed(2),
      }));
    }
  }, [costData, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          variants: [],
          colors: [],
        }),
      });

      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (step === "input") {
    return (
      <div
        className={styles.container}
        style={{ maxWidth: "600px", margin: "4rem auto" }}
      >
        <h1 className={styles.title}>Import from AliExpress</h1>
        <form onSubmit={handleFetch} className={styles.form}>
          <div>
            <label className={styles.label}>AliExpress Product URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.aliexpress.com/item/..."
              className={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? "Fetching..." : "Fetch Product"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={styles.title}>Review & Import</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Currency:</span>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="p-2 border rounded bg-white text-sm"
          >
            <option value="USD">USD ($)</option>
            <option value="NGN">NGN (₦)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Cost Calculator Card */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-bold mb-4">
            Price Calculator ({selectedCurrency})
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Product Cost:</span>
              <span className="font-mono">
                {selectedCurrency === "NGN"
                  ? "₦"
                  : selectedCurrency === "EUR"
                  ? "€"
                  : selectedCurrency === "GBP"
                  ? "£"
                  : "$"}
                {toDisplay(costData.originalPrice).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Fee (
                {selectedCurrency === "NGN"
                  ? "₦"
                  : selectedCurrency === "EUR"
                  ? "€"
                  : selectedCurrency === "GBP"
                  ? "£"
                  : "$"}
                )
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={toDisplay(costData.shippingFee).toFixed(2)}
                onChange={(e) =>
                  setCostData({
                    ...costData,
                    shippingFee: toUSD(parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="pt-2 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Markup
              </label>
              <div className="flex gap-2">
                <select
                  value={costData.markupType}
                  onChange={(e) =>
                    setCostData({
                      ...costData,
                      markupType: e.target.value as any,
                    })
                  }
                  className="p-2 border rounded bg-gray-50"
                >
                  <option value="percent">% Percentage</option>
                  <option value="fixed">
                    {selectedCurrency === "NGN" ? "₦" : "$"} Fixed Amount
                  </option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={
                    costData.markupType === "fixed"
                      ? toDisplay(costData.markupValue).toFixed(2)
                      : costData.markupValue
                  }
                  onChange={(e) =>
                    setCostData({
                      ...costData,
                      markupValue:
                        costData.markupType === "fixed"
                          ? toUSD(parseFloat(e.target.value) || 0)
                          : parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex-1 p-2 border rounded"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center text-lg font-bold text-green-600">
              <span>Final Selling Price:</span>
              <span>
                {selectedCurrency === "NGN"
                  ? "₦"
                  : selectedCurrency === "EUR"
                  ? "€"
                  : selectedCurrency === "GBP"
                  ? "£"
                  : "$"}
                {toDisplay(parseFloat(formData.price)).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Image Selection Preview */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-bold mb-4">
            Images ({formData.images.length})
          </h2>
          <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {formData.images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square border rounded overflow-hidden group"
              >
                <Image src={img} alt="preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== idx),
                    }))
                  }
                  className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Variants Preview */}
        {formData.options.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 col-span-1 md:col-span-2">
            <h2 className="text-lg font-bold mb-4">Product Variants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.options.map((opt: any, idx: number) => (
                <div key={idx} className="border p-3 rounded bg-gray-50">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    {opt.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val: string, vIdx: number) => (
                      <span
                        key={vIdx}
                        className="px-2 py-1 bg-white border rounded text-xs text-gray-600"
                      >
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
              className={styles.input}
            />
          </div>
        </div>

        <div>
          <label className={styles.label}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            rows={5}
            className={styles.textarea}
          />
        </div>

        <div className={styles.grid3}>
          <div>
            <label className={styles.label}>Final Price ($)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
              className={styles.input}
            />
            {formData.price && (
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>
                  ≈ ₦
                  {(
                    parseFloat(formData.price) * (rates?.NGN || 1500)
                  ).toLocaleString()}
                </p>
                <p>
                  ≈ €
                  {(parseFloat(formData.price) * (rates?.EUR || 0.92)).toFixed(
                    2
                  )}
                </p>
                <p>
                  ≈ £
                  {(parseFloat(formData.price) * (rates?.GBP || 0.79)).toFixed(
                    2
                  )}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className={styles.label}>Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              required
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
              className={styles.select}
            >
              <option value="">Select Category</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? "Importing..." : "Import Product"}
          </button>
          <button
            type="button"
            onClick={() => setStep("input")}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
