import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Product from "@/models/Product";
import { auth } from "@/auth";

export const POST = async (req: Request) => {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDB();

    const { ids, modifier } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new NextResponse("No product IDs provided", { status: 400 });
    }

    if (!modifier || typeof modifier !== "number") {
      return new NextResponse("Invalid modifier", { status: 400 });
    }

    console.log(
      `Bulk updating ${ids.length} products with modifier ${modifier}`
    );

    // We need to fetch, update, and save each to ensure virtuals/variants are handled correctly
    // or use bulkWrite for performance. Given complexity of variants, looping is safer for logic.
    // However, for pure price updates, direct update is cleaner but variants updates are nested.

    // Let's use a loop with parallel execution
    const products = await Product.find({ _id: { $in: ids } });

    const updatePromises = products.map(async (product) => {
      // Update base price
      if (product.price) {
        product.price = product.price * modifier;
      }

      // Update variant prices
      if (product.variants && product.variants.length > 0) {
        product.variants = product.variants.map((v: any) => ({
          ...v,
          price: v.price ? v.price * modifier : v.price,
        }));
      }

      // Update shipping fee (optional? User said "price and all the variants". Usually shipping fee doesn't scale with price markup, but let's stick to price)
      // product.shippingFee is usually cost-based, not margin-based. Leaving it potentially.

      return product.save();
    });

    await Promise.all(updatePromises);

    return NextResponse.json(
      { success: true, count: products.length },
      { status: 200 }
    );
  } catch (err) {
    console.log("[bulk_update_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
