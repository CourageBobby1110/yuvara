"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { useState, useRef, useEffect } from "react";

export default function CurrencySelector({
  theme = "light",
}: {
  theme?: "light" | "dark";
}) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies = ["USD", "NGN", "EUR", "GBP"] as const;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const textColor =
    theme === "dark"
      ? "text-white hover:text-gray-200"
      : "text-gray-700 hover:text-black";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1 text-sm font-medium transition-colors ${textColor}`}
      >
        <span>{currency}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCurrency(c);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                currency === c ? "font-bold text-black" : "text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
