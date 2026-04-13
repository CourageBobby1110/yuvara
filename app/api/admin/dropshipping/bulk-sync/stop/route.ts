import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    await SiteSettings.updateOne({}, { lastSyncStatus: "Stopped" });
    return NextResponse.json({ success: true, message: "Synchronization halted." });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to stop sync." }, { status: 500 });
  }
}
