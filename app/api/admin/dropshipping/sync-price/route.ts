import { NextResponse } from "next/server";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";
import axios from "axios";

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

    // 1. Fetch Latest Variant Info (Prices)
    const productRes = await axios.get(
      `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
      { headers: { "CJ-Access-Token": accessToken } }
    );

    if (
      !productRes.data?.result ||
      !productRes.data?.data?.variants ||
      productRes.data.data.variants.length === 0
    ) {
      throw new Error("Failed to fetch product variants from CJ");
    }

    const cjVariants = productRes.data.data.variants;
    let localVariants = [...(product.variants || [])];
    let priceUpdated = false;

    // Map through local variants and update prices
    localVariants = localVariants.map((localV) => {
      const remoteV = cjVariants.find((rv: any) => rv.vid === localV.cjVid);
      if (remoteV) {
        const newCost =
          parseFloat(remoteV.sellPrice) || parseFloat(remoteV.productPrice);
        if (newCost > 0) {
          localV.price = newCost * 1.5; // Maintain markup
        }
      }
      return localV;
    });

    // Update main product price (using lowest variant price)
    if (localVariants.length > 0) {
      const minPrice = Math.min(...localVariants.map((v) => v.price));
      product.price = minPrice;
    }

    product.variants = localVariants;
    product.lastSyncedPrice = new Date();
    await product.save();

    return NextResponse.json({
      success: true,
      message: "Prices synced successfully",
    });
  } catch (error: any) {
    console.error("Sync Price Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync price" },
      { status: 500 }
    );
  }
}
