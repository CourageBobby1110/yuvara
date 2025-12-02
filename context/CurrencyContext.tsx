"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { Currency, DEFAULT_RATES, CURRENCY_SYMBOLS } from "@/lib/currency";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
  exchangeRates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [exchangeRates, setExchangeRates] =
    useState<Record<Currency, number>>(DEFAULT_RATES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Auto-detect currency based on IP
    const detectCurrency = async () => {
      try {
        // Try primary service
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("Primary IP service failed");
        const data = await res.json();

        if (
          data.currency &&
          ["USD", "NGN", "EUR", "GBP"].includes(data.currency)
        ) {
          setCurrency(data.currency as Currency);
        } else if (data.country_code === "NG") {
          setCurrency("NGN");
        }
      } catch (error) {
        // Fallback service (ipwho.is - free, no key, reliable)
        try {
          const res = await fetch("https://ipwho.is/");
          const data = await res.json();
          if (data.success && data.country_code === "NG") {
            setCurrency("NGN");
          }
        } catch (e) {
          console.error("Failed to detect currency:", e);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    detectCurrency();
  }, []);

  const convertPrice = (priceInUSD: number) => {
    return priceInUSD * exchangeRates[currency];
  };

  const formatPrice = (priceInUSD: number) => {
    const converted = convertPrice(priceInUSD);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatPrice,
        exchangeRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
