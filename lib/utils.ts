import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getValidUrl(url: string | any): string {
  if (!url) return "";

  if (typeof url !== "string") return "";

  let cleanUrl = url.trim();

  // Strip wrapping quotes if present
  if (
    (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) ||
    (cleanUrl.startsWith("'") && cleanUrl.endsWith("'"))
  ) {
    cleanUrl = cleanUrl.slice(1, -1);
    // Recurse to handle cases like '"["url"]"'
    return getValidUrl(cleanUrl);
  }

  // Handle protocol-relative URLs (common in CJ Dropshipping)
  if (cleanUrl.startsWith("//")) {
    cleanUrl = "https:" + cleanUrl;
  }

  // Recursive check for stringified arrays like '["url"]'
  if (cleanUrl.startsWith("[") && cleanUrl.endsWith("]")) {
    try {
      const parsed = JSON.parse(cleanUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getValidUrl(parsed[0]);
      }
    } catch (e) {
      // If JSON parse fails, fall through to regex check below
    }
  }

  // Handle malformed array-like strings or messy CSV data e.g. '["https://...'
  if (cleanUrl.startsWith('["') || cleanUrl.startsWith("['")) {
    const match = cleanUrl.match(/(https?:\/\/[^"']+)/);
    if (match) {
      return getValidUrl(match[1]);
    }
  }

  // Final validation: must be http/https or local path
  if (cleanUrl.startsWith("http") || cleanUrl.startsWith("/")) {
    return cleanUrl;
  }

  // Log rejected URLs to server console for debugging
  console.log("DEBUG: Rejected invalid image URL:", url);
  return "";
}

export function getProductMainImage(
  product: any,
  placeholder = "/placeholder.png"
): string {
  if (!product) return placeholder;

  // 1. Try arrays (product.images)
  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      const valid = getValidUrl(img);
      if (valid) return valid;
    }
  }

  // 2. Try single string (product.images)
  if (typeof product.images === "string") {
    const valid = getValidUrl(product.images);
    if (valid) return valid;
  }

  // 3. Try product.image
  if (product.image) {
    const valid = getValidUrl(product.image);
    if (valid) return valid;
  }

  return placeholder;
}

function mulberry32(a: number) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArray<T>(array: T[], seed: number): T[] {
  const t = array.slice();
  const random = mulberry32(seed);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }

  return t;
}
