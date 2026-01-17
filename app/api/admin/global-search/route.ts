import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await connectToDB();
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const regex = new RegExp(query, "i");

    // Parallel execution for performance
    const [products, orders, users] = await Promise.all([
      // Search Products
      Product.find({ name: regex })
        .select("name images _id category")
        .limit(5)
        .lean(),

      // Search Orders (by ID) - use $expr to convert ObjectId to string for regex
      Order.find({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: query,
            options: "i",
          },
        },
      })
        .select("_id total status createdAt")
        .limit(3)
        .lean(),

      // Search Users
      User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .select("name email image _id")
        .limit(3)
        .lean(),
    ]);

    const results = [
      ...products.map((p: any) => ({
        type: "product",
        id: p._id,
        label: p.name,
        subtext: p.category,
        image: p.images?.[0], // Preview image
        url: `/admin/products/${p._id}`,
      })),
      ...orders.map((o: any) => ({
        type: "order",
        id: o._id,
        label: `Order #${o._id.toString().slice(-6)}`,
        subtext: `${o.status} • $${o.total}`,
        url: `/admin/orders/${o._id}`,
      })),
      ...users.map((u: any) => ({
        type: "user",
        id: u._id,
        label: u.name || "No Name",
        subtext: u.email,
        image: u.image,
        url: `/admin/users`, // No dedicated user detail page yet, linked to list
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
