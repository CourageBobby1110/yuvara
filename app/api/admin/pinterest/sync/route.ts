import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import {
  getPinterestBoards,
  createPinterestBoard,
  createPinterestPin,
} from "@/lib/pinterest";

export const maxDuration = 300; // 5 minutes timeout for bulk operations

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const forceResync = Boolean(body.forceResync);

    await dbConnect();
    const settings = await SiteSettings.findOne().lean();
    const token =
      settings?.pinterestAccessToken || process.env.PINTEREST_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Please enter your Pinterest Access Token before syncing." },
        { status: 400 }
      );
    }

    let boardId = body.boardId || settings?.pinterestBoardId;

    // If no boardId is provided, retrieve or auto-create one
    if (!boardId) {
      try {
        const boards = await getPinterestBoards(token);
        if (boards && boards.length > 0) {
          boardId = boards[0].id;
        } else {
          // Auto create a board
          const newBoard = await createPinterestBoard(
            token,
            "YuVara Official Store",
            "Shop exclusive trends and products directly from YuVara"
          );
          boardId = newBoard.id;
        }

        // Save selected/created board ID
        await SiteSettings.findOneAndUpdate({}, { pinterestBoardId: boardId });
      } catch (boardErr: any) {
        if (boardErr.isTrialPending) {
          await SiteSettings.findOneAndUpdate(
            {},
            { pinterestLastSyncStatus: "Trial Access Pending" }
          );
          return NextResponse.json(
            {
              error:
                "Your Pinterest Developer App is currently under review by Pinterest. Pins will sync as soon as Pinterest activates your trial access.",
              isTrialPending: true,
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          {
            error:
              boardErr.message ||
              "Could not access or create a Pinterest board with this token.",
          },
          { status: 400 }
        );
      }
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.URL ||
      "https://yuvara.com.ng";

    // Fetch products
    const query = forceResync ? {} : { pinterestPinId: { $exists: false } };
    const products = (await Product.find(query).lean()) as any[];

    if (products.length === 0) {
      return NextResponse.json({
        message: "All products are already synchronized with Pinterest!",
        synced: 0,
        skipped: 0,
        total: 0,
      });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Loop through products and create pins
    for (const prod of products) {
      try {
        const pin = await createPinterestPin(
          token,
          boardId,
          {
            name: prod.name,
            description: prod.description,
            slug: prod.slug,
            price: prod.price,
            images: prod.images || [],
            category: prod.category,
          },
          baseUrl
        );

        // Update product in DB
        await Product.findByIdAndUpdate(prod._id, {
          pinterestPinId: pin.id,
          pinterestSyncedAt: new Date(),
        });

        synced++;
      } catch (pinErr: any) {
        if (pinErr.isTrialPending) {
          await SiteSettings.findOneAndUpdate(
            {},
            { pinterestLastSyncStatus: "Trial Access Pending" }
          );
          return NextResponse.json(
            {
              error:
                "Your Pinterest Developer App is currently in Trial review by Pinterest. Once approved, all products will pin successfully.",
              isTrialPending: true,
              partialSync: synced,
            },
            { status: 403 }
          );
        }
        failed++;
        errors.push(`${prod.name}: ${pinErr.message}`);
      }
    }

    // Update settings status
    await SiteSettings.findOneAndUpdate(
      {},
      {
        pinterestLastSyncDate: new Date(),
        pinterestLastSyncStatus: failed === 0 ? "Success" : "Partial",
        $inc: { pinterestSyncedCount: synced },
      }
    );

    return NextResponse.json({
      message: `Sync completed: ${synced} product(s) published to Pinterest.`,
      synced,
      failed,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Pinterest sync route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync products to Pinterest" },
      { status: 500 }
    );
  }
}
