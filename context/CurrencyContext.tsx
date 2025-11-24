"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Currency = "USD" | "NGN" | "EUR" | "GBP";

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

// Exchange rates with USD as base
const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1,
  NGN: 1500, // 1 USD = 1500 NGN
  EUR: 0.92,
  GBP: 0.79,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  NGN: "₦",
  EUR: "€",
  GBP: "£",
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [exchangeRates, setExchangeRates] =
    useState<Record<Currency, number>>(DEFAULT_RATES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Auto-detect currency based on IP
    const detectCurrency = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
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
        console.error("Failed to detect currency:", error);
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
