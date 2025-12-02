import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import axios from "axios";
import mongoose from "mongoose";
import crypto from "crypto";

// Helper to generate Doba Signature
// Note: This is a best-guess implementation based on standard Doba API patterns.
// Real implementation might vary slightly based on specific Doba API version.
function generateDobaSignature(
  appKey: string,
  appSecret: string,
  timestamp: string
) {
  // Common pattern: MD5(appKey + timestamp + appSecret) or similar
  // Doba often uses: sign = md5(appKey + timestamp + appSecret)
  // We'll assume this for now.
  const str = `${appKey}${timestamp}${appSecret}`;
  return crypto.createHash("md5").update(str).digest("hex");
}

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

    const settings = await SiteSettings.findOne().sort({ createdAt: -1 });
    const appKey = settings?.dobaAppKey;
    const appSecret = settings?.dobaAppSecret;

    if (!appKey || !appSecret) {
      return NextResponse.json(
        {
          error: "Doba API Key/Secret not configured. Please go to Settings.",
        },
        { status: 400 }
      );
    }

    // Mock Mode
    if (appKey === "mock") {
      return NextResponse.json({
        products: [
          {
            id: "doba-1",
            title: "Mock Doba Product 1",
            image:
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
            price: 25.0,
            shipping: 5.0,
            inventory: 100,
          },
          {
            id: "doba-2",
            title: "Mock Doba Product 2",
            image:
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
            price: 45.0,
            shipping: 0.0,
            inventory: 50,
          },
        ],
        total: 2,
      });
    }

    // Real Doba API Call
    const timestamp = Date.now().toString();
    const sign = generateDobaSignature(appKey, appSecret, timestamp);

    // Endpoint: Query SPU List (Search)
    // Assuming base URL: https://openapi.doba.com/api/
    // This might need adjustment based on specific API version docs
    try {
      const response = await axios.post(
        "https://openapi.doba.com/api/goods/list", // Example endpoint
        {
          keyword: query,
          pageIndex: parseInt(page),
          pageSize: 20,
        },
        {
          headers: {
            "doba-app-key": appKey,
            "doba-sign": sign,
            "doba-timestamp": timestamp,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        const list = response.data.data.list || [];
        const products = list.map((item: any) => ({
          id: item.spuId || item.id,
          title: item.title,
          image: item.picUrl || item.imageUrl,
          price: item.price,
          shipping: item.shippingFee || 0,
          inventory: item.inventory || 0,
        }));

        return NextResponse.json({
          products,
          total: response.data.data.total || 0,
        });
      } else {
        console.error("Doba API Error:", response.data);
        return NextResponse.json({
          products: [],
          total: 0,
          error: response.data.msg || "No results from Doba",
        });
      }
    } catch (apiError: any) {
      console.error("Doba Request Failed:", apiError.message);
      return NextResponse.json(
        { error: "Failed to contact Doba API: " + apiError.message },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Doba Search Route Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
