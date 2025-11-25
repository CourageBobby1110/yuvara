import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Wishlist from "@/models/Wishlist";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    // In a real app, check for admin role here
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

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
