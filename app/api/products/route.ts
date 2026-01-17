import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { auth } from "@/auth";

import { getProducts } from "@/lib/products";
import { determineCategory } from "@/lib/categories";
import User from "@/models/User";
import { sendNewProductNotification } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    // If slug is provided, fetch single product by slug
    if (slug) {
      await dbConnect();
      const product = await Product.findOne({ slug });
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(product);
    }

    // Otherwise, fetch products with filters
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined;
    const sort = searchParams.get("sort") || undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined;
    const isFeatured =
      searchParams.get("isFeatured") === "true" ? true : undefined;

    const products = await getProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      limit,
      isFeatured,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.price || !body.slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Ensure sizes and colors are arrays if provided
    if (body.sizes && !Array.isArray(body.sizes)) {
      body.sizes = body.sizes
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (body.colors && !Array.isArray(body.colors)) {
      body.colors = body.colors
        .split(",")
        .map((c: string) => c.trim())
        .filter(Boolean);
    }

    // Check for duplicate slug
    const existingProduct = await Product.findOne({ slug: body.slug });
    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this slug already exists" },
        { status: 400 },
      );
    }

    // Apply dynamic category logic
    if (body.category) {
      body.category = determineCategory(body.category);
    }

    const product = await Product.create(body);

    // Send newsletter to all customers
    try {
      const users = await User.find({ role: "user" }).select("email");
      if (users.length > 0) {
        await sendNewProductNotification(product, users);
      }
    } catch (emailError) {
      console.error("Failed to send newsletter emails", emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
