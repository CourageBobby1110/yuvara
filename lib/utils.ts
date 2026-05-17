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
    return getValidUrl(cleanUrl);
  }

  // Handle protocol-relative URLs
  if (cleanUrl.startsWith("//")) {
    cleanUrl = "https:" + cleanUrl;
  }

  // Handle broken stringified arrays e.g. '["https://...' or '["https://...",'
  if (cleanUrl.startsWith("[") || cleanUrl.includes('["') || cleanUrl.includes("['")) {
    // Try to extract the first http URL from the mess
    const match = cleanUrl.match(/(https?:\/\/[^"'\s,\]\\]+)/);
    if (match) {
      return getValidUrl(match[1]);
    }
  }

  // Final validation: must be http/https or local path
  if (cleanUrl.startsWith("http") || cleanUrl.startsWith("/")) {
    // Force https for external domains to avoid mixed content issues
    if (cleanUrl.startsWith("http://") && !cleanUrl.includes("localhost")) {
      cleanUrl = cleanUrl.replace("http://", "https://");
    }
    return cleanUrl;
  }

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

  // 4. Try variants
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const variant of product.variants) {
      const valid = getValidUrl(variant.image);
      if (valid) return valid;
    }
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

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
