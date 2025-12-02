import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const settings = await SiteSettings.findOne().sort({ createdAt: -1 });

    return NextResponse.json({
      cjDropshippingApiKey: settings?.cjDropshippingApiKey || "",
      cjDropshippingUserId: settings?.cjDropshippingUserId || "",
      cjConnected: !!settings?.cjAccessToken,
      cjTokenExpiry: settings?.cjTokenExpiry,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cjDropshippingApiKey, cjDropshippingUserId } = await req.json();

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    let settings = await SiteSettings.findOne().sort({ createdAt: -1 });

    if (!settings) {
      settings = new SiteSettings({
        cjDropshippingApiKey,
        cjDropshippingUserId,
      });
    } else {
      settings.cjDropshippingApiKey = cjDropshippingApiKey;
      settings.cjDropshippingUserId = cjDropshippingUserId;
    }

    await settings.save();

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
