import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import dbConnect from "@/lib/db";
import UserActivity from "@/models/UserActivity";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "worker")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    const fbAccessToken = process.env.FB_ACCESS_TOKEN;
    const gaPropertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const gaCredentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    const data: any = {
      internal: [],
      facebook: null,
      google: null,
      errors: [],
    };

    // 1. Fetch Internal Database Analytics
    try {
      await dbConnect();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const internalStats = await UserActivity.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            action: { $in: ["page_view", "app_open"] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            pageViews: { $sum: 1 },
            uniqueVisitors: {
              $addToSet: {
                $ifNull: [
                  "$email",
                  { $ifNull: ["$metadata.guestId", "$_id"] },
                ],
              },
            },
          },
        },
        {
          $project: {
            date: "$_id",
            pageViews: 1,
            visitors: { $size: "$uniqueVisitors" },
            _id: 0,
          },
        },
        { $sort: { date: 1 } },
      ]);

      // Fill in all dates for the last 7 days (including today)
      const last7DaysData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];

        const dayData = internalStats.find(
          (item: any) => item.date === dateString
        );
        last7DaysData.push({
          date: dateString,
          pageViews: dayData ? dayData.pageViews : 0,
          visitors: dayData ? dayData.visitors : 0,
        });
      }
      data.internal = last7DaysData;
    } catch (error: any) {
      console.error("Internal Analytics Error:", error);
      data.errors.push(`Internal Analytics Error: ${error.message}`);
    }

    // Fetch Facebook Data
    if (fbPixelId && fbAccessToken) {
      try {
        // Fetch stats for the last 7 days
        // Aggregation by event gives us counts per event type
        const startTime = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
        const endTime = Math.floor(Date.now() / 1000);

        const fbUrl = `https://graph.facebook.com/v19.0/${fbPixelId}/stats?access_token=${fbAccessToken}&aggregation=event&start_time=${startTime}&end_time=${endTime}`;

        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();

        if (fbData.error) {
          console.error("FB API Error:", fbData.error);
          data.errors.push(`Facebook API Error: ${fbData.error.message}`);
        } else {
          data.facebook = fbData;
        }
      } catch (error: any) {
        console.error("Facebook Fetch Error:", error);
        data.errors.push("Failed to fetch Facebook data");
      }
    } else {
      if (!fbPixelId) data.errors.push("Missing NEXT_PUBLIC_FB_PIXEL_ID");
      if (!fbAccessToken) data.errors.push("Missing FB_ACCESS_TOKEN");
    }

    // Fetch Google Analytics Data
    if (gaPropertyId && gaCredentialsJson) {
      try {
        const credentials = JSON.parse(gaCredentialsJson);
        const analyticsDataClient = new BetaAnalyticsDataClient({
          credentials,
        });

        // Run report for last 7 days
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${gaPropertyId}`,
          dateRanges: [
            {
              startDate: "7daysAgo",
              endDate: "today",
            },
          ],
          dimensions: [
            {
              name: "date",
            },
          ],
          metrics: [
            {
              name: "activeUsers",
            },
            {
              name: "eventCount",
            },
            {
              name: "sessions",
            },
          ],
          orderBys: [
            {
              dimension: {
                orderType: "ALPHANUMERIC",
                dimensionName: "date",
              },
            },
          ],
        });

        data.google = response;
      } catch (error: any) {
        console.error("Google Analytics Error:", error);
        data.errors.push(`Google Analytics Error: ${error.message}`);
      }
    } else {
      if (!gaPropertyId)
        data.errors.push("Missing GOOGLE_ANALYTICS_PROPERTY_ID");
      if (!gaCredentialsJson)
        data.errors.push("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
