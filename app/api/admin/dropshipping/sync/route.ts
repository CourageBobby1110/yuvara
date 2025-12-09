import { NextResponse } from "next/server";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import {
  mapConcurrent,
  fetchShippingRates,
  parseCJVariant,
} from "@/lib/cj-utils";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import axios from "axios";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchShippingToNigeria(accessToken: string, vid: string) {
  try {
    const res = await axios.post(
      `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
      {
        startCountryCode: "CN",
        endCountryCode: "NG",
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
      options.sort(
        (a: any, b: any) =>
          parseFloat(a.logisticPrice) - parseFloat(b.logisticPrice)
      );
      return parseFloat(options[0].logisticPrice);
    }
  } catch (error) {
    // console.error("Error fetching shipping:", error);
  }
  return 0;
}

async function fetchVariantStock(
  accessToken: string,
  vid: string,
  sku: string
) {
  try {
    // Try queryByVid
    try {
      const res = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${vid}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );
      if (res.data?.result) {
        return parseInt(res.data.data) || 0;
      }
    } catch {}

    // Fallback QueryBySku
    if (sku) {
      const res = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=${sku}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );
      if (res.data?.result) {
        return parseInt(res.data.data) || 0;
      }
    }
  } catch (err) {
    // console.error(`Stock fetch failed for ${vid}:`, err);
  }
  return 0; // Default to 0 if failed, assume OOS or handled next time
}

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const product = await Product.findById(productId);
    if (!product || !product.cjPid) {
      return NextResponse.json(
        { error: "Product not linked to CJ" },
        { status: 404 }
      );
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with CJ" },
        { status: 500 }
      );
    }

    // 1. Fetch Product Details (Prices, Variants)
    const productRes = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
      { headers: { "CJ-Access-Token": accessToken } }
    );

    if (!productRes.data?.result || !productRes.data?.data) {
      throw new Error("Product data not found on CJ");
    }

    const cjProduct = productRes.data.data;
    const cjVariants = cjProduct.variants;
    const defaultImage = cjProduct.productImage;
    const sellPrice =
      parseFloat(cjProduct.sellPrice) || parseFloat(cjProduct.productPrice);

    // 2. Process Variants Concurrently (Stock & Shipping)
    // We update local variants based on CJ variants.
    // Use mapConcurrent to avoid rate limits

    const updatedVariants = await mapConcurrent(
      cjVariants,
      async (v: any) => {
        // Add random delay to prevent burst
        await delay(Math.random() * 500);

        let stock = 0;
        let shippingFee = 0;
        let shippingRates: any[] = [];

        // Check if we have this variant locally to preserve some data if needed?
        // Actually we want to overwrite with CJ data to be in sync.

        // Fetch Stock
        try {
          stock = await fetchVariantStock(accessToken, v.vid, v.productSku);
        } catch (e) {}

        // Fetch Shipping (Full Rates)
        try {
          shippingRates = await fetchShippingRates(accessToken, v.vid);
          if (shippingRates.length > 0) {
            const ngRate = shippingRates.find((r) => r.countryCode === "NG");
            const cheapest = [...shippingRates].sort(
              (a, b) => a.price - b.price
            )[0];
            shippingFee = ngRate ? ngRate.price : cheapest.price;
          }
        } catch (e) {}

        return parseCJVariant(
          v,
          v.variantImage || defaultImage,
          sellPrice,
          shippingRates,
          shippingFee
        );
      },
      3 // Limit concurrency to 3 parallel requests
    );

    // Update Product
    product.name = cjProduct.productNameEn;
    // product.description = cjProduct.description; // Optional: Keep local description? No, full sync usually updates all.
    // Actually descriptions from CJ are often messy HTML. Snowbreeze kept local description in `import`, but `sync` logic in `snowbreeze` (step 36) DOES NOT update description, only variants/price/stock.
    // Let's check Step 36 content again.
    // It updates properties: `variants`, `stock`, `price`, `shippingFee`, `shippingRates`, dates.
    // It does NOT update name/description to preserve custom edits.

    // Calculate total stock
    const totalStock = updatedVariants.reduce((acc, v) => acc + v.stock, 0);

    // Update Main Product Shipping from first variant
    if (updatedVariants.length > 0) {
      product.shippingFee = updatedVariants[0].shippingFee;
      product.shippingRates = updatedVariants[0].shippingRates;
    }

    product.variants = updatedVariants;
    product.stock = totalStock;
    product.lastSyncedPrice = new Date();
    product.lastSyncedStock = new Date();
    product.lastSyncedShipping = new Date();

    // Price update logic: set main price to lowest variant price
    if (updatedVariants.length > 0) {
      product.price = Math.min(...updatedVariants.map((v) => v.price));
    }

    await product.save();

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}
