import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    await SiteSettings.findOneAndUpdate(
      {},
      {
        $set: {
          pinterestAccessToken: "",
          pinterestRefreshToken: "",
          pinterestAccountUsername: "",
          pinterestLastSyncStatus: "Disconnected",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Pinterest account disconnected successfully.",
    });
  } catch (error: any) {
    console.error("Pinterest disconnect error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to disconnect Pinterest account" },
      { status: 500 }
    );
  }
}
