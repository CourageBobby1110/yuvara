export type Currency = "USD" | "NGN" | "EUR" | "GBP";

// Exchange rates with USD as base
export const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1,
  NGN: 1500, // 1 USD = 1500 NGN
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  NGN: "₦",
  EUR: "€",
  GBP: "£",
};
