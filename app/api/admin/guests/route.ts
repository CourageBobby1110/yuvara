import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // Fetch all users where isGuest is true
    const guests = await User.find({ isGuest: true }).sort({ createdAt: -1 });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Failed to fetch guests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
