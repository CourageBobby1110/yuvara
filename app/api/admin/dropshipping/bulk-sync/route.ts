import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import axios from "axios";
import mongoose from "mongoose";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import { parseCJVariant, fetchShippingRates } from "@/lib/cj-utils";

export const runtime = "nodejs";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});

    const now = new Date();
    const lastDate = settings.lastSyncDate ? new Date(settings.lastSyncDate) : new Date(0);
    if (lastDate.setHours(0, 0, 0, 0) !== now.setHours(0, 0, 0, 0)) {
       settings.productsSyncedToday = 0;
    }

    if (settings.lastSyncStatus === "Running") {
      return NextResponse.json({ error: "A sync process is already running." }, { status: 400 });
    }

    settings.lastSyncStatus = "Running";
    settings.lastSyncDate = new Date();
    await settings.save();

    runBulkSync().catch(async (e) => {
      console.error("Background sync fatal error:", e);
      await updateStatus("Error: " + e.message);
    });

    return NextResponse.json({ success: true, message: "Background sync started successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to trigger sync" }, { status: 500 });
  }
}

async function updateStatus(status: string) {
  try {
    if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI!);
    await SiteSettings.updateOne({}, { lastSyncStatus: status, lastSyncDate: new Date() });
  } catch (e) {
    console.error("Failed to update status:", e);
  }
}

async function runBulkSync() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  const accessToken = await getValidCJAccessToken();
  if (!accessToken || accessToken === "mock") {
    await updateStatus("CJ API Token Invalid or Mock");
    return;
  }

  const products = await Product.find({ 
    cjPid: { $exists: true, $ne: "" },
    $or: [{ syncCompleted: false }, { syncCompleted: { $exists: false } }]
  });

  if (products.length === 0) {
    await updateStatus("Completed (No new products)");
    return;
  }

  let settings = await SiteSettings.findOne();
  if (!settings) settings = new SiteSettings();

  for (const product of products) {
    let currentSettings = await SiteSettings.findOne();
    if (currentSettings && currentSettings.lastSyncStatus === "Stopped") {
      console.log("Bulk sync stopped manually.");
      return;
    }

    try {
      await wait(3000); 

      const response = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
        { headers: { "CJ-Access-Token": accessToken } }
      );

      if (!response.data || !response.data.data) {
        product.syncCompleted = true;
        await product.save();
        continue;
      }

      const productData = response.data.data;
      const variantsData = productData.variants || [];

      const fetchedVariantsData = [];
      for (const v of variantsData) {
        await wait(1000);
        let stockToSave = v.productNumber || 0;
        let ratesToSave = [];
        const sku = v.variantSku || v.productSku;

        try {
          let stockRes = await axios.get(
            `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=${v.vid}`,
            { headers: { "CJ-Access-Token": accessToken } }
          ).catch(() => null);

          if (!stockRes?.data?.result && sku) {
             stockRes = await axios.get(
              `https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=${sku}`,
              { headers: { "CJ-Access-Token": accessToken } }
            ).catch(() => null);
          }

          if (stockRes?.data?.result && stockRes.data.data) {
            const data = Array.isArray(stockRes.data.data) ? stockRes.data.data : [stockRes.data.data];
            stockToSave = data.reduce((acc: number, item: any) => acc + (item.totalInventoryNum || 0), 0);
          }

          await wait(1000);
          ratesToSave = await fetchShippingRates(accessToken, v.vid);
        } catch (variantFail: any) {
          if (variantFail.response?.status === 429) {
            throw variantFail; 
          }
        }

        fetchedVariantsData.push({ vid: v.vid, stock: stockToSave, shippingRates: ratesToSave });
      }

      const dataMap = new Map(fetchedVariantsData.map(i => [i.vid, i]));
      productData.variants = variantsData.map((v: any) => ({
        ...v,
        realStock: dataMap.get(v.vid)?.stock ?? v.productNumber ?? 0,
        shippingRates: dataMap.get(v.vid)?.shippingRates ?? [],
      }));

      let cost = parseFloat(productData.sellPrice);
      if (isNaN(cost) || cost <= 0) {
        if (productData.variants && productData.variants.length > 0) {
          const prices = productData.variants.map((v: any) => parseFloat(v.productPrice)).filter((p: number) => p > 0);
          if (prices.length > 0) cost = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        }
      }
      const newPrice = cost * 1.5;

      const newVariants = (productData.variants || []).map((v: any) => {
        const rates = v.shippingRates || [];
        const nigeriaRate = rates.find((r: any) => r.countryCode === "NG");
        const fee = nigeriaRate ? nigeriaRate.price : 0;
        return parseCJVariant(v, product.images[0], cost, rates, fee);
      });

      const sizes = [...new Set(newVariants.map((v: any) => v.size).filter(Boolean))];
      const colors = [...new Set(newVariants.map((v: any) => v.color).filter((c: any) => c !== "Default"))];

      let finalShippingFee = 0;
      const firstVariant = productData.variants?.[0];
      if (firstVariant && firstVariant.vid) {
         await wait(500);
         try {
           const logRes = await axios.post(
             `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
             { startCountryCode: "CN", endCountryCode: "NG", products: [{ quantity: 1, vid: firstVariant.vid }] },
             { headers: { "CJ-Access-Token": accessToken } }
           );
           if (logRes.data?.result && logRes.data.data?.length > 0) {
              const options = logRes.data.data.sort((a: any, b: any) => parseFloat(a.logisticPrice) - parseFloat(b.logisticPrice));
              finalShippingFee = parseFloat(options[0].logisticPrice);
           }
         } catch (e: any) {
           if (e.response?.status === 429) throw e;
         }
      }

      product.price = newPrice;
      product.stock = newVariants.reduce((acc: number, v: any) => acc + v.stock, 0);
      product.shippingFee = finalShippingFee;
      product.variants = newVariants;
      product.sizes = sizes as string[];
      product.colors = colors as string[];
      product.syncCompleted = true;

      await product.save();

      settings.productsSyncedToday = (settings.productsSyncedToday || 0) + 1;
      await settings.save();
    } catch (productError: any) {
      if (productError.response?.status === 429) {
        console.warn("Rate limit reached.");
        settings.lastSyncStatus = "Rate limit reached";
        await settings.save();
        return;
      }
    }
  }

  settings.lastSyncStatus = "Idle (Completed Successfully)";
  await settings.save();
}
