import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { auth } from "@/auth";
import { sendTargetedProductNotification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user?.role !== "admin" && session.user?.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      productId, 
      userIds, 
      subject, 
      headline,
      catalogueProductIds 
    } = await req.json();

    if (!productId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ error: "Primary product not found" }, { status: 404 });
    }

    const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
    if (users.length === 0) {
      return NextResponse.json({ error: "No valid users found" }, { status: 404 });
    }

    // If specific catalogue product IDs were selected, fetch them
    let additionalProducts: any[] = [];
    if (Array.isArray(catalogueProductIds) && catalogueProductIds.length > 0) {
      additionalProducts = await Product.find({
        _id: { $in: catalogueProductIds, $ne: productId },
      }).lean();
    }

    await sendTargetedProductNotification(product, users, {
      additionalProducts,
      subject,
      headline,
    });

    return NextResponse.json({ success: true, count: users.length });
  } catch (error: any) {
    console.error("Error sending marketing emails:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send promotional emails" },
      { status: 500 }
    );
  }
}
