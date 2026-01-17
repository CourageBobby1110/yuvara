import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import axios from "axios";
import mongoose from "mongoose";
import crypto from "crypto";
import { determineCategory } from "@/lib/categories";

// Helper to slugify text
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function generateDobaSignature(
  appKey: string,
  appSecret: string,
  timestamp: string,
) {
  const str = `${appKey}${timestamp}${appSecret}`;
  return crypto.createHash("md5").update(str).digest("hex");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json(); // Doba SPU ID

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const settings = await SiteSettings.findOne().sort({ createdAt: -1 });
    const appKey = settings?.dobaAppKey;
    const appSecret = settings?.dobaAppSecret;

    if (!appKey || !appSecret) {
      return NextResponse.json(
        { error: "Doba API Key not configured" },
        { status: 400 },
      );
    }

    // Mock Import
    if (appKey === "mock") {
      const mockProduct = {
        name: "Mock Doba Product " + id,
        slug: slugify("Mock Doba Product " + id),
        description: "Imported from Doba (Mock)",
        price: 37.5, // 25 * 1.5
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        ],
        category: "Doba Import",
        stock: 100,
        isFeatured: false,
        productUrl: `https://doba.com/product/${id}`,
        dobaId: id,
      };

      const existing = await Product.findOne({ slug: mockProduct.slug });
      if (existing) {
        return NextResponse.json(
          { error: "Product already exists" },
          { status: 409 },
        );
      }

      const newProduct = await Product.create(mockProduct);
      return NextResponse.json({ success: true, product: newProduct });
    }

    // Real Doba API Call
    const timestamp = Date.now().toString();
    const sign = generateDobaSignature(appKey, appSecret, timestamp);

    let productData;
    try {
      const response = await axios.post(
        "https://openapi.doba.com/api/goods/detail",
        { spuId: id },
        {
          headers: {
            "doba-app-key": appKey,
            "doba-sign": sign,
            "doba-timestamp": timestamp,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.msg || "Failed to fetch details");
      }
      productData = response.data.data;
    } catch (apiError: any) {
      throw new Error("Doba API Error: " + apiError.message);
    }

    // Transform Data
    const name = productData.title;
    let slug = slugify(name);
    if (!slug) slug = `doba-${id}`;

    const description = productData.desc || productData.description || name;

    // Images
    let images: string[] = [];
    if (productData.picUrl) images.push(productData.picUrl);
    if (productData.imgList && Array.isArray(productData.imgList)) {
      images = [...images, ...productData.imgList];
    }
    images = [...new Set(images)].slice(0, 10);

    // Pricing
    // Doba usually gives 'price' (wholesale) and 'retailPrice' (MSRP)
    const cost = parseFloat(productData.price);
    const price = (isNaN(cost) ? 0 : cost) * 1.5; // 50% margin

    // Variants
    const variants = (productData.skuList || []).map((sku: any) => ({
      color: sku.color || "Default",
      size: sku.size || sku.spec || "Default",
      price: (parseFloat(sku.price) || cost) * 1.5,
      stock: sku.inventory || 0,
      image: sku.picUrl || images[0],
      dobaSku: sku.skuNo,
    }));

    // Extract sizes/colors
    const sizes = [
      ...new Set(
        variants.map((v: any) => v.size).filter((s: string) => s !== "Default"),
      ),
    ];
    const colors = [
      ...new Set(
        variants
          .map((v: any) => v.color)
          .filter((c: string) => c !== "Default"),
      ),
    ];

    // Check duplicate
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "Product already exists" },
        { status: 409 },
      );
    }

    const newProduct = await Product.create({
      name,
      slug,
      description,
      price,
      images,
      category: determineCategory(
        productData.categoryName || productData.catName || "Doba Import",
      ),
      stock: variants.reduce((acc: number, v: any) => acc + v.stock, 0),
      isFeatured: false,
      sizes: sizes as string[],
      colors: colors as string[],
      variants,
      dobaId: id,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Doba Import Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to import product" },
      { status: 500 },
    );
  }
}
