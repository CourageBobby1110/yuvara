import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export async function GET() {
  try {
    const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    const fbAccessToken = process.env.FB_ACCESS_TOKEN;
    const gaPropertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const gaCredentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    const data: any = {
      facebook: null,
      google: null,
      errors: [],
    };

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
