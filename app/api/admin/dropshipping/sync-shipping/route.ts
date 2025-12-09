import { NextResponse } from "next/server";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import { fetchShippingRates, mapConcurrent } from "@/lib/cj-utils";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        { error: "Product not found or not linked to CJ" },
        { status: 404 }
      );
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      throw new Error("Failed to authenticate with CJ");
    }

    const variants = product.variants || [];

    // Rate limit friendly fetch logic
    // We only need to fetch shipping for unique variant combinations if possible,
    // but usually fetch fetching by VID is standard. To optimize, we assume variants with same VID have same shipping (which they do).
    // Actually, variants usually have unique VIDs.

    // Use mapConcurrent but with a small delay between batches if needed to be extra safe
    // but mapConcurrent already limits concurrency.
    // Let's add a random delay inside the fetcher in fetchShippingRates is handled by mapConcurrent?
    // No, fetchShippingRates calls mapConcurrent for COUNTRIES.
    // Here we need to call fetchShippingRates for VARIANTS.

    const updatedVariants = await mapConcurrent(
      variants,
      async (variant: any) => {
        if (!variant.cjVid) return variant;

        // Add robust retry mechanism specifically for this route
        let retries = 3;
        while (retries > 0) {
          try {
            const rates = await fetchShippingRates(accessToken, variant.cjVid);

            if (rates && rates.length > 0) {
              const ngRate = rates.find((r) => r.countryCode === "NG");
              const cheapest = [...rates].sort((a, b) => a.price - b.price)[0];

              variant.shippingRates = rates;
              variant.shippingFee = ngRate ? ngRate.price : cheapest.price;
            }
            break; // Success
          } catch (e) {
            retries--;
            if (retries === 0)
              console.error(`Failed shipping sync for ${variant.cjVid}`);
            await delay(1000); // Wait 1s before retry
          }
        }
        return variant;
      },
      3 // Limit variant concurrency to 3
    );

    // Update main product shipping fee based on first variant
    if (updatedVariants.length > 0) {
      const first = updatedVariants[0];
      product.shippingFee = first.shippingFee;
      product.shippingRates = first.shippingRates;
    }

    product.variants = updatedVariants;
    product.lastSyncedShipping = new Date();
    await product.save();

    return NextResponse.json({
      success: true,
      message: "Shipping rates synced successfully",
    });
  } catch (error: any) {
    console.error("Sync Shipping Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync shipping" },
      { status: 500 }
    );
  }
}
