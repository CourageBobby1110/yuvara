import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import {
  getPinterestBoards,
  createPinterestBoard,
  parsePinterestError,
} from "@/lib/pinterest";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const settings = await SiteSettings.findOne().lean();
    const token =
      settings?.pinterestAccessToken || process.env.PINTEREST_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "No Pinterest Access Token configured yet" },
        { status: 400 }
      );
    }

    try {
      const boards = await getPinterestBoards(token);
      return NextResponse.json({ boards });
    } catch (apiErr: any) {
      return NextResponse.json(
        {
          error: apiErr.message || "Failed to fetch boards from Pinterest",
          isTrialPending: apiErr.isTrialPending || false,
        },
        { status: apiErr.isTrialPending ? 403 : 400 }
      );
    }
  } catch (error: any) {
    console.error("Pinterest boards route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
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

    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const settings = await SiteSettings.findOne().lean();
    const token =
      settings?.pinterestAccessToken || process.env.PINTEREST_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "No Pinterest Access Token configured" },
        { status: 400 }
      );
    }

    try {
      const board = await createPinterestBoard(token, name, description);

      // Auto-save this board ID as default if none set
      if (!settings?.pinterestBoardId) {
        await SiteSettings.findOneAndUpdate(
          {},
          { pinterestBoardId: board.id }
        );
      }

      return NextResponse.json({ board, message: "Board created successfully" });
    } catch (apiErr: any) {
      return NextResponse.json(
        {
          error: apiErr.message || "Failed to create board on Pinterest",
          isTrialPending: apiErr.isTrialPending || false,
        },
        { status: apiErr.isTrialPending ? 403 : 400 }
      );
    }
  } catch (error: any) {
    console.error("Pinterest create board error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
