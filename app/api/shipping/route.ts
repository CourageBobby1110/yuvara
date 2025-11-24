import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ShippingRate from "@/models/ShippingRate";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    const query = country ? { isActive: true, country } : { isActive: true };

    const rates = await ShippingRate.find(query).sort({ state: 1 });
    return NextResponse.json(rates);
  } catch (error) {
    console.error("Shipping rates fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping rates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { state, fee, country } = await req.json();

    if (!state || fee === undefined) {
      return NextResponse.json(
        { error: "State and fee are required" },
        { status: 400 }
      );
    }

    const targetCountry = country || "Nigeria";

    const rate = await ShippingRate.findOneAndUpdate(
      { state, country: targetCountry },
      { state, fee, country: targetCountry },
      { upsert: true, new: true }
    );

    return NextResponse.json(rate);
  } catch (error) {
    console.error("Shipping rate update error:", error);
    return NextResponse.json(
      { error: "Failed to update shipping rate" },
      { status: 500 }
    );
  }
}
