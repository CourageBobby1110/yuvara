import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import axios from "axios";
import mongoose from "mongoose";
import { getValidCJAccessToken } from "@/lib/cj-auth";
import {
  parseCJVariant,
  fetchVariantStock,
  fetchVariantShipping,
} from "@/lib/cj-utils";

// --- Helper Functions ---

function slugify(text: string) {
  const slug = text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return slug || "";
}

const TARGET_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

async function fetchShippingRates(accessToken: string, vid: string) {
  if (!vid) return [];

  const rates = [];

  for (const country of TARGET_COUNTRIES) {
    try {
      const res = await axios.post(
        `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
        {
          startCountryCode: "CN",
          endCountryCode: country.code,
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
        rates.push({
          countryCode: country.code,
          countryName: country.name,
          price: parseFloat(cheapest.logisticPrice),
          method: cheapest.logisticName,
          deliveryTime: cheapest.logisticAging,
        });
      }
    } catch (error) {
      console.error(`Error fetching shipping for ${country.name}:`, error);
    }
  }
  return rates;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const body = await req.json();
    const { pid } = body;

    if (!pid) {
      return NextResponse.json(
        { error: "Missing required Product ID (pid)" },
        { status: 400 }
      );
    }

    const accessToken = await getValidCJAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get CJ Access Token" },
        { status: 500 }
      );
    }

    // Check if product already exists by PID
    const existingProduct = await Product.findOne({ cjPid: pid });
    if (existingProduct) {
      return NextResponse.json(
        { error: "Product already imported." },
        { status: 409 }
      );
    }

    // Fetch Product Details from CJ
    let productData;
    try {
      const response = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`,
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

    // Extract Data
    let cost = parseFloat(productData.sellPrice);
    if (isNaN(cost) || cost <= 0) {
      // Try to calculate from variants
      if (productData.variants && productData.variants.length > 0) {
        const prices = productData.variants
          .map((v: any) =>
            parseFloat(
              v.variantSellPrice ||
                v.productPrice ||
                v.sellPrice ||
                v.variantPrice
            )
          )
          .filter((p: number) => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          // Use average for base cost, or min? Let's use min to be safe for "starting at"
          cost = Math.min(...prices);
        }
      }
    }
    const price = cost * 1.5; // Default markup

    // Parse Images
    let images: string[] = [];
    if (Array.isArray(productData.productImage)) {
      images = productData.productImage;
    } else if (typeof productData.productImage === "string") {
      try {
        // Try parsing if it's a JSON string
        const parsed = JSON.parse(productData.productImage);
        if (Array.isArray(parsed)) images = parsed;
        else images = [productData.productImage];
      } catch (e) {
        images = [productData.productImage];
      }
    }

    const firstVariant = productData.variants?.[0];
    const vid = firstVariant ? firstVariant.vid : null;

    // Fetch shipping rates for all target countries
    const shippingRates = await fetchShippingRates(accessToken, vid);

    // Fallback: Use Nigeria's rate as the default "shippingFee" for backward compatibility
    const nigeriaRate = shippingRates.find((r) => r.countryCode === "NG");
    const shippingFee = nigeriaRate ? nigeriaRate.price : 0;

    // Variants
    const variants = [];
    for (const v of productData.variants || []) {
      // Fetch real-time stock
      const fetchedStock = await fetchVariantStock(
        accessToken,
        v.vid,
        v.variantSku || v.productSku
      );
      // Fetch multi-country shipping
      const targetCountries = ["NG", "US", "GB", "CA", "AU"];
      const shippingFees = [];
      let variantShippingNG = 0;

      for (const country of targetCountries) {
        const fee = await fetchVariantShipping(accessToken, v.vid, country);
        if (fee > 0) {
          shippingFees.push({ countryCode: country, fee });
        }
        if (country === "NG") variantShippingNG = fee;
      }

      // Inject realStock into the raw variant data so parseCJVariant picks it up
      const variantWithStock = {
        ...v,
        realStock: fetchedStock !== null ? fetchedStock : v.productNumber || 0,
      };
      variants.push(
        parseCJVariant(
          variantWithStock,
          images[0] || "",
          cost,
          variantShippingNG,
          shippingFees
        )
      );
    }

    // Extract sizes and colors
    const sizes = [
      ...new Set(variants.map((v: any) => v.size).filter((s: any) => s)),
    ];
    const colors = [
      ...new Set(
        variants.map((v: any) => v.color).filter((c: any) => c !== "Default")
      ),
    ];

    // Slug
    let slug = slugify(
      productData.productNameEn || productData.productName || ""
    );
    if (!slug || slug.length < 3) {
      slug = `cj-product-${pid}`;
    }

    // Check for existing slug
    let uniqueSlug = slug;
    let counter = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Create Product
    const newProduct = await Product.create({
      name: productData.productNameEn || productData.productName,
      slug: uniqueSlug,
      description: productData.description || productData.productName, // Allow HTML
      price: price,
      images: images,
      category: productData.categoryName || "Uncategorized",
      stock: variants.reduce((acc: number, v: any) => acc + v.stock, 0),
      shippingFee: shippingFee,
      shippingRates: shippingRates,
      isFeatured: false,
      sizes: sizes as string[],
      colors: colors as string[],
      variants: variants,
      cjPid: pid,
      productUrl: `https://cjdropshipping.com/product/${slugify(
        productData.productNameEn
      )}-p-${pid}.html`,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("CJ Import Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to import product" },
      { status: 500 }
    );
  }
}
