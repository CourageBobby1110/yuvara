import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import DeletionLog from "@/models/DeletionLog";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    
    const product = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    // Deletion is strictly permitted for admin role only
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    // Extract password from JSON body, fallback to headers or query string
    let password = "";
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        password = body.password || "";
      } catch (e) {
        // Ignore and fallback
      }
    }
    if (!password) {
      const url = new URL(req.url);
      password = req.headers.get("x-delete-password") || url.searchParams.get("password") || "";
    }

    const envPassword = process.env.PRODUCT_DELETE_PASSWORD || process.env.DELETE_PRODUCT_PASSWORD;
    if (!envPassword) {
      return NextResponse.json(
        { error: "Product deletion password is not configured on the server." },
        { status: 500 }
      );
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Incorrect delete password" }, { status: 403 });
    }

    await dbConnect();

    // Check daily deletion rate limit (max 12 deletions per 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deleteCount = await DeletionLog.countDocuments({
      deletedAt: { $gte: twentyFourHoursAgo },
    });

    if (deleteCount >= 12) {
      return NextResponse.json(
        { error: "Daily deletion limit reached. You can only delete up to 12 products per 24 hours." },
        { status: 429 }
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Log this deletion activity
    await DeletionLog.create({
      productId: id,
      deletedBy: session.user?.email || "unknown_admin",
      deletedAt: new Date(),
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
