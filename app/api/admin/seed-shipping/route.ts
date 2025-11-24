import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ShippingRate from "@/models/ShippingRate";

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Check if Nigeria rates already exist
    const count = await ShippingRate.countDocuments({ country: "Nigeria" });
    if (count > 0) {
      return NextResponse.json({
        message: "Nigeria shipping rates already seeded",
        count,
      });
    }

    const rates = NIGERIA_STATES.map((state) => ({
      country: "Nigeria",
      state,
      fee: state === "Lagos" ? 2500 : 5000,
      isActive: true,
    }));

    await ShippingRate.insertMany(rates);

    return NextResponse.json({
      success: true,
      message: `Seeded ${rates.length} states for Nigeria`,
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed shipping rates" },
      { status: 500 }
    );
  }
}
