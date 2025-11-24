import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product"; // Ensure Product model is registered
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // Populate product details
    const wishlist = await Wishlist.find({ user: session.user.id })
      .populate("product")
      .sort({ createdAt: -1 });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { productId, selectedSize, selectedColor } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Upsert: Update if exists, Insert if not
    const item = await Wishlist.findOneAndUpdate(
      { user: session.user.id, product: productId },
      { 
        user: session.user.id, 
        product: productId,
        selectedSize,
        selectedColor
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(item);
  } catch (error) {
    console.error("Wishlist add error:", error);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await dbConnect();
    await Wishlist.findOneAndDelete({ user: session.user.id, product: productId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wishlist delete error:", error);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
