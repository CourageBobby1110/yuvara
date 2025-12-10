import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Product from "@/models/Product";
import axios from "axios";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import dbConnect from "@/lib/db";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchVariantStock(
  accessToken: string,
  vid: string,
  sku: string
) {
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
        await wait(200); // Small delay to play nice
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
            `Rate limit hit for sync stock ${strategy.name} ${
              vid || sku
            }. Retrying...`
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, targetVid } = await req.json();

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

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "CJ Dropshipping not connected" },
        { status: 400 }
      );
    }

    // Convert variants to POJOs to strictly avoid Mongoose state issues
    let variants = JSON.parse(JSON.stringify(product.variants || []));
    console.log(
      `[SyncStock] Found ${variants.length} variants for product ${productId}`
    );

    // If targetVid is provided, we only want to update that one.
    // However, to recalculate total stock accurately, we need the values of ALL variants.
    // So we will iterate all, but only FETCH and UPDATE the target one.
    // For others, we keep existing stock.

    const updatedVariants = [];
    let totalStock = 0;

    for (const variant of variants) {
      // Logic: Update if (Global Sync) OR (Individual Sync AND match)
      const shouldUpdate =
        !targetVid || (targetVid && variant.cjVid === targetVid);

      if (shouldUpdate && (variant.cjVid || variant.cjSku)) {
        console.log(
          `[SyncStock] Fetching stock for variant ${
            variant.cjVid || variant.cjSku
          }...`
        );

        const stock = await fetchVariantStock(
          accessToken,
          variant.cjVid,
          variant.cjSku
        );

        if (stock !== null) {
          console.log(`[SyncStock] Found stock ${stock} for variant`);
          updatedVariants.push({
            ...variant,
            stock: stock,
          });
          totalStock += stock;
        } else {
          console.warn(
            `[SyncStock] Could not fetch stock for variant, keeping old value.`
          );
          updatedVariants.push(variant);
          totalStock += variant.stock || 0;
        }
      } else {
        // Skip fetch, keep existing
        if (targetVid) {
          // Silent skip for non-target variants during individual sync
        } else {
          console.warn(
            `[SyncStock] Variant has no cjVid or cjSku, skipping fetch.`
          );
        }
        updatedVariants.push(variant);
        totalStock += variant.stock || 0;
      }
    }

    const cleanVariants = updatedVariants;

    product.variants = cleanVariants;
    product.stock = totalStock;
    product.lastSyncedStock = new Date();
    product.markModified("variants");
    await product.save();
    console.log(
      `[SyncStock] Product saved successfully. Total Stock: ${totalStock}`
    );

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Stock Sync Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to sync stock" },
      { status: 500 }
    );
  }
}
