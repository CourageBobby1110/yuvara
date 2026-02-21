/**
 * Admin WhatsApp Sessions API
 * GET  — list all WhatsApp sessions with conversation history
 * POST — trigger promo blast to active users
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import WhatsAppSession from "@/models/WhatsAppSession";
import Product from "@/models/Product";
import {
  sendTextMessage,
  sendImageMessage,
  sendInteractiveButtons,
  formatNaira,
} from "@/lib/whatsapp";
import { generateAIResponse } from "@/lib/whatsapp-ai";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const phone = searchParams.get("phone");

    // If phone is provided, return single session with full conversation
    if (phone) {
      const waSession = await WhatsAppSession.findOne({ phone }).lean();
      if (!waSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ session: waSession });
    }

    // List all sessions (without full conversation history for performance)
    const sessions = await WhatsAppSession.find()
      .select(
        "phone name userId state lastMessageAt registeredAt cart conversationHistory createdAt"
      )
      .sort({ lastMessageAt: -1 })
      .lean();

    // Add summary stats
    const stats = {
      totalSessions: sessions.length,
      activeLast24h: sessions.filter(
        (s: any) =>
          s.lastMessageAt &&
          new Date(s.lastMessageAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length,
      registeredUsers: sessions.filter((s: any) => s.userId).length,
      withItemsInCart: sessions.filter(
        (s: any) => s.cart && s.cart.length > 0
      ).length,
    };

    return NextResponse.json({
      sessions: sessions.map((s: any) => ({
        ...s,
        messageCount: s.conversationHistory?.length || 0,
        lastMessage:
          s.conversationHistory?.[s.conversationHistory.length - 1]?.content?.slice(
            0,
            100
          ) || "",
        lastMessageRole:
          s.conversationHistory?.[s.conversationHistory.length - 1]?.role || "",
        conversationHistory: undefined, // Don't send full history in list view
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching WhatsApp sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST — Trigger promo blast
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const activeThreshold = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const eligibleUsers = await WhatsAppSession.find({
      lastMessageAt: { $gte: activeThreshold },
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        message: "No active users to send promotions to",
        sent: 0,
      });
    }

    // Pick featured products
    const products = await Product.find({ stock: { $gt: 0 } })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(3)
      .lean();

    if (products.length === 0) {
      return NextResponse.json({
        message: "No products in stock",
        sent: 0,
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of eligibleUsers) {
      try {
        // Generate personalized pitch
        const productNames = products
          .map((p: any) => `${p.name} (${formatNaira(p.price)})`)
          .join(", ");

        const aiIntro = await generateAIResponse(
          `Generate a short promotional message for: ${productNames}. Customer name: ${user.name || "there"}.`,
          [],
          products.map((p: any) => ({
            name: p.name,
            price: p.price,
            slug: p.slug,
            category: p.category,
          }))
        );

        await sendTextMessage(user.phone, `📣 ${aiIntro.reply}`);

        // Send first product image
        if ((products[0] as any).images?.[0]) {
          await sendImageMessage(
            user.phone,
            (products[0] as any).images[0],
            `🔥 ${(products[0] as any).name} — ${formatNaira((products[0] as any).price)}`
          );
        }

        await sendInteractiveButtons(
          user.phone,
          "🛍️ Don't miss out!",
          [
            { id: "btn_catalog", title: "🛍️ Shop Now" },
            {
              id: `prod_${(products[0] as any).slug}`,
              title: "👀 View Details",
            },
          ]
        );

        user.lastPromoSentAt = new Date();
        await user.save();
        sentCount++;

        // Small delay between users
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err: any) {
        errors.push(`${user.phone}: ${err.message}`);
      }
    }

    return NextResponse.json({
      message: `Promotions sent to ${sentCount}/${eligibleUsers.length} users`,
      sent: sentCount,
      total: eligibleUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending promotions:", error);
    return NextResponse.json(
      { error: "Failed to send promotions" },
      { status: 500 }
    );
  }
}
