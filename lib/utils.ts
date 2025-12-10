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
      // Failed to parse, treat as invalid if it looks like an array structure
      return "";
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
