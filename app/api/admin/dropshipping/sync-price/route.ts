import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Product from "@/models/Product";
import axios from "axios";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import dbConnect from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.cjPid) {
      return NextResponse.json(
        { error: "Product is not linked to CJ (missing cjPid)" },
        { status: 400 }
      );
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "CJ Dropshipping not connected" },
        { status: 400 }
      );
    }

    // Fetch latest product details from CJ
    let productData;
    try {
      const response = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );

      if (response.data && response.data.result && response.data.data) {
        productData = response.data.data;
      } else {
        return NextResponse.json(
          { error: "Product not found on CJ" },
          { status: 404 }
        );
      }
    } catch (apiError: any) {
      console.error("CJ API Error:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch product details from CJ" },
        { status: 502 }
      );
    }

    // Attempt to fetch detailed variants (Deep Fetch) to ensure we get pricing
    let detailedVariants = [];
    try {
      const vRes = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/variant/queryByPid?pid=${product.cjPid}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );
      if (vRes.data?.result && vRes.data?.data) {
        detailedVariants = Array.isArray(vRes.data.data) ? vRes.data.data : [];
        console.log(
          `[SyncPrice] Fetched ${detailedVariants.length} detailed variants.`
        );
      }
    } catch (e) {
      console.warn(
        "[SyncPrice] Deep variant fetch failed, relying on primary data."
      );
    }

    // Merge or prioritize detailed variants
    const cjVariants =
      detailedVariants.length > 0
        ? detailedVariants
        : productData.variants || [];

    // DEBUG: Write CJ Variants to file for inspection
    try {
      const fs = require("fs");
      const path = require("path");
      fs.writeFileSync(
        path.join(process.cwd(), "cj_variants_debug.json"),
        JSON.stringify(cjVariants, null, 2)
      );
    } catch (e) {
      console.error("Failed to write debug file", e);
    }

    // Convert variants to POJOs
    const variants = JSON.parse(JSON.stringify(product.variants || []));
    const updatedVariants = [];
    let processedCount = 0;

    // Check if we are doing a single variant sync
    const { targetVid } = await req.json().catch(() => ({}));

    // Debug Logs for ID Matching
    console.log(
      `[SyncPrice] Local Variants IDs: ${variants
        .map((v: any) => v.cjVid)
        .join(", ")}`
    );

    if (targetVid) {
      console.log(`[SyncPrice] Target VID: ${targetVid}`);
    }

    for (const variant of variants) {
      // Logic: Update if (Global Sync) OR (Individual Sync AND match)
      const shouldUpdate =
        !targetVid || (targetVid && variant.cjVid === targetVid);

      if (shouldUpdate && variant.cjVid) {
        // Find matching variant in CJ data (CAST TO STRING TO ENSURE MATCH)
        const cjVariant = cjVariants.find(
          (v: any) => String(v.vid) === String(variant.cjVid)
        );

        if (!cjVariant) {
          console.warn(
            `[SyncPrice] No matching CJ variant found for local vid: ${variant.cjVid}.`
          );
        } else {
          console.log(
            `[SyncPrice] Matched variant ${variant.cjVid}. Cost: ${
              cjVariant.sellPrice || cjVariant.productPrice
            }`
          );
        }

        if (cjVariant) {
          // Use variantSellPrice (from deep fetch) or sellPrice (standard) or productPrice
          const cost =
            parseFloat(cjVariant.variantSellPrice) ||
            parseFloat(cjVariant.sellPrice) ||
            parseFloat(cjVariant.productPrice) ||
            0;

          if (cost > 0) {
            updatedVariants.push({
              ...variant,
              price: cost * 1.5, // verified 1.5x markup
            });
            processedCount++;
          } else {
            updatedVariants.push(variant);
          }
        } else {
          updatedVariants.push(variant);
        }
      } else {
        // Not updating this variant, preserve it
        updatedVariants.push(variant);
      }
    }

    const cleanVariants = updatedVariants;
    product.variants = cleanVariants;

    // Update main product price (use first variant's price)
    if (cleanVariants.length > 0) {
      product.price = cleanVariants[0].price;
    }

    product.lastSyncedPrice = new Date();

    product.markModified("variants");
    await product.save();

    console.log(
      `[SyncPrice] Specific prices updated for ${processedCount} variants.`
    );

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Price Sync Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to sync price" },
      { status: 500 }
    );
  }
}
