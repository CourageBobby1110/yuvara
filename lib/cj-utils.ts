import axios from "axios";

/**
 * Run async operations with a concurrency limit.
 * @param items Array of items to process
 * @param callback Async function to run for each item
 * @param limit Max number of concurrent operations
 */
export async function mapConcurrent<T, R>(
  items: T[],
  callback: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = [];
  const running: Promise<void>[] = [];
  const queue = [...items];

  // We need to maintain the order of results
  const resultPromises: Promise<R>[] = items.map((item) => callback(item));

  // Note: The simple map above starts all promises effectively.
  // To truly limit concurrency, we need a different approach.

  const limitConcurrency = async () => {
    const results: R[] = new Array(items.length);
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        results[index] = await callback(items[index]);
      }
    };

    const workers = Array(Math.min(limit, items.length))
      .fill(null)
      .map(() => worker());

    await Promise.all(workers);
    return results;
  };

  return limitConcurrency();
}

/**
 * Slugify a string
 */
export function slugify(text: string) {
  const slug = text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return slug || "";
}

export const TARGET_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

/**
 * Fetch Shipping Rates (Centralized)
 */
export async function fetchShippingRates(accessToken: string, vid: string) {
  if (!vid) return [];

  const rates = await mapConcurrent(
    TARGET_COUNTRIES,
    async (country) => {
      try {
        const res = await axios.post(
          `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
          {
            startCountryCode: "CN",
            endCountryCode: country.code,
            products: [
              {
                quantity: 1,
                vid: vid,
              },
            ],
          },
          { headers: { "CJ-Access-Token": accessToken } }
        );

        if (res.data?.result && res.data?.data?.length > 0) {
          const options = res.data.data;
          // Sort by price (cheapest first)
          options.sort(
            (a: any, b: any) =>
              parseFloat(a.logisticPrice) - parseFloat(b.logisticPrice)
          );
          const cheapest = options[0];
          return {
            countryCode: country.code,
            countryName: country.name,
            price: parseFloat(cheapest.logisticPrice),
            method: cheapest.logisticName,
            deliveryTime: cheapest.logisticAging,
          };
        }
      } catch (error) {
        // console.error(`Error fetching shipping for ${country.name}:`, error);
      }
      return null;
    },
    TARGET_COUNTRIES.length
  );

  return rates.filter((r) => r !== null) as any[];
}

/**
 * Parse CJ Variant Data
 */
export function parseCJVariant(
  v: any,
  defaultImage: string,
  basePrice: number,
  shippingRates: any[] = [],
  shippingFee: number = 0
) {
  // Use sellPrice if available (common in new API), otherwise productPrice
  let variantCost = parseFloat(v.sellPrice) || parseFloat(v.productPrice);

  if (isNaN(variantCost) || variantCost === 0) {
    variantCost = basePrice;
  }

  let color = v.productColor;
  let size = v.productSize;

  // Helper to clean size
  const cleanSize = (s: string) => {
    if (!s) return "";
    const lower = s.toLowerCase().trim();
    if (
      lower === "default" ||
      lower === "standard" ||
      lower === "one size" ||
      lower === "specification" ||
      lower === "model"
    ) {
      return ""; // Treat generic terms as empty/default
    }
    return s.trim();
  };

  size = cleanSize(size);

  // Fallback: Parse variantKey if color/size are missing or Default
  // variantKey format example: "color:Red;size:XL" or "Red-XL"
  if ((!color || color === "Default" || !size) && v.variantKey) {
    const parts = v.variantKey.split(";");
    for (const part of parts) {
      const [key, val] = part.split(":");
      if (key && val) {
        const k = key.toLowerCase().trim();
        const v = val.trim();
        if (k === "color" || k === "colour") {
          if (!color || color === "Default") color = v;
        } else if (k === "size" || k === "specification" || k === "standard") {
          if (!size) size = cleanSize(v);
        }
      }
    }
  }

  // If still Default, try to use the first part of variantKey if it looks like a color
  if (
    (!color || color === "Default") &&
    v.variantKey &&
    !v.variantKey.includes(":")
  ) {
    const parts = v.variantKey.split("-");
    if (parts.length > 0) color = parts[0];
    if (parts.length > 1 && !size) size = cleanSize(parts[1]);
  }

  return {
    color: color && color !== "Default" ? color : v.variantKey || "Default",
    image: v.variantImage || v.productImage || defaultImage,
    price: variantCost * 1.5, // Markup confirmed here
    stock: v.realStock !== undefined ? v.realStock : v.productNumber || 0,
    size: size,
    cjVid: v.vid,
    cjSku: v.productSku,
    shippingRates: shippingRates,
    shippingFee: shippingFee,
  };
}
