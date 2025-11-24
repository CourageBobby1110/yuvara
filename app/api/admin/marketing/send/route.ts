import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { auth } from "@/auth";
import { sendTargetedProductNotification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, userIds } = await req.json();

    if (!productId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return NextResponse.json({ error: "No valid users found" }, { status: 404 });
    }

    await sendTargetedProductNotification(product, users);

    return NextResponse.json({ success: true, count: users.length });
  } catch (error) {
    console.error("Error sending marketing emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
