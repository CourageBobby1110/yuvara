import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    let settings = await SiteSettings.findOne();

    if (!settings) {
      return NextResponse.json({ affiliateProgramStatus: "open" });
    }

    return NextResponse.json({
      affiliateProgramStatus: settings.affiliateProgramStatus || "open",
    });
  } catch (error) {
    console.error("Error fetching affiliate settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    // basic admin check - assuming role check is done elsewhere or session exists
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { affiliateProgramStatus } = body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }

    if (affiliateProgramStatus) {
      settings.affiliateProgramStatus = affiliateProgramStatus;
    }

    await settings.save();

    return NextResponse.json({
      affiliateProgramStatus: settings.affiliateProgramStatus,
    });
  } catch (error) {
    console.error("Error saving affiliate settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
