import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import {
  getPinterestBoards,
  createPinterestBoard,
  withPinterestTokenRefresh,
} from "@/lib/pinterest";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tokenQuery = searchParams.get("token")?.trim();

    await dbConnect();
    const settings = await SiteSettings.findOne();
    const token = tokenQuery || settings?.pinterestAccessToken;

    if (!token) {
      return NextResponse.json(
        { error: "No Pinterest Access Token configured yet. Please connect via OAuth or enter your Access Token." },
        { status: 400 }
      );
    }

    try {
      const boards = await withPinterestTokenRefresh(
        async (activeToken) => getPinterestBoards(activeToken),
        {
          accessToken: token,
          refreshToken: settings?.pinterestRefreshToken,
          appId: settings?.pinterestAppId || process.env.PINTEREST_APP_ID,
          appSecret: settings?.pinterestAppSecret || process.env.PINTEREST_APP_SECRET,
          onTokenRefreshed: async (newToken, newRefresh) => {
            await SiteSettings.findOneAndUpdate(
              {},
              {
                $set: {
                  pinterestAccessToken: newToken,
                  ...(newRefresh ? { pinterestRefreshToken: newRefresh } : {}),
                },
              }
            );
          },
        }
      );

      // Auto-save the token in SiteSettings if passed via query and valid
      if (tokenQuery && tokenQuery !== settings?.pinterestAccessToken) {
        await SiteSettings.findOneAndUpdate(
          {},
          { $set: { pinterestAccessToken: tokenQuery } },
          { upsert: true }
        );
      }

      // Check current target board
      let currentBoardId = settings?.pinterestBoardId || "";
      let currentBoard = boards.find((b) => b.id === currentBoardId);

      // If no board is currently set or pointing to a non-existent board, check if a YuVara board exists
      if (!currentBoard) {
        const yuvaraBoard = boards.find((b) =>
          b.name?.toLowerCase().includes("yuvara")
        );
        if (yuvaraBoard) {
          currentBoardId = yuvaraBoard.id;
          currentBoard = yuvaraBoard;
          await SiteSettings.findOneAndUpdate(
            {},
            {
              $set: {
                pinterestBoardId: yuvaraBoard.id,
                pinterestBoardName: yuvaraBoard.name,
              },
            }
          );
        }
      } else if (currentBoard && !settings?.pinterestBoardName) {
        await SiteSettings.findOneAndUpdate(
          {},
          { $set: { pinterestBoardName: currentBoard.name } }
        );
      }

      return NextResponse.json({
        boards,
        currentBoardId,
        currentBoardName: currentBoard?.name || settings?.pinterestBoardName || "",
        currentBoard,
        username: settings?.pinterestAccountUsername || "",
      });
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

    const body = await req.json().catch(() => ({}));
    const {
      name,
      description,
      privacy = "PUBLIC",
      setAsDefault = true,
      token: bodyToken,
      pinterestAccessToken,
    } = body;

    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Board name is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: "Board name must be 50 characters or less" },
        { status: 400 }
      );
    }

    await dbConnect();
    const settings = await SiteSettings.findOne();
    const token =
      (bodyToken || pinterestAccessToken)?.trim() ||
      settings?.pinterestAccessToken ||
      process.env.PINTEREST_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "No Pinterest Access Token configured. Connect via OAuth first." },
        { status: 400 }
      );
    }

    try {
      const board = await withPinterestTokenRefresh(
        async (activeToken) =>
          createPinterestBoard(
            activeToken,
            trimmedName,
            description || "Shop curated collections and products from YuVara",
            privacy
          ),
        {
          accessToken: token,
          refreshToken: settings?.pinterestRefreshToken,
          appId: settings?.pinterestAppId || process.env.PINTEREST_APP_ID,
          appSecret: settings?.pinterestAppSecret || process.env.PINTEREST_APP_SECRET,
          onTokenRefreshed: async (newToken, newRefresh) => {
            await SiteSettings.findOneAndUpdate(
              {},
              {
                $set: {
                  pinterestAccessToken: newToken,
                  ...(newRefresh ? { pinterestRefreshToken: newRefresh } : {}),
                },
              }
            );
          },
        }
      );

      // Auto-save this board ID and name as default if setAsDefault is true
      if (setAsDefault) {
        await SiteSettings.findOneAndUpdate(
          {},
          {
            $set: {
              pinterestBoardId: board.id,
              pinterestBoardName: board.name,
              ...((bodyToken || pinterestAccessToken) &&
              (bodyToken || pinterestAccessToken) !== settings?.pinterestAccessToken
                ? { pinterestAccessToken: (bodyToken || pinterestAccessToken).trim() }
                : {}),
            },
          },
          { upsert: true }
        );
      }

      return NextResponse.json({
        board,
        currentBoardId: board.id,
        currentBoardName: board.name,
        message: `Board "${board.name}" successfully connected!`,
      });
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
