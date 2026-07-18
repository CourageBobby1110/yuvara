import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserActivity from "@/models/UserActivity";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { action, email, metadata } = await req.json();

    const userEmail = session?.user?.email || email || "";
    const userRole = session?.user?.role || "";
    const isAdmin =
      userRole === "admin" ||
      userRole === "worker" ||
      userEmail.toLowerCase().includes("admin");

    if (isAdmin) {
      return NextResponse.json({
        success: true,
        message: "Activity tracking skipped for admins/workers",
      });
    }

    await dbConnect();

    const activity = await UserActivity.create({
      user: session?.user?.id || null,
      email: session?.user?.email || email || null,
      action,
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("Activity tracking error:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
