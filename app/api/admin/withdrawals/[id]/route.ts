import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // In a real app, check for admin role here
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, adminNote } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await dbConnect();

    const withdrawal = await Withdrawal.findById(params.id);

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { error: "Withdrawal is already processed" },
        { status: 400 }
      );
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote;
    await withdrawal.save();

    // If rejected, refund the amount to the user
    if (status === "rejected") {
      const user = await User.findById(withdrawal.user);
      if (user) {
        user.affiliateBalance += withdrawal.amount;
        await user.save();
      }
    }

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    console.error("Admin withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
