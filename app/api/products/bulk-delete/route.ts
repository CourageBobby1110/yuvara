import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No product IDs provided" },
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await Product.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete products" },
      { status: 500 }
    );
  }
}
