import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || !url.includes("aliexpress")) {
      return NextResponse.json(
        { error: "Invalid AliExpress URL" },
        { status: 400 }
      );
    }

    // Headers to mimic a real browser
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.aliexpress.com/",
    };

    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = cheerio.load(html);

    let title = "";
    let description = "";
    let price = 0;
    let images: string[] = [];
    let shippingFee = 0;

    // --- STRATEGY 1: Meta Tags (Most reliable for Title/Image) ---
    title =
      $("meta[property='og:title']").attr("content") || $("title").text() || "";
    const ogImage = $("meta[property='og:image']").attr("content");
    if (ogImage) images.push(ogImage);

    // --- STRATEGY 2: JSON Data Extraction (The Gold Mine) ---
    // AliExpress stores data in scripts like window.runParams = { ... }
    const scripts = $("script").toArray();
    let runParams: any = null;

    for (const script of scripts) {
      const content = $(script).html() || "";

      // Look for window.runParams or window._init_data_
      if (
        content.includes("window.runParams") ||
        content.includes("window._init_data_")
      ) {
        try {
          // Extract the JSON object
          const match =
            content.match(/window\.runParams\s*=\s*(\{.*?\});/s) ||
            content.match(/window\._init_data_\s*=\s*(\{.*?\});/s) ||
            content.match(/data:\s*(\{.*?\})/s);

          if (match && match[1]) {
            const jsonStr = match[1];
            runParams = JSON.parse(jsonStr);
            // If we found valid data with imageModule, stop searching
            if (
              runParams.data?.imageModule ||
              runParams.imageModule ||
              runParams.data?.skuModule ||
              runParams.skuModule
            ) {
              break;
            }
          }
        } catch (e) {
          console.log("Failed to parse runParams script", e);
        }
      }
    }

    let variants: any[] = [];
    let options: any[] = [];

    if (runParams) {
      const data = runParams.data || runParams;

      // 1. Images
      if (data.imageModule && data.imageModule.imagePathList) {
        data.imageModule.imagePathList.forEach((img: string) => {
          if (!images.includes(img)) images.push(img);
        });
      }

      // 2. Price
      if (data.priceModule) {
        const priceInfo =
          data.priceModule.formatedActivityPrice ||
          data.priceModule.formatedPrice ||
          data.priceModule.minActivityAmount?.value ||
          data.priceModule.minAmount?.value;

        if (priceInfo) {
          if (typeof priceInfo === "string") {
            const match = priceInfo.match(/[\d\.]+/);
            if (match) price = parseFloat(match[0]);
          } else if (typeof priceInfo === "number") {
            price = priceInfo;
          }
        }
      }

      // 3. Shipping
      if (data.shippingModule && data.shippingModule.generalFreightInfo) {
        const freight =
          data.shippingModule.generalFreightInfo.originalLayoutResultList?.[0]
            ?.bizData?.displayAmount;
        if (freight) {
          if (freight.toLowerCase().includes("free")) {
            shippingFee = 0;
          } else {
            const match = freight.match(/[\d\.]+/);
            if (match) shippingFee = parseFloat(match[0]);
          }
        }
      }

      // 4. Title Fallback
      if (!title && data.titleModule) {
        title = data.titleModule.subject;
      }

      // 5. Variants (SKU Module)
      if (data.skuModule) {
        // Extract Options (e.g. Color, Size)
        if (data.skuModule.productSKUPropertyList) {
          options = data.skuModule.productSKUPropertyList.map((prop: any) => ({
            name: prop.skuPropertyName,
            values: prop.skuPropertyValues.map(
              (val: any) =>
                val.propertyValueDisplayName || val.propertyValueName
            ),
          }));
        }

        // Extract Variants (Combinations)
        // We'll simplify this to just get a list of available options for now
        // A full variant mapping requires matching skuPropIds, which is complex.
        // For importing, just knowing the available options is a good start.
      }
    }

    // --- STRATEGY 3: DOM Fallbacks (If JSON failed) ---

    // Price Fallback
    if (price === 0) {
      const priceText =
        $(".product-price-current").text().trim() ||
        $(".uniform-banner-box-price").text().trim() ||
        $(".price--current--I3Yb7_i").text().trim(); // New class
      if (priceText) {
        const match = priceText.match(/[\d\.]+/);
        if (match) price = parseFloat(match[0]);
      }
    }

    // Image Fallback
    if (images.length <= 1) {
      $(".img-thumb-item img").each((_, el) => {
        let src = $(el).attr("src");
        if (src) {
          src = src
            .replace(/_50x50\.jpg.*$/, "")
            .replace(/_640x640\.jpg.*$/, "");
          if (!images.includes(src)) images.push(src);
        }
      });
    }

    description = title; // Default description

    return NextResponse.json({
      title,
      description,
      price,
      images,
      shippingFee,
      options,
      originalUrl: url,
    });
  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details. Please check the URL." },
      { status: 500 }
    );
  }
}
