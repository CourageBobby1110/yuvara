import { NextResponse } from "next/server";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import axios from "axios";
import { mapConcurrent } from "@/lib/cj-utils";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchVariantStock(
  accessToken: string,
  vid: string,
  sku?: string
) {
  // Try queryByVid first
  try {
    const res = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${vid}`,
      { headers: { "CJ-Access-Token": accessToken } }
    );
    // API usually returns string or number in data
    if (res.data?.result) {
      const stock = parseInt(res.data.data);
      if (!isNaN(stock)) return stock;
    }
  } catch (e) {
    // failed
  }

  // Fallback: queryBySku if available
  if (sku) {
    try {
      const res = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=${sku}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );
      if (res.data?.result) {
        const stock = parseInt(res.data.data);
        if (!isNaN(stock)) return stock;
      }
    } catch (e) {
      // failed
    }
  }

  throw new Error("Stock fetch failed");
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
        { error: "Product not found or not linked to CJ" },
        { status: 404 }
      );
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      throw new Error("Failed to authenticate with CJ");
    }

    const variants = product.variants || [];

    const updatedVariants = await mapConcurrent(
      variants,
      async (variant: any) => {
        if (!variant.cjVid) return variant;

        let retries = 3;
        while (retries > 0) {
          try {
            const stock = await fetchVariantStock(
              accessToken,
              variant.cjVid,
              variant.cjSku
            );
            variant.stock = stock;
            break;
          } catch (e) {
            retries--;
            if (retries === 0)
              console.error(`Stock sync failed for ${variant.cjVid}`);
            await delay(500);
          }
        }
        return variant;
      },
      5 // Higher concurrency for stock as it's lighter
    );

    // Update total product stock
    const totalStock = updatedVariants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
    product.stock = totalStock;
    product.variants = updatedVariants;
    product.lastSyncedStock = new Date();

    await product.save();

    return NextResponse.json({
      success: true,
      message: "Stock synced successfully",
    });
  } catch (error: any) {
    console.error("Sync Stock Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync stock" },
      { status: 500 }
    );
  }
}
