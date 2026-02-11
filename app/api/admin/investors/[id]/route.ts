import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
import bcrypt from "bcryptjs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const {
      name,
      email,
      password,
      accessPin,
      initialAmount,
      status,
      message, // For adding a new message
    } = body;

    const investor = await Investor.findById(id);
    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 },
      );
    }

    if (name) investor.name = name;
    if (email) investor.email = email;
    if (initialAmount !== undefined) investor.initialAmount = initialAmount;
    if (status) investor.status = status;
    if (body.customProfitRate !== undefined) {
      investor.customProfitRate =
        body.customProfitRate !== "" ? Number(body.customProfitRate) : null;
    }

    if (password) {
      investor.password = await bcrypt.hash(password, 10);
    }
    if (accessPin) {
      // Check uniqueness if changing
      if (accessPin !== investor.accessPin) {
        const existing = await Investor.findOne({ accessPin });
        if (existing) {
          return NextResponse.json(
            { error: "Access Pin already in use" },
            { status: 409 },
          );
        }
        investor.accessPin = accessPin;
      }
    }

    if (message) {
      investor.messages.push({
        title: message.title,
        content: message.content,
        date: new Date(),
        isRead: false,
      });
    }

    await investor.save();

    return NextResponse.json(investor);
  } catch (error) {
    console.error("Error updating investor:", error);
    return NextResponse.json(
      { error: "Failed to update investor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const deletedInvestor = await Investor.findByIdAndDelete(id);

    if (!deletedInvestor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting investor:", error);
    return NextResponse.json(
      { error: "Failed to delete investor" },
      { status: 500 },
    );
  }
}
