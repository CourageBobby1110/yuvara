import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import { auth } from "@/auth";

// Helper function to detect e-commerce platform
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("aliexpress")) return "AliExpress";
  if (urlLower.includes("amazon")) return "Amazon";
  if (urlLower.includes("jumia")) return "Jumia";
  if (urlLower.includes("ebay")) return "eBay";
  if (urlLower.includes("shopify") || urlLower.includes("myshopify"))
    return "Shopify";
  return "Unknown";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid URL. Please provide a valid product URL." },
        { status: 400 }
      );
    }

    // Detect platform
    const platform = detectPlatform(url);
    console.log(`🔍 Detected platform: ${platform}`);

    // ScraperAPI integration with optimized parameters
    const scraperApiKey = process.env.SCRAPER_API_KEY;

    let fetchUrl: string;
    let headers: any;

    if (scraperApiKey) {
      // Use ScraperAPI with optimized settings
      const scraperParams = new URLSearchParams({
        api_key: scraperApiKey,
        url: url,
        render: "true",
        country_code: "us",
      });

      fetchUrl = `http://api.scraperapi.com?${scraperParams.toString()}`;
      headers = {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      };
      console.log("✓ Using ScraperAPI for:", url);
    } else {
      fetchUrl = url;
      headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: url,
      };
      console.warn("⚠ SCRAPER_API_KEY not found. Using direct scraping.");
    }

    console.log("⏳ Fetching product data...");
    const response = await axios.get(fetchUrl, {
      headers,
      timeout: 60000,
      maxRedirects: 5,
    });
    console.log("✓ Product data fetched");

    const html = response.data;
    const $ = cheerio.load(html);

    let title = "";
    let description = "";
    let price = 0;
    let images: string[] = [];
    let shippingFee = 0;
    let options: any[] = [];

    // Universal extraction from meta tags
    title =
      $("meta[property='og:title']").attr("content") ||
      $("title").text().trim();
    const ogImage = $("meta[property='og:image']").attr("content");
    if (ogImage)
      images.push(ogImage.startsWith("//") ? `https:${ogImage}` : ogImage);

    // Platform-specific extraction
    if (platform === "Amazon") {
      if (!title) title = $("#productTitle").text().trim();
      if (price === 0) {
        const priceWhole = $(".a-price-whole")
          .first()
          .text()
          .replace(/[^0-9]/g, "");
        const priceFraction = $(".a-price-fraction").first().text();
        if (priceWhole)
          price = parseFloat(priceWhole + "." + (priceFraction || "00"));
      }
      $("#altImages img, #imageBlock img").each((_, el) => {
        const src = $(el)
          .attr("src")
          ?.replace(/_.*\.jpg/, ".jpg");
        if (src && src.startsWith("http")) images.push(src);
      });
    } else if (platform === "Jumia") {
      if (!title) title = $("h1.-fs20, h1.title").text().trim();
      if (price === 0) {
        const priceText = $(".-b.-ltr.-tal.-fs24, .price").text().trim();
        const match = priceText.match(/[\d,]+/);
        if (match) price = parseFloat(match[0].replace(/,/g, ""));
      }
      $(".itm img, .sldr img").each((_, el) => {
        const src = $(el).attr("data-src") || $(el).attr("src");
        if (src && src.startsWith("http")) images.push(src);
      });
    } else if (platform === "AliExpress") {
      // Try to extract from embedded JSON
      const scripts = $("script").toArray();
      for (const script of scripts) {
        const content = $(script).html() || "";
        if (
          content.includes("window.runParams") ||
          content.includes("window._init_data_")
        ) {
          try {
            const match =
              content.match(/window\.runParams\s*=\s*({.+?});/s) ||
              content.match(/window\._init_data_\s*=\s*({.+?});/s);
            if (match && match[1]) {
              const data = JSON.parse(match[1]);
              const productData = data.data || data;

              if (productData.titleModule?.subject)
                title = productData.titleModule.subject;
              if (productData.imageModule?.imagePathList) {
                images = productData.imageModule.imagePathList.map(
                  (img: string) => (img.startsWith("//") ? `https:${img}` : img)
                );
              }
              if (productData.priceModule) {
                const priceValue =
                  productData.priceModule.minActivityAmount?.value ||
                  productData.priceModule.minAmount?.value;
                if (priceValue) price = parseFloat(priceValue);
              }
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    // Generic fallbacks for all platforms
    if (!title) {
      title = $("h1").first().text().trim() || $("title").text().trim();
    }

    if (price === 0) {
      const priceSelectors = [".price", "[class*='price']", "[data-price]"];
      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim();
        const match = priceText.match(/[\d,.]+/);
        if (match) {
          price = parseFloat(match[0].replace(/,/g, ""));
          if (price > 0) break;
        }
      }
    }

    if (images.length === 0) {
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (
          src &&
          src.includes("http") &&
          !src.includes("icon") &&
          !src.includes("logo")
        ) {
          const fullSrc = src.startsWith("//") ? `https:${src}` : src;
          images.push(fullSrc);
        }
      });
    }

    if (!description) description = title;

    // Validation
    if (!title || title.length < 3) {
      return NextResponse.json(
        {
          error: `Could not extract product data from ${platform}. Try using ScraperAPI for better results.`,
        },
        { status: 500 }
      );
    }

    images = Array.from(new Set(images))
      .filter(
        (img) => img && img.startsWith("http") && !img.includes("placeholder")
      )
      .slice(0, 10);

    console.log(`✓ Imported from ${platform}:`, title);

    // ===== VARIANT EXTRACTION =====
    let sizes: string[] = [];
    let colors: string[] = [];
    let variants: any[] = [];

    // Map from existing 'options' (AliExpress & Generic)
    if (options.length > 0) {
      options.forEach((opt) => {
        const name = opt.name.toLowerCase();
        if (name.includes("size") || name.includes("dimension")) {
          sizes.push(...opt.values);
        } else if (
          name.includes("color") ||
          name.includes("colour") ||
          name.includes("style")
        ) {
          colors.push(...opt.values);
        }
      });
    }

    // Amazon Variants
    if (platform === "Amazon") {
      // Extract sizes
      $("#variation_size_name li, #variation_size_name option").each(
        (_, el) => {
          const val =
            $(el).text().trim() ||
            $(el).attr("title") ||
            $(el).attr("data-default-header");
          if (val && !val.includes("Select")) sizes.push(val);
        }
      );

      // Extract colors
      $("#variation_color_name li img").each((_, el) => {
        const alt = $(el).attr("alt");
        if (alt) colors.push(alt);
      });
    }

    // Jumia Variants
    if (platform === "Jumia") {
      // Try to find size selection
      $(".-pvxs").each((_, el) => {
        const label = $(el).find(".-m.-pbs").text().toLowerCase();
        if (label.includes("size")) {
          $(el)
            .find("input[type='radio'] + label")
            .each((_, opt) => {
              sizes.push($(opt).text().trim());
            });
          // Also check dropdowns
          $(el)
            .find("option")
            .each((_, opt) => {
              const val = $(opt).text().trim();
              if (val && !val.includes("Select")) sizes.push(val);
            });
        }
      });
    }

    // Generic / Schema.org Fallback
    if (sizes.length === 0) {
      // Try to find "Size" dropdowns
      $("select").each((_, el) => {
        const label =
          $(el).attr("aria-label") ||
          $(el).attr("name") ||
          $(el).prev("label").text() ||
          "";
        if (label.toLowerCase().includes("size")) {
          $(el)
            .find("option")
            .each((_, opt) => {
              const val = $(opt).text().trim();
              if (val && !val.includes("Select")) sizes.push(val);
            });
        }
      });
    }

    // Clean up
    sizes = Array.from(new Set(sizes)).filter((s) => s.length < 20);
    colors = Array.from(new Set(colors)).filter((c) => c.length < 30);

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      price: Math.max(0, price),
      images,
      shippingFee: Math.max(0, shippingFee),
      options,
      sizes,
      colors,
      variants,
      originalUrl: url,
      platform,
    });
  } catch (error: any) {
    console.error("❌ Scraping error:", error.message);

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return NextResponse.json(
        {
          error:
            "Request timed out. Please try again or add SCRAPER_API_KEY to your .env file.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch product. Please check the URL and try again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
