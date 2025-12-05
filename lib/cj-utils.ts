import axios from "axios";

export function parseCJVariant(
  v: any,
  defaultImage: string,
  basePrice: number,
  shippingFee: number = 0,
  shippingFees: {
    countryCode: string;
    fee: number;
    method?: string;
    deliveryTime?: string;
  }[] = []
) {
  let variantCost = parseFloat(v.variantSellPrice);
  if (isNaN(variantCost) || variantCost === 0) {
    variantCost = parseFloat(v.productPrice);
  }
  if (isNaN(variantCost) || variantCost === 0) {
    variantCost = parseFloat(v.sellPrice);
  }
  if (isNaN(variantCost) || variantCost === 0) {
    variantCost = parseFloat(v.variantPrice);
  }
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
    price: variantCost * 1.5, // Markup
    stock: v.realStock !== undefined ? v.realStock : v.productNumber || 0,
    size: size,
    cjVid: v.vid,
    cjSku: v.productSku,
    shippingFee: shippingFee,
    shippingFees: shippingFees,
  };
}

export async function fetchVariantStock(
  accessToken: string,
  vid: string,
  sku: string,
  delayMs = 500
) {
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fetchStrategies = [
    {
      name: "VID",
      fn: () =>
        axios.get(
          `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${vid}`,
          { headers: { "CJ-Access-Token": accessToken } }
        ),
      condition: !!vid,
    },
    {
      name: "SKU",
      fn: () =>
        axios.get(
          `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=${sku}`,
          { headers: { "CJ-Access-Token": accessToken } }
        ),
      condition: !!sku,
    },
  ];

  for (const strategy of fetchStrategies) {
    if (!strategy.condition) continue;

    let retries = 3;
    while (retries > 0) {
      try {
        await wait(delayMs);
        const res = await strategy.fn();

        if (res.data?.result && res.data?.data) {
          const data = Array.isArray(res.data.data)
            ? res.data.data
            : [res.data.data];
          const totalStock = data.reduce(
            (acc: number, item: any) => acc + (item.totalInventoryNum || 0),
            0
          );
          return totalStock;
        }
        break;
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.warn(
            `Rate limit hit for ${strategy.name} ${vid || sku}. Retrying...`
          );
          retries--;
          await wait(2000);
        } else {
          console.error(
            `Error fetching stock via ${strategy.name}:`,
            error.message
          );
          break;
        }
      }
    }
  }

  return null;
}

export async function fetchVariantShipping(
  accessToken: string,
  vid: string,
  countryCode: string = "NG"
) {
  if (!vid)
    return {
      price: 0,
    };

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  let retries = 3;

  while (retries > 0) {
    try {
      // Small delay to be nice to the API
      await wait(500);

      const res = await axios.post(
        `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
        {
          startCountryCode: "CN",
          endCountryCode: countryCode,
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
          price: parseFloat(cheapest.logisticPrice),
          method: cheapest.logisticName,
          deliveryTime: cheapest.logisticAging,
        };
      }
      // If result is true but no data (e.g. valid request but no shipping found), verify data structure
      if (
        res.data?.result &&
        (!res.data?.data || res.data?.data.length === 0)
      ) {
        console.warn(
          `No shipping options found for VID ${vid} to ${countryCode}`
        );
        return { price: 0 };
      }

      // If we get here, it might be an API error disguised as 200 or something else.
      // check success flag
      if (!res.data?.result) {
        console.warn(
          `CJ API returned false for VID ${vid}: ${res.data?.message}`
        );
      }

      return { price: 0 }; // Success but no value, or explicit failure
    } catch (e: any) {
      if (e.response?.status === 429 || e.code === "ECONNRESET") {
        console.warn(`Rate limit/Network error for VID ${vid}. Retrying...`);
        retries--;
        await wait(2000);
      } else {
        console.error(`Shipping calculation failed for VID ${vid}:`, e.message);
        break; // Non-retryable error
      }
    }
  }
  return { price: 0 };
}
