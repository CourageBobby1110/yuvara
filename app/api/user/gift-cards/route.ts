import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import GiftCard from "@/models/GiftCard";

// GET user's gift cards
export async function GET(req: Request) {
  try {
    await dbConnect();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return gift cards purchased by the user
    // Note: We cast session.user to any because id is added in the session callback
    const userId = (session.user as any).id;

    const giftCards = await GiftCard.find({
      $or: [
        { purchasedBy: userId },
        { recipientEmail: session.user.email?.toLowerCase() },
      ],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ giftCards });
  } catch (error) {
    console.error("Fetch user gift cards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift cards" },
      { status: 500 }
    );
  }
}
