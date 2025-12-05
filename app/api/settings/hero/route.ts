import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    let settings = await SiteSettings.findOne();

    if (!settings) {
      // Return default if no settings exist yet
      return NextResponse.json({
        heroImageUrl: "/hero-shoe-minimalist.png",
        heroSlides: [],
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { heroSlides } = body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }

    if (heroSlides) {
      settings.heroSlides = heroSlides;
    }

    await settings.save();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error saving site settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
