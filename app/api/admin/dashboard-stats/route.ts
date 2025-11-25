import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Parallelize queries for efficiency
    const [
      totalRevenueResult,
      activeOrdersCount,
      customersCount,
      recentOrders,
    ] = await Promise.all([
      // Aggregate total revenue
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      // Count active orders
      Order.countDocuments({
        status: { $nin: ["delivered", "cancelled"] },
      }),
      // Count customers
      User.countDocuments({ role: "user" }),
      // Fetch recent 5 orders
      Order.find({}).sort({ createdAt: -1 }).limit(5).populate("user", "name"),
    ]);

    const revenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    return NextResponse.json({
      revenue,
      activeOrders: activeOrdersCount,
      customers: customersCount,
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
