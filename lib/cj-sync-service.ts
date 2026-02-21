import Product from "@/models/Product";
import axios from "axios";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import dbConnect from "@/lib/db";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromCJWithRetry(
  url: string,
  data: any,
  accessToken: string,
  retries = 3,
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(url, data, {
        headers: { "CJ-Access-Token": accessToken },
      });
      return res;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Aggressive backoff: 30s, 60s, 90s
        const delay = 30000 * (i + 1);
        console.warn(
          `[RateLimit] Hit 429. Cooling down for ${delay / 1000}s (Attempt ${
            i + 1
          }/${retries})...`,
        );
        await wait(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded for CJ API");
}

export async function syncProductPrice(productId: string) {
  await dbConnect();
  const product = await Product.findById(productId);
  if (!product || !product.cjPid) {
    throw new Error("Product not found or not linked to CJ");
  }

  const accessToken = await getValidCJAccessToken();
  if (!accessToken) throw new Error("CJ Dropshipping not connected");

  // Fetch detailed variants (Deep Fetch)
  let detailedVariants: any[] = [];
  try {
    const vRes = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/variant/queryByPid?pid=${product.cjPid}`,
      { headers: { "CJ-Access-Token": accessToken } },
    );
    if (vRes.data?.result && vRes.data?.data) {
      detailedVariants = Array.isArray(vRes.data.data) ? vRes.data.data : [];
    }
  } catch (e) {
    console.warn("Deep variant fetch failed, relying on primary data.");
  }

  // Fallback to basic product query if deep fetch empty
  if (detailedVariants.length === 0) {
    const response = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
      { headers: { "CJ-Access-Token": accessToken } },
    );
    if (response.data?.result && response.data?.data) {
      detailedVariants = response.data.data.variants || [];
    }
  }

  const variants = JSON.parse(JSON.stringify(product.variants || []));
  const updatedVariants = [];
  let processedCount = 0;

  for (const variant of variants) {
    if (variant.cjVid) {
      const cjVariant = detailedVariants.find(
        (v: any) => String(v.vid) === String(variant.cjVid),
      );

      if (cjVariant) {
        const cost =
          parseFloat(cjVariant.variantSellPrice) ||
          parseFloat(cjVariant.sellPrice) ||
          parseFloat(cjVariant.productPrice) ||
          0;

        if (cost > 0) {
          updatedVariants.push({
            ...variant,
            price: cost * 1.5, // 1.5x markup
          });
          processedCount++;
        } else {
          updatedVariants.push(variant);
        }
      } else {
        updatedVariants.push(variant);
      }
    } else {
      updatedVariants.push(variant);
    }
  }

  product.variants = updatedVariants;
  if (updatedVariants.length > 0) {
    product.price = updatedVariants[0].price;
  }
  product.lastSyncedPrice = new Date();
  product.markModified("variants");
  await product.save();

  return { success: true, processedCount };
}

async function fetchVariantStockFromCJ(
  accessToken: string,
  vid: string,
  sku: string,
) {
  const fetchStrategies = [
    {
      name: "VID",
      fn: () =>
        axios.get(
          `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${vid}`,
          { headers: { "CJ-Access-Token": accessToken } },
        ),
      condition: !!vid,
    },
    {
      name: "SKU",
      fn: () =>
        axios.get(
          `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=${sku}`,
          { headers: { "CJ-Access-Token": accessToken } },
        ),
      condition: !!sku,
    },
  ];

  for (const strategy of fetchStrategies) {
    if (!strategy.condition) continue;

    let retries = 3;
    while (retries > 0) {
      try {
        await wait(200);
        const res = await strategy.fn();

        if (res.data?.result && res.data?.data) {
          const data = Array.isArray(res.data.data)
            ? res.data.data
            : [res.data.data];
          const totalStock = data.reduce(
            (acc: number, item: any) => acc + (item.totalInventoryNum || 0),
            0,
          );
          return totalStock;
        }
        break;
      } catch (error: any) {
        if (error.response?.status === 429) {
          retries--;
          await wait(2000);
        } else {
          break;
        }
      }
    }
  }
  return null;
}

export async function syncVariantStock(productId: string, variantVid: string) {
  await dbConnect();
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const accessToken = await getValidCJAccessToken();
  if (!accessToken) throw new Error("CJ Dropshipping not connected");

  const variants = JSON.parse(JSON.stringify(product.variants || []));
  const updatedVariants = [];
  let totalStock = 0;
  let updatedSomething = false;

  for (const variant of variants) {
    if (variant.cjVid === variantVid) {
      const stock = await fetchVariantStockFromCJ(
        accessToken,
        variant.cjVid,
        variant.cjSku,
      );

      if (stock !== null) {
        updatedVariants.push({ ...variant, stock });
        totalStock += stock;
        updatedSomething = true;
      } else {
        updatedVariants.push(variant);
        totalStock += variant.stock || 0;
      }
    } else {
      updatedVariants.push(variant);
      totalStock += variant.stock || 0;
    }
  }

  // Only save if we actually found the variant and updated it?
  // Actually we should save to update the total stock calculation even if others didn't change
  product.variants = updatedVariants;
  product.stock = totalStock;
  product.lastSyncedStock = new Date();
  product.markModified("variants");
  await product.save();

  return { success: true, updatedSomething };
}

const TARGET_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

export async function syncVariantShipping(
  productId: string,
  variantVid: string,
) {
  await dbConnect();
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const accessToken = await getValidCJAccessToken();
  if (!accessToken) throw new Error("CJ Dropshipping not connected");

  const variants = JSON.parse(JSON.stringify(product.variants || []));
  const updatedVariants = [];
  let updatedSomething = false;

  for (const variant of variants) {
    if (variant.cjVid === variantVid) {
      const rates = [];

      for (const country of TARGET_COUNTRIES) {
        try {
          // Very slow, human-like pace: 6-8 seconds per country
          await wait(6000 + Math.random() * 2000);
          const res = await fetchFromCJWithRetry(
            `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
            {
              startCountryCode: "CN",
              endCountryCode: country.code,
              products: [{ quantity: 1, vid: variant.cjVid }],
            },
            accessToken,
          );

          if (res.data?.result && res.data?.data?.length > 0) {
            const options = res.data.data;
            options.sort(
              (a: any, b: any) =>
                parseFloat(a.logisticPrice) - parseFloat(b.logisticPrice),
            );
            const cheapest = options[0];
            rates.push({
              countryCode: country.code,
              countryName: country.name,
              price: parseFloat(cheapest.logisticPrice),
              method: cheapest.logisticName,
              deliveryTime: cheapest.logisticAging,
            });
          }
        } catch (error) {
          // Ignore individual country structure errors
        }
      }

      let shippingFee = 0;
      const nigeriaRate = rates.find((r: any) => r.countryCode === "NG");
      if (nigeriaRate) shippingFee = nigeriaRate.price;

      updatedVariants.push({
        ...variant,
        shippingRates: rates,
        shippingFee,
      });
      updatedSomething = true;
    } else {
      updatedVariants.push(variant);
    }
  }

  product.variants = updatedVariants;
  if (updatedVariants.length > 0) {
    // Update main product shipping from first variant or the one we just updated?
    // Users logic often assumes uniform shipping or main = first.
    // Let's stick to updating main if it matches the first variant contextually or just let it be.
    // The previous route updated main from first variant.
    if (updatedVariants[0].shippingRates) {
      product.shippingFee = updatedVariants[0].shippingFee;
      product.shippingRates = updatedVariants[0].shippingRates;
    }
  }
  product.lastSyncedShipping = new Date();
  product.markModified("variants");
  await product.save();

  return { success: true, updatedSomething };
}
