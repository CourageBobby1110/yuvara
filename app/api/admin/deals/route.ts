import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Deal from "@/models/Deal";
import Product from "@/models/Product";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const searchProduct = searchParams.get("searchProduct");

    // If searching for products to add to deals
    if (searchProduct !== null) {
      const query = searchProduct.trim();
      const match: any = {};
      if (query) {
        match.$or = [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { slug: { $regex: query, $options: "i" } },
        ];
      }
      const products = await Product.find(match)
        .select("_id name price images category slug stock isFeatured")
        .limit(20)
        .lean();

      return NextResponse.json(products);
    }

    // Otherwise return all configured deals
    const deals = await Deal.find({})
      .populate("product", "name price images category slug stock")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(deals);
  } catch (error) {
    console.error("Deals fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
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
    const body = await req.json();

    if (!body.product || !body.dealPrice || !body.type) {
      return NextResponse.json(
        { error: "Product ID, deal price, and deal type are required" },
        { status: 400 }
      );
    }

    // Auto-calculate discount if original price provided
    if (body.originalPrice && body.originalPrice > body.dealPrice) {
      body.discountPercent = Math.round(
        ((body.originalPrice - body.dealPrice) / body.originalPrice) * 100
      );
    }

    const deal = await Deal.create(body);
    const populated = await Deal.findById(deal._id).populate(
      "product",
      "name price images category slug stock"
    );

    return NextResponse.json(populated);
  } catch (error: any) {
    console.error("Deal creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create deal" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Deal ID is required" },
        { status: 400 }
      );
    }

    if (updateData.originalPrice && updateData.dealPrice) {
      updateData.discountPercent = Math.round(
        ((updateData.originalPrice - updateData.dealPrice) / updateData.originalPrice) * 100
      );
    }

    const deal = await Deal.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("product", "name price images category slug stock");

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error: any) {
    console.error("Deal update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Deal ID is required" },
        { status: 400 }
      );
    }

    const deal = await Deal.findByIdAndDelete(id);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Deal deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
