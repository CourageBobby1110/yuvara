export type Currency = "USD" | "NGN" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "CHF" | "CNY" | "INR" | "ZAR" | "AED";

// Exchange rates with USD as base (approximate values)
export const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1,
  NGN: 1500,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.53,
  JPY: 150.0,
  CHF: 0.88,
  CNY: 7.20,
  INR: 83.0,
  ZAR: 18.5,
  AED: 3.67,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  NGN: "₦",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  ZAR: "R",
  AED: "د.إ",
};
