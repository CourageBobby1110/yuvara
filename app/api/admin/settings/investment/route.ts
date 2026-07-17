import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GlobalSettings from "@/models/GlobalSettings";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    await dbConnect();
    // Find or create settings
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({
        investmentProfitRate: 50,
        bankAccountNumber: "2052394593",
        bankName: "Kuda Bank",
        bankAccountName: "Chidi Courage Bobby",
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { profitRate, bankAccountNumber, bankName, bankAccountName } = await req.json();

    if (profitRate !== undefined && (typeof profitRate !== "number" || profitRate < 0)) {
      return NextResponse.json(
        { error: "Invalid profit rate" },
        { status: 400 }
      );
    }

    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({
        investmentProfitRate: profitRate !== undefined ? profitRate : 50,
        bankAccountNumber: bankAccountNumber || "2052394593",
        bankName: bankName || "Kuda Bank",
        bankAccountName: bankAccountName || "Chidi Courage Bobby",
      });
    } else {
      if (profitRate !== undefined) settings.investmentProfitRate = profitRate;
      if (bankAccountNumber !== undefined) settings.bankAccountNumber = bankAccountNumber;
      if (bankName !== undefined) settings.bankName = bankName;
      if (bankAccountName !== undefined) settings.bankAccountName = bankAccountName;
      await settings.save();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
