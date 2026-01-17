export const PRODUCT_CATEGORIES = [
  "Women's Fashion",
  "Men's Fashion",
  "Phones & Telecommunications",
  "Computer, Office & Security",
  "Consumer Electronics",
  "Jewelry & Watches",
  "Home, Pet & Appliances",
  "Bags & Shoes",
  "Toys, Kids & Babies",
  "Outdoor Fun & Sports",
  "Beauty, Health & Hair",
  "Automobiles & Motorcycles",
  "Tools & Home Improvement",
  "Furniture",
  "Food",
  "Books",
  "Other",
];

export function determineCategory(input: string): string {
  if (!input) return "Other";

  // 1. Normalize input
  // "Bag & Shoes / Men's Luggage & Bags / Crossbody Bags" -> "Bag & Shoes" (Top level)
  // Also handles "Men's Clothing > Bottoms" -> "Men's Clothing"
  const parts = input.split(/[\/>]/).map((p) => p.trim());
  const topLevel = parts[0];

  const normalizedInput = topLevel
    .toLowerCase()
    .replace(/[^\w\s&]/g, "") // Keep & for matching
    .replace(/\s+/g, " ");

  // Manual mappings for common divergences
  const MANUAL_MAPPINGS: Record<string, string> = {
    "mens clothing": "Men's Fashion",
    "womens clothing": "Women's Fashion",
    "mens shoes": "Bags & Shoes", // Or Men's Fashion depending on preference? usually Bags & Shoes
    "womens shoes": "Bags & Shoes",
    bags: "Bags & Shoes",
    shoes: "Bags & Shoes",
    "home appliances": "Home, Pet & Appliances",
    phones: "Phones & Telecommunications",
  };

  if (MANUAL_MAPPINGS[normalizedInput]) {
    return MANUAL_MAPPINGS[normalizedInput];
  }

  // 2. Exact Match (Case insensitive)
  const exactMatch = PRODUCT_CATEGORIES.find(
    (c) => c.toLowerCase() === topLevel.toLowerCase(),
  );
  if (exactMatch) return exactMatch;

  // 3. Keyword / Fuzzy Match against existing categories
  // We check if significant words from the input appear in our known categories
  const keywords = normalizedInput
    .split(/[\s&]+/)
    .filter((w) => w.length > 2 && w !== "and");

  let bestMatch = "";
  let maxMatches = 0;

  for (const category of PRODUCT_CATEGORIES) {
    const catNormalized = category.toLowerCase();
    let matches = 0;
    for (const keyword of keywords) {
      if (catNormalized.includes(keyword)) {
        matches++;
      }
    }
    // Boost score if the category also contains the keyword (bi-directional check)
    if (matches > 0 && matches > maxMatches) {
      maxMatches = matches;
      bestMatch = category;
    }
  }

  if (bestMatch && maxMatches > 0) {
    return bestMatch;
  }

  // 4. Fallback: Use the top level path segment, capitalized nicely
  // e.g. "new category" -> "New Category"
  return topLevel
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
