import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { sendBroadcastPushNotification } from "@/lib/notifications";

// A list of high-converting, visually rich marketing messages to rotate through
const PROMOTIONAL_TEMPLATES = [
  {
    title: "New Drops Just Landed! 🔥",
    body: "Fresh arrivals have just been added to the store. Tap to shop the latest drops now!",
    screen: "/shop",
  },
  {
    title: "Daily Flash Sale! ⚡",
    body: "Get up to 30% off on today's featured items. Limited stock available, don't miss out!",
    screen: "/sale",
  },
  {
    title: "Free Shipping Today Only! 🚚",
    body: "Use code FREESHIP at checkout to get free delivery on all orders today. Tap to browse.",
    screen: "/shop",
  },
  {
    title: "Your Cart is Waiting! 👀",
    body: "Items you love are waiting for you. Complete your checkout now and get 5% off automatically.",
    screen: "/cart",
  },
];

export async function GET(req: Request) {
  try {
    // 1. Verify Request Token to prevent abuse
    const { searchParams } = new URL(req.url);
    const clientSecret = searchParams.get("secret") || req.headers.get("x-cron-secret");
    
    if (process.env.CRON_SECRET && clientSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await dbConnect();

    // 2. Randomly select a high-fidelity marketing template
    const template = PROMOTIONAL_TEMPLATES[Math.floor(Math.random() * PROMOTIONAL_TEMPLATES.length)];

    console.log(`Executing daily cron: Sending "${template.title}"...`);

    // 3. Dispatch multicast notifications to all active FCM devices
    await sendBroadcastPushNotification({
      title: template.title,
      body: template.body,
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        screen: template.screen,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Daily promotion notifications sent successfully.",
      notification: template,
    });
  } catch (error) {
    console.error("Daily promotions cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
