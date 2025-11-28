import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import { auth } from "@/auth";

// Helper to detect platform
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("aliexpress")) return "AliExpress";
  if (urlLower.includes("amazon")) return "Amazon";
  if (urlLower.includes("jumia")) return "Jumia";
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
        {
          error: "Invalid URL. Please provide a valid category or search URL.",
        },
        { status: 400 }
      );
    }

    const platform = detectPlatform(url);
    console.log(
      `🔍 Bulk Scraper: Detected platform ${platform} for URL: ${url}`
    );

    // ScraperAPI integration (optional but recommended)
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    let fetchUrl = url;
    let headers: any = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    if (scraperApiKey) {
      const scraperParams = new URLSearchParams({
        api_key: scraperApiKey,
        url: url,
        render: "true", // Often needed for listing pages
        country_code: "us",
      });
      fetchUrl = `http://api.scraperapi.com?${scraperParams.toString()}`;
      console.log("✓ Using ScraperAPI");
    }

    const response = await axios.get(fetchUrl, {
      headers,
      timeout: 60000,
    });

    const $ = cheerio.load(response.data);
    let products: any[] = [];

    if (platform === "Jumia") {
      // Jumia Listing Selectors
      $("article.prd._fb").each((_, el) => {
        const link = $(el).find("a.core").attr("href");
        const img =
          $(el).find("img.img").attr("data-src") ||
          $(el).find("img.img").attr("src");
        const title = $(el).find("h3.name").text().trim();
        const priceText = $(el).find(".prc").text().trim();

        if (link && title) {
          const fullLink = link.startsWith("http")
            ? link
            : `https://www.jumia.com.ng${link}`;
          products.push({
            title,
            image: img,
            price: priceText,
            url: fullLink,
            platform: "Jumia",
          });
        }
      });
    } else if (platform === "Amazon") {
      // Amazon Listing Selectors
      $('[data-component-type="s-search-result"]').each((_, el) => {
        const link = $(el).find("h2 a.a-link-normal").attr("href");
        const img = $(el).find("img.s-image").attr("src");
        const title = $(el).find("h2 span").text().trim();
        const priceWhole = $(el).find(".a-price-whole").text().trim();
        const priceFraction = $(el).find(".a-price-fraction").text().trim();

        if (link && title) {
          const fullLink = link.startsWith("http")
            ? link
            : `https://www.amazon.com${link}`;
          products.push({
            title,
            image: img,
            price: priceWhole ? `${priceWhole}.${priceFraction}` : "N/A",
            url: fullLink,
            platform: "Amazon",
          });
        }
      });
    } else if (platform === "AliExpress") {
      // AliExpress is tricky with static scraping. We'll try a generic approach for now.
      // Often they use JSON embedded in scripts.
      // This is a best-effort attempt for list pages.
      // Try finding product cards
      $("a[href*='/item/']").each((_, el) => {
        const link = $(el).attr("href");
        // Try to find image and title within this anchor or parent
        const parent = $(el).closest('div[class*="product-card"]'); // Generic guess
        // Actually, AliExpress structure varies wildly.
        // Let's try to find any link that looks like a product and has an image inside.
        const img = $(el).find("img").attr("src");
        const title =
          $(el).text().trim() || $(el).find("h1, h2, h3, .title").text().trim();

        if (link && link.includes("/item/") && img) {
          const fullLink = link.startsWith("//")
            ? `https:${link}`
            : link.startsWith("http")
            ? link
            : `https://www.aliexpress.com${link}`;
          products.push({
            title: title.substring(0, 50) + "...", // Truncate as it might be messy
            image: img.startsWith("//") ? `https:${img}` : img,
            price: "Check Details",
            url: fullLink,
            platform: "AliExpress",
          });
        }
      });

      // Deduplicate AliExpress results as the same link might appear multiple times
      products = products.filter(
        (v, i, a) => a.findIndex((t) => t.url === v.url) === i
      );
    }

    // Limit to 50 items to avoid overwhelming the client
    products = products.slice(0, 50);

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("Bulk Scraper Error:", error.message);
    return NextResponse.json(
      { error: "Failed to scrape listings. " + error.message },
      { status: 500 }
    );
  }
}
