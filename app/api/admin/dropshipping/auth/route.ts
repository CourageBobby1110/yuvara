import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import axios from "axios";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { apiKey, userId } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    // 1. Exchange API Key for Access Token
    try {
      const response = await axios.post(
        "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
        {
          apiKey: apiKey,
        }
      );

      if (response.data?.result && response.data?.data) {
        const {
          accessToken,
          refreshToken,
          accessTokenExpiryDate,
          refreshTokenExpiryDate,
        } = response.data.data;

        // 2. Save to Database
        await SiteSettings.findOneAndUpdate(
          {},
          {
            cjDropshippingApiKey: apiKey,
            cjDropshippingUserId: userId || "",
            cjAccessToken: accessToken,
            cjRefreshToken: refreshToken,
            cjTokenExpiry: new Date(accessTokenExpiryDate),
          },
          { upsert: true, new: true }
        );

        return NextResponse.json({
          success: true,
          message: "Successfully connected to CJ Dropshipping",
        });
      } else {
        return NextResponse.json(
          {
            error:
              response.data?.message ||
              "Failed to authenticate with CJ Dropshipping",
          },
          { status: 400 }
        );
      }
    } catch (apiError: any) {
      console.error(
        "CJ Auth Error:",
        apiError.response?.data || apiError.message
      );
      return NextResponse.json(
        {
          error:
            "Failed to connect to CJ Dropshipping. Please check your API Key.",
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Internal Auth Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
