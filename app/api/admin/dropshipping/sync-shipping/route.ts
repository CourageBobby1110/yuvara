import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Product from "@/models/Product";
import axios from "axios";
import mongoose from "mongoose";
import { getValidCJAccessToken } from "@/lib/cj-auth";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromCJWithRetry(
  url: string,
  data: any,
  accessToken: string,
  retries = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(url, data, {
        headers: { "CJ-Access-Token": accessToken },
      });
      return res;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const delay = 5000 * (i + 1); // Linear backoff: 5s, 10s, 15s
        console.warn(
          `[RateLimit] Hit 429. Retrying in ${delay / 1000}s (Attempt ${
            i + 1
          }/${retries})...`
        );
        await wait(delay);
      } else {
        throw error; // Throw other errors immediately
      }
    }
  }
  throw new Error("Max retries exceeded for CJ API");
}

async function fetchShippingRates(accessToken: string, vid: string) {
  if (!vid) return [];
  const TARGET_COUNTRIES = [
    { code: "NG", name: "Nigeria" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
  ];

  const rates = [];

  for (const country of TARGET_COUNTRIES) {
    try {
      await wait(1500); // Increased delay to 1.5s per country
      const res = await fetchFromCJWithRetry(
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
        accessToken
      );

      if (res.data?.result && res.data?.data?.length > 0) {
        const options = res.data.data;
        options.sort(
          (a: any, b: any) =>
            parseFloat(a.logisticPrice) - parseFloat(b.logisticPrice)
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
    } catch (error: any) {
      console.error(
        `Failed to fetch shipping for ${country.name} (VID: ${vid}):`,
        error.message
      );
      // Continue to next country even if one fails
    }
  }

  return rates;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    // if (!session || session.user?.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { productId, targetVid } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "CJ Dropshipping not connected" },
        { status: 400 }
      );
    }

    // Convert variants to POJOs to strictly avoid Mongoose state issues
    // Using JSON parse/stringify is the safest way to get a clean object without internal state
    const variants = JSON.parse(JSON.stringify(product.variants || []));
    console.log(
      `[SyncShipping] Found ${variants.length} variants for product ${productId}`
    );

    const updatedVariants = [];

    // Process variants sequentially to ensure max safety with rate limits
    for (const variant of variants) {
      // If targetVid is specified, only sync that one. Otherwise, sync all.
      const shouldSync = targetVid ? variant.cjVid === targetVid : true;

      if (shouldSync && variant.cjVid) {
        console.log(
          `[SyncShipping] Fetching rates for variant ${variant.cjVid}...`
        );
        // Add significant delay between variants to cool down if syncing multiple
        if (updatedVariants.length > 0 && !targetVid) {
          await wait(2000);
        }

        const rates = await fetchShippingRates(accessToken, variant.cjVid);
        console.log(
          `[SyncShipping] Found ${rates.length} rates for variant ${variant.cjVid}`
        );

        let shippingFee = 0;
        const nigeriaRate = rates.find((r: any) => r.countryCode === "NG");
        if (nigeriaRate) shippingFee = nigeriaRate.price;

        updatedVariants.push({
          ...variant,
          shippingRates: rates,
          shippingFee: shippingFee,
        });
      } else {
        // Keep existing data
        updatedVariants.push(variant);
      }
    }

    const cleanVariants = updatedVariants;

    // Update product-level shipping fee (first variant or 0)
    if (cleanVariants.length > 0) {
      product.shippingFee = cleanVariants[0].shippingFee;
      product.shippingRates = cleanVariants[0].shippingRates;
    }

    product.variants = cleanVariants;
    product.lastSyncedShipping = new Date();
    product.markModified("variants"); // Force Mongoose to see the change
    await product.save();
    console.log(`[SyncShipping] Product saved successfully.`);

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Shipping Sync Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to sync shipping" },
      { status: 500 }
    );
  }
}
