import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export async function GET() {
  try {
    await dbConnect();
    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { categoryImages, brandStoryImage } = body;

    console.log("Updating homepage settings:", {
      categoryImages,
      brandStoryImage,
    });

    // Construct update object
    const update: any = {};
    if (categoryImages) {
      // Use dot notation for partial updates of nested objects if needed,
      // but here we want to merge or replace.
      // If we want to merge, we need to be careful.
      // The previous logic was merging manually.
      // Let's assume we want to update specific fields if provided.
      if (categoryImages.men) update["categoryImages.men"] = categoryImages.men;
      if (categoryImages.women)
        update["categoryImages.women"] = categoryImages.women;
      if (categoryImages.accessories)
        update["categoryImages.accessories"] = categoryImages.accessories;
    }
    if (brandStoryImage) {
      update.brandStoryImage = brandStoryImage;
    }

    console.log("Update query:", update);

    const settings = await SiteSettings.findOneAndUpdate(
      {}, // Find the first document (singleton)
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("Updated settings:", settings);

    // Revalidate the homepage to reflect changes immediately
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/admin/homepage");

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
