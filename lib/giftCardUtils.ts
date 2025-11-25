/**
 * Generate a unique gift card code
 * Format: XXXX-XXXX-XXXX-XXXX
 * Uses cryptographically secure random generation
 */
export function generateGiftCardCode(): string {
  // Exclude similar-looking characters (0, O, I, 1, etc.)
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = 4;
  const segmentLength = 4;

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () => {
      // Use crypto for secure random generation
      const randomValues = new Uint32Array(1);
      crypto.getRandomValues(randomValues);
      const randomIndex = randomValues[0] % charset.length;
      return charset[randomIndex];
    }).join("");
  }).join("-");

  return code;
}

/**
 * Generate a unique gift card code and verify it doesn't exist
 * Retries up to 10 times if collision occurs
 * NOTE: This function should only be called server-side (in API routes)
 * It dynamically imports the GiftCard model to avoid client-side errors
 */
export async function generateUniqueGiftCardCode(): Promise<string> {
  // Dynamic import to avoid loading mongoose on client side
  const { default: GiftCard } = await import("@/models/GiftCard");

  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = generateGiftCardCode();

    // Check if code already exists
    const existing = await GiftCard.findOne({ code });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique gift card code after 10 attempts");
}

/**
 * Validate gift card code format
 */
export function isValidGiftCardCodeFormat(code: string): boolean {
  // Format: XXXX-XXXX-XXXX-XXXX
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "NGN"
): string {
  if (currency === "NGN") {
    return `₦${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Calculate gift card discount for checkout
 */
export function calculateGiftCardDiscount(
  orderTotal: number,
  giftCardBalance: number
): {
  discountAmount: number;
  remainingBalance: number;
  remainingOrderAmount: number;
} {
  const discountAmount = Math.min(orderTotal, giftCardBalance);
  const remainingBalance = giftCardBalance - discountAmount;
  const remainingOrderAmount = orderTotal - discountAmount;

  return {
    discountAmount,
    remainingBalance,
    remainingOrderAmount,
  };
}

/**
 * Preset gift card amounts
 */
export const GIFT_CARD_PRESETS = [
  { value: 5000, label: "₦5,000" },
  { value: 10000, label: "₦10,000" },
  { value: 25000, label: "₦25,000" },
  { value: 50000, label: "₦50,000" },
  { value: 100000, label: "₦100,000" },
];

/**
 * Gift card amount limits
 */
export const GIFT_CARD_LIMITS = {
  MIN_AMOUNT: 1000, // ₦1,000
  MAX_AMOUNT: 500000, // ₦500,000
};
