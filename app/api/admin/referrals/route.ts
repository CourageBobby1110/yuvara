import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ReferralBatch from "@/models/ReferralBatch";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const batches = await ReferralBatch.find().sort({ createdAt: -1 });
    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { name, startDate, endDate, maxWinners } = await req.json();

    const batch = await ReferralBatch.create({
      name,
      startDate,
      endDate,
      maxWinners,
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}
