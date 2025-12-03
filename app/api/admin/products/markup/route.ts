import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Product from "@/models/Product";
import dbConnect from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    const markup = parseFloat(amount);

    if (isNaN(markup)) {
      return NextResponse.json(
        { error: "Invalid markup amount" },
        { status: 400 }
      );
    }

    await dbConnect();

    const products = await Product.find({});
    let count = 0;

    for (const product of products) {
      // Update base price
      product.price = (product.price || 0) + markup;

      // Update variants
      if (product.variants && product.variants.length > 0) {
        product.variants = product.variants.map((v: any) => ({
          ...v,
          price: (v.price || 0) + markup,
        }));
      }

      await product.save();
      count++;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${count} products with +$${markup}`,
    });
  } catch (error: any) {
    console.error("Bulk Markup Error:", error);
    return NextResponse.json(
      { error: "Failed to update prices" },
      { status: 500 }
    );
  }
}
