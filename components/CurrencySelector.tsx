"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { Currency, DEFAULT_RATES } from "@/lib/currency";
import { useState, useRef, useEffect } from "react";

export default function CurrencySelector({
  theme = "light",
  variant = "dropdown",
}: {
  theme?: "light" | "dark";
  variant?: "dropdown" | "flowing";
}) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies = Object.keys(DEFAULT_RATES) as Currency[];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (variant === "dropdown") {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [variant]);

  const isDark = theme === "dark";
  const isFlowing = variant === "flowing";

  return (
    <div className={isFlowing ? "w-full" : "relative inline-block text-left"} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 transition-all duration-300 ${
          isFlowing 
            ? "w-full justify-between py-2" 
            : `px-3 py-1.5 rounded-full border ${
                isDark
                  ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  : "bg-gray-50 border-gray-100 text-gray-900 hover:bg-white hover:border-gold/50 hover:shadow-sm"
              }`
        }`}
      >
        <span className={isFlowing ? "text-sm font-bold text-gray-900" : "text-[0.8125rem] font-bold tracking-wider uppercase leading-none"}>
          {isFlowing ? "Currency" : currency}
        </span>
        <div className="flex items-center gap-2">
          {isFlowing && <span className="text-sm font-bold text-[#996515]">{currency}</span>}
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isOpen ? "rotate-180 text-[#996515]" : "opacity-60"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className={
          isFlowing 
            ? "mt-2 grid grid-cols-3 gap-2 pb-2" 
            : "absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-28 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[10001] animate-in fade-in zoom-in duration-200"
        }>
          {!isFlowing && (
            <div className="px-3 py-1.5 mb-1 bg-gray-50/50 border-b border-gray-50">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                Currency
              </span>
            </div>
          )}
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCurrency(c);
                setIsOpen(false);
              }}
              className={
                isFlowing
                  ? `py-2 rounded-lg text-xs font-bold text-center border transition-all ${
                      currency === c 
                        ? "bg-[#996515] border-[#996515] text-white" 
                        : "bg-white border-gray-100 text-gray-600"
                    }`
                  : `w-full text-left px-4 py-2.5 text-sm font-semibold transition-all hover:bg-gray-50 ${
                      currency === c
                        ? "text-[#996515] bg-[#996515]/5"
                        : "text-gray-600 hover:pl-5"
                    }`
              }
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
