"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    value: "",
    expirationDate: "",
    usageLimit: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
          expirationDate: formData.expirationDate || null,
        }),
      });

      if (res.ok) {
        router.push("/admin/coupons");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Create error", error);
      alert("Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/coupons"
          className="text-gray-500 hover:text-gray-900"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Coupon</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code
            </label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-200 px-4 py-3 text-gray-900 focus:border-black focus:ring-black uppercase"
              placeholder="e.g. SUMMER2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-200 px-4 py-3 text-gray-900 focus:border-black focus:ring-black"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (NGN)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="number"
                name="value"
                required
                min="0"
                value={formData.value}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-200 px-4 py-3 text-gray-900 focus:border-black focus:ring-black"
                placeholder={
                  formData.discountType === "percentage" ? "10" : "5000"
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-200 px-4 py-3 text-gray-900 focus:border-black focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                name="usageLimit"
                min="1"
                value={formData.usageLimit}
                onChange={handleChange}
                className="block w-full rounded-lg border-gray-200 px-4 py-3 text-gray-900 focus:border-black focus:ring-black"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
