import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import Product from "@/models/Product";
import {
  getPinterestBoards,
  createPinterestBoard,
  createPinterestPin,
  withPinterestTokenRefresh,
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
    const passedToken = (body.token || body.pinterestAccessToken)?.trim();

    await dbConnect();
    const settings = await SiteSettings.findOne();
    let token = passedToken || settings?.pinterestAccessToken;

    if (!token) {
      return NextResponse.json(
        { error: "Please enter or connect your Pinterest Access Token before syncing." },
        { status: 400 }
      );
    }

    if (passedToken && passedToken !== settings?.pinterestAccessToken) {
      await SiteSettings.findOneAndUpdate(
        {},
        { $set: { pinterestAccessToken: passedToken } },
        { upsert: true }
      );
    }

    let boardId = body.boardId || settings?.pinterestBoardId;

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

    // If no boardId is provided, retrieve or auto-create one
    if (!boardId) {
      try {
        const boards = await executeWithRefresh((t) => getPinterestBoards(t));
        // Check if there is an official YuVara board
        const existingYuvaraBoard = boards.find((b) =>
          b.name?.toLowerCase().includes("yuvara")
        );

        if (existingYuvaraBoard) {
          boardId = existingYuvaraBoard.id;
          await SiteSettings.findOneAndUpdate(
            {},
            {
              pinterestBoardId: boardId,
              pinterestBoardName: existingYuvaraBoard.name,
            }
          );
        } else {
          // Auto create "YuVara Official Store" board
          const newBoard = await executeWithRefresh((t) =>
            createPinterestBoard(
              t,
              "YuVara Official Store",
              "Shop exclusive trends and products directly from YuVara (yuvara.com.ng)",
              "PUBLIC"
            )
          );
          boardId = newBoard.id;
          await SiteSettings.findOneAndUpdate(
            {},
            {
              pinterestBoardId: boardId,
              pinterestBoardName: newBoard.name,
            }
          );
        }
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
        if (
          pinErr.isTrialPending ||
          pinErr.code === 29 ||
          pinErr.message?.toLowerCase().includes("trial access")
        ) {
          await SiteSettings.findOneAndUpdate(
            {},
            { pinterestLastSyncStatus: "Standard Access Required (Trial Access Active)" }
          );
          return NextResponse.json(
            {
              error:
                "Standard Access Required: Pinterest Trial access does not allow publishing live Pins in production. Your OAuth connection is working and ready—record your demo video now and submit for Standard Access.",
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
        pinterestLastSyncStatus:
          synced > 0 ? (failed === 0 ? "Success" : "Partial") : "Failed",
        $inc: { pinterestSyncedCount: synced },
      }
    );

    if (synced === 0 && failed > 0) {
      return NextResponse.json(
        {
          error: `Sync could not publish products: ${errors[0] || "Pinterest API error"}`,
          failed,
          synced: 0,
          errors: errors.slice(0, 5),
        },
        { status: 400 }
      );
    }

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
