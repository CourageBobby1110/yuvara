import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import {
  getPinterestBoards,
  createPinterestBoard,
  withPinterestTokenRefresh,
} from "@/lib/pinterest";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const settings = await SiteSettings.findOne();
    let token = settings?.pinterestAccessToken;

    if (!token) {
      return NextResponse.json(
        { error: "No Pinterest Access Token configured. Connect via OAuth first." },
        { status: 400 }
      );
    }

    // Helper for executing Pinterest calls with auto-refresh
    const executeWithRefresh = async <T>(action: (t: string) => Promise<T>): Promise<T> => {
      return withPinterestTokenRefresh(action, {
        accessToken: token as string,
        refreshToken: settings?.pinterestRefreshToken,
        appId: settings?.pinterestAppId || process.env.PINTEREST_APP_ID,
        appSecret: settings?.pinterestAppSecret || process.env.PINTEREST_APP_SECRET,
        onTokenRefreshed: async (newToken, newRefresh) => {
          token = newToken;
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
      });
    };

    // Find all distinct categories with at least 1 product
    const rawCategories: string[] = await Product.distinct("category");
    
    // Group and clean into top-level root categories (e.g. "Bags & Shoes", "Consumer Electronics")
    const cleanCategories = Array.from(
      new Set(
        rawCategories
          .filter((c) => typeof c === "string" && c.trim().length > 0)
          .map((c) => {
            const root = c
              .replace(/，/g, ",")
              .split(/[/>]/)[0]
              .split(",")[0]
              .trim();
            return root;
          })
          .filter((root) => root.length > 0)
      )
    );

    if (cleanCategories.length === 0) {
      return NextResponse.json({
        message: "No product categories found in database to create boards for.",
        created: [],
        existing: [],
      });
    }

    // Fetch existing boards
    const existingBoards = await executeWithRefresh((t) => getPinterestBoards(t));
    const createdBoards = [];
    const existingMatches = [];

    for (const cat of cleanCategories) {
      const boardName = `YuVara - ${cat}`.slice(0, 50);

      const alreadyExists = existingBoards.find(
        (b) => b.name?.toLowerCase().trim() === boardName.toLowerCase()
      );

      if (alreadyExists) {
        existingMatches.push(alreadyExists);
      } else {
        try {
          const newBoard = await executeWithRefresh((t) =>
            createPinterestBoard(
              t,
              boardName,
              `Explore curated ${cat} from YuVara (yuvara.com.ng)`,
              "PUBLIC"
            )
          );
          createdBoards.push(newBoard);
          existingBoards.push(newBoard);
        } catch (err: any) {
          console.warn(`Could not create category board for ${cat}:`, err.message);
        }
      }
    }

    return NextResponse.json({
      message: `Created ${createdBoards.length} new category board(s). (${existingMatches.length} already existed)`,
      created: createdBoards,
      existing: existingMatches,
      totalCategories: cleanCategories.length,
    });
  } catch (error: any) {
    console.error("Pinterest category boards error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create category boards" },
      { status: 500 }
    );
  }
}
