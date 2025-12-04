import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();
    // Fetch distinct categories
    const categories = await Product.distinct("category");

    // Limit to 15 as requested
    const limitedCategories = categories.slice(0, 15);

    return NextResponse.json(limitedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
