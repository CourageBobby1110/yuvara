"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";

export default function ProductFilter({
  categories = [],
}: {
  categories?: string[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { currency } = useCurrency();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      USD: "$",
      NGN: "₦",
      EUR: "€",
      GBP: "£",
    };
    return symbols[currency] || "$";
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl">
      <div
        className="flex items-center justify-between cursor-pointer md:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-bold text-xl text-gray-900 tracking-tight">
          Filters
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Refine
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 md:hidden transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <div className={`space-y-6 ${isOpen ? "block" : "hidden md:block"}`}>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Category
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none bg-white/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all duration-200 cursor-pointer hover:bg-white/80"
              onChange={(e) => handleFilterChange("category", e.target.value)}
              defaultValue={searchParams.get("category")?.toString()}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Price Range ({currency})
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                placeholder="Min"
                className="w-full bg-white/50 border border-gray-200 rounded-xl py-2.5 pl-7 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all duration-200 placeholder:text-gray-400"
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                defaultValue={searchParams.get("minPrice")?.toString()}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                placeholder="Max"
                className="w-full bg-white/50 border border-gray-200 rounded-xl py-2.5 pl-7 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all duration-200 placeholder:text-gray-400"
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                defaultValue={searchParams.get("maxPrice")?.toString()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
