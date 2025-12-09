import { NextResponse } from "next/server";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import {
  parseCJVariant,
  slugify,
  fetchShippingRates,
  TARGET_COUNTRIES,
  mapConcurrent,
} from "@/lib/cj-utils";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import axios from "axios";

// Helper to fetch valid stock for a variant (used during import if needed)
async function fetchVariantStock(
  accessToken: string,
  vid: string,
  sku: string
) {
  try {
    const res = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${vid}`,
      { headers: { "CJ-Access-Token": accessToken } }
    );
    if (res.data?.result) {
      // API returns just the stock count directly in data sometimes or an object
      // Based on docs: header: { code, result, message }, body: string (json string)
      // Actually standard response is data: number or string
      // Let's assume it returns a number directly as per documentation usually `data: 100`
      // Wait, standard response is { code: 200, result: true, message: "Success", data: "100" } or similar.
      const stock = parseInt(res.data.data);
      return isNaN(stock) ? 0 : stock;
    }
  } catch (err) {
    // console.error(`Stock fetch failed for ${vid}:`, err);
  }
  return 0;
}

export async function POST(req: Request) {
  try {
    const { pid } = await req.json();
    if (!pid) {
      return NextResponse.json(
        { error: "Product ID (PID) is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check availability
    const existing = await Product.findOne({ cjPid: pid });
    if (existing) {
      return NextResponse.json(
        { error: "Product already imported" },
        { status: 409 } // Conflict
      );
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with CJ Dropshipping" },
        { status: 500 }
      );
    }

    // Fetch Product Details
    const res = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`,
      { headers: { "CJ-Access-Token": accessToken } }
    );

    if (!res.data?.result || !res.data?.data) {
      return NextResponse.json(
        { error: "Product not found on CJ" },
        { status: 404 }
      );
    }

    const cjProduct = res.data.data;

    // Parse Images
    const images = cjProduct.productImage
      ? cjProduct.productImage.split(",")
      : [];
    if (cjProduct.productImageSet && cjProduct.productImageSet.length > 0) {
      images.push(...cjProduct.productImageSet);
    }

    // Deduplicate images
    const uniqueImages = Array.from(new Set(images)) as string[];

    // Calculate Default Price
    const entryPrice =
      parseFloat(cjProduct.sellPrice) || parseFloat(cjProduct.productPrice);
    const markupPrice = entryPrice * 1.5;

    // Process Variants
    // Note: During import, we might skip detailed shipping/stock fetch to be fast,
    // or we can do it. Given the "Sync" requirement implies we want accuracy, let's do basic parsing.
    // However, the `sync` logic handles the heavy lifting.
    // For import, we will trust the `cjProduct.variants` array initially.

    const variants = cjProduct.variants.map((v: any) =>
      parseCJVariant(v, uniqueImages[0], entryPrice)
    );

    // Initial shipping fetch (Optional - can be skipped to speed up import)
    // We will do a quick check for the first variant to get a baseline shipping fee
    let defaultShippingFee = 0;
    let defaultShippingRates: any[] = [];

    if (variants.length > 0) {
      const firstVid = variants[0].cjVid;
      const rates = await fetchShippingRates(accessToken, firstVid);
      if (rates.length > 0) {
        // Find cheapest rate (priority to NG, then generic cheapest)
        const ngRate = rates.find((r) => r.countryCode === "NG");
        const cheapest = rates.sort((a, b) => a.price - b.price)[0];
        defaultShippingFee = ngRate ? ngRate.price : cheapest.price;
        defaultShippingRates = rates;
      }
    }

    // Generate unique slug
    let baseSlug = slugify(cjProduct.productNameEn);
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newProduct = new Product({
      name: cjProduct.productNameEn,
      slug: slug,
      description: cjProduct.description || cjProduct.productNameEn, // CJ description is often HTML
      price: markupPrice,
      images: uniqueImages,
      category: cjProduct.categoryName || "Uncategorized", // You might want to map these better
      stock: cjProduct.productNumber || 0, // Total stock
      shippingFee: defaultShippingFee,
      shippingRates: defaultShippingRates,
      cjPid: cjProduct.pid,
      variants: variants,
      sizes: Array.from(new Set(variants.map((v: any) => v.size))).filter(
        (s) => s
      ),
      colors: Array.from(new Set(variants.map((v: any) => v.color))).filter(
        (c) => c && c !== "Default"
      ),
      lastSyncedPrice: new Date(),
      lastSyncedStock: new Date(),
      lastSyncedShipping: new Date(),
    });

    await newProduct.save();

    return NextResponse.json({
      success: true,
      productId: newProduct._id,
      slug: newProduct.slug,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
