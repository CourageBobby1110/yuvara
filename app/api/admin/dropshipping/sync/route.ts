import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import axios from "axios";
import mongoose from "mongoose";
import { getValidCJAccessToken } from "@/lib/cj-auth";

// --- Helper Functions ---

function parseCJVariant(v: any, defaultImage: string, basePrice: number) {
  let variantCost = parseFloat(v.productPrice);
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
    price: variantCost * 1.5,
    stock: v.realStock !== undefined ? v.realStock : v.productNumber || 0,
    size: size,
    cjVid: v.vid,
    cjSku: v.productSku,
  };
}

async function fetchShippingToNigeria(accessToken: string, vid: string) {
  if (!vid) return 0;

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
      // Sort by price (cheapest first)
      options.sort(
        (a: any, b: any) =>
          parseFloat(a.logisticPrice) - parseFloat(b.logisticPrice)
      );
      const cheapest = options[0];
      return parseFloat(cheapest.logisticPrice);
    }
  } catch (e) {
    console.error("Shipping calculation failed:", e);
  }
  return 0;
}

async function fetchVariantStock(
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

// --- Main Handler ---

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();

    // If productId is provided, sync single product. Otherwise sync all (optional feature, but let's stick to single for safety first)
    // Actually, the UI usually sends productId. If not, we could iterate all.
    // Let's support single sync for now as it's safer.

    if (!productId) {
      // Optional: Implement bulk sync if needed, but for now return error to be safe
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

    if (!product.cjPid) {
      return NextResponse.json(
        { error: "This product is not linked to CJ Dropshipping" },
        { status: 400 }
      );
    }

    const accessToken = await getValidCJAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "CJ Dropshipping not connected. Please go to Settings." },
        { status: 400 }
      );
    }

    // Mock Sync
    if (accessToken === "mock") {
      return NextResponse.json({
        success: true,
        message: "Mock sync successful",
      });
    }

    // 1. Fetch Latest Data
    let productData;
    try {
      const response = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );

      if (response.data && response.data.result && response.data.data) {
        productData = response.data.data;
        try {
          const fs = require("fs");
          const path = require("path");
          fs.writeFileSync(
            path.join(process.cwd(), "cj_debug_log.json"),
            JSON.stringify(productData, null, 2)
          );
        } catch (e) {
          console.error("Failed to write debug log", e);
        }

        // Fetch Stock for all variants (Sequentially)
        const variantsWithStock = [];
        for (const v of productData.variants || []) {
          const fetchedStock = await fetchVariantStock(
            accessToken,
            v.vid,
            v.variantSku || v.productSku
          );
          const finalStock =
            fetchedStock !== null ? fetchedStock : v.productNumber || 0;
          variantsWithStock.push({ ...v, realStock: finalStock });
        }
        productData.variants = variantsWithStock;
      } else {
        throw new Error("Product not found on CJ");
      }
    } catch (apiError: any) {
      throw new Error("Failed to fetch product from CJ: " + apiError.message);
    }

    // 2. Update Product
    // We mainly want to sync Price and Stock
    let cost = parseFloat(productData.sellPrice);
    if (isNaN(cost) || cost <= 0) {
      // Try to calculate from variants
      if (productData.variants && productData.variants.length > 0) {
        const prices = productData.variants
          .map((v: any) => parseFloat(v.productPrice))
          .filter((p: number) => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          cost =
            prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        }
      }
    }
    const newPrice = cost * 1.5;

    // Update Variants
    const newVariants = (productData.variants || []).map((v: any) =>
      parseCJVariant(v, product.images[0], cost)
    );

    // Update top-level sizes/colors
    const sizes = [
      ...new Set(newVariants.map((v: any) => v.size).filter((s: any) => s)),
    ];
    const colors = [
      ...new Set(
        newVariants.map((v: any) => v.color).filter((c: any) => c !== "Default")
      ),
    ];

    // Calculate Shipping Fee
    const firstVariant = productData.variants?.[0];
    const vid = firstVariant ? firstVariant.vid : null;
    const shippingFee = await fetchShippingToNigeria(accessToken, vid);

    product.price = newPrice;
    product.stock = newVariants.reduce(
      (acc: number, v: any) => acc + v.stock,
      0
    );
    product.shippingFee = shippingFee;
    product.variants = newVariants;
    product.sizes = sizes;
    product.colors = colors;

    await product.save();

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("CJ Sync Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to sync product" },
      { status: 500 }
    );
  }
}
