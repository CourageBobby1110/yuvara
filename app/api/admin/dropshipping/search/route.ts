import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import axios from "axios";
import mongoose from "mongoose";
import { getValidCJAccessToken } from "@/lib/cj-auth";

// --- Helper Functions ---

function parseProductImage(imageData: any): string {
  if (Array.isArray(imageData) && imageData.length > 0) {
    return imageData[0];
  }
  if (typeof imageData === "string" && imageData.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {
      // Failed to parse, return original if it looks like a url, or placeholder
    }
  }
  return typeof imageData === "string" ? imageData : "";
}

// --- Main Handler ---

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const page = searchParams.get("page") || "1";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const accessToken = await getValidCJAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "CJ Dropshipping not connected. Please go to Settings." },
        { status: 400 }
      );
    }

    // Mock Mode
    if (accessToken === "mock") {
      return NextResponse.json({
        products: [
          {
            pid: "1",
            productName: "Mock Wireless Headphones",
            productImage:
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
            sellPrice: "29.99",
            shippingFee: 15.0,
          },
        ],
        total: 1,
      });
    }

    // 1. Check if query is a URL or PID
    let pid = "";
    const urlMatch = query.match(/p-(\d+)\.html/);
    if (urlMatch && urlMatch[1]) {
      pid = urlMatch[1];
    } else if (/^\d+$/.test(query) && query.length > 10) {
      // Assume it's a direct PID if it's a long number
      pid = query;
    }

    // 2. Search CJ Products
    try {
      let products = [];
      let total = 0;

      if (pid) {
        // Fetch Single Product
        const response = await axios.get(
          `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${pid}`,
          { headers: { "CJ-Access-Token": accessToken } }
        );

        if (response.data?.result && response.data?.data) {
          const p = response.data.data;
          products = [
            {
              pid: p.pid,
              productName: p.productNameEn || p.productName,
              productImage: parseProductImage(p.productImage),
              sellPrice: p.sellPrice,
              productSku: p.productSku,
              categoryName: p.categoryName,
              shippingInfo: [], // query endpoint might not return shipping info directly in list format, but that's ok
            },
          ];
          total = 1;
        }
      } else {
        // Keyword Search
        const response = await axios.get(
          `https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=${page}&pageSize=50&productName=${encodeURIComponent(
            query
          )}`,
          { headers: { "CJ-Access-Token": accessToken } }
        );

        if (response.data?.result && response.data?.data?.list) {
          products = response.data.data.list.map((p: any) => ({
            pid: p.pid,
            productName: p.productNameEn || p.productName,
            productImage: parseProductImage(p.productImage),
            sellPrice: p.sellPrice,
            productSku: p.productSku,
            categoryName: p.categoryName,
          }));
          total = response.data.data.total || 0;
        }
      }

      return NextResponse.json({
        products,
        total,
      });
    } catch (apiError: any) {
      console.error("CJ Search API Error:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch products from CJ" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("CJ Search Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
