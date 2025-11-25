import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GiftCard from "@/models/GiftCard";
import { auth } from "@/auth";

// GET all gift cards (admin only)
export async function GET(req: Request) {
  try {
    await dbConnect();

    const session = await auth();

    // Check if user is admin
    const isAdmin =
      (session?.user as any)?.role === "admin" ||
      (session?.user?.email &&
        process.env.ADMIN_EMAIL &&
        session.user.email.toLowerCase() ===
          process.env.ADMIN_EMAIL.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      // Find users matching the search term
      const User = (await import("@/models/User")).default;
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);

      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { recipientEmail: { $regex: search, $options: "i" } },
        { recipientName: { $regex: search, $options: "i" } },
        { purchasedBy: { $in: userIds } },
      ];
    }

    // Get total count
    const total = await GiftCard.countDocuments(query);

    // Get gift cards with pagination
    const giftCards = await GiftCard.find(query)
      .populate("purchasedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      giftCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch gift cards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift cards" },
      { status: 500 }
    );
  }
}

// POST create gift card manually (admin only)
export async function POST(req: Request) {
  try {
    await dbConnect();

    const session = await auth();

    // Check if user is admin
    const isAdmin =
      (session?.user as any)?.role === "admin" ||
      (session?.user?.email &&
        process.env.ADMIN_EMAIL &&
        session.user.email.toLowerCase() ===
          process.env.ADMIN_EMAIL.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      code,
      amount,
      recipientEmail,
      recipientName,
      message,
      expirationDate,
    } = await req.json();

    if (!code || !amount) {
      return NextResponse.json(
        { error: "Code and amount are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await GiftCard.findOne({
      code: code.toUpperCase().trim(),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Gift card code already exists" },
        { status: 400 }
      );
    }

    // Create gift card
    const giftCard = await GiftCard.create({
      code: code.toUpperCase().trim(),
      initialBalance: amount,
      currentBalance: amount,
      currency: "NGN",
      recipientEmail: recipientEmail?.trim().toLowerCase(),
      recipientName: recipientName?.trim(),
      message: message?.trim(),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      status: "active",
      isActive: true,
    });

    return NextResponse.json({ success: true, giftCard });
  } catch (error) {
    console.error("Create gift card error:", error);
    return NextResponse.json(
      { error: "Failed to create gift card" },
      { status: 500 }
    );
  }
}

// PUT update gift card (admin only)
export async function PUT(req: Request) {
  try {
    await dbConnect();

    const session = await auth();

    // Check if user is admin
    const isAdmin =
      (session?.user as any)?.role === "admin" ||
      (session?.user?.email &&
        process.env.ADMIN_EMAIL &&
        session.user.email.toLowerCase() ===
          process.env.ADMIN_EMAIL.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, isActive, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (status) updateData.status = status;

    const giftCard = await GiftCard.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: "Gift card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, giftCard });
  } catch (error) {
    console.error("Update gift card error:", error);
    return NextResponse.json(
      { error: "Failed to update gift card" },
      { status: 500 }
    );
  }
}

// DELETE gift card (admin only)
export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const session = await auth();

    // Check if user is admin
    const isAdmin =
      (session?.user as any)?.role === "admin" ||
      (session?.user?.email &&
        process.env.ADMIN_EMAIL &&
        session.user.email.toLowerCase() ===
          process.env.ADMIN_EMAIL.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const giftCard = await GiftCard.findByIdAndDelete(id);

    if (!giftCard) {
      return NextResponse.json(
        { error: "Gift card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete gift card error:", error);
    return NextResponse.json(
      { error: "Failed to delete gift card" },
      { status: 500 }
    );
  }
}
