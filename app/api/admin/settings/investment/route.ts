import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GlobalSettings from "@/models/GlobalSettings";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    await dbConnect();
    // Find or create settings
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({ investmentProfitRate: 50 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { profitRate } = await req.json();

    if (typeof profitRate !== "number" || profitRate < 0) {
      return NextResponse.json(
        { error: "Invalid profit rate" },
        { status: 400 }
      );
    }

    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({
        investmentProfitRate: profitRate,
      });
    } else {
      settings.investmentProfitRate = profitRate;
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
