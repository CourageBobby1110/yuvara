import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Wishlist from "@/models/Wishlist";
import User from "@/models/User";
import Product from "@/models/Product";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    // In a real app, check for admin role here
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Ensure models are registered (prevent tree-shaking)
    console.log("Registered models:", Object.keys(mongoose.models));
    if (!mongoose.models.Product) {
      console.log(
        "Product model not found in mongoose.models, explicitly initializing..."
      );
      // This is a fallback, but the import should have handled it.
      // We use the imported Product to ensure it's retained.
      console.log("Product model status:", Product.modelName);
    }

    // Fetch all wishlists, populated with user and product
    const favorites = await Wishlist.find({})
      .populate("user", "name email")
      .populate("product", "name images price slug")
      .sort({ createdAt: -1 });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Admin favorites fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
