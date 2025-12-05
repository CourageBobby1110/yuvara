import SiteSettings from "@/models/SiteSettings";
import axios from "axios";

export async function getValidCJAccessToken(): Promise<string | null> {
  const settings = await SiteSettings.findOne().sort({ createdAt: -1 });

  if (!settings || !settings.cjAccessToken) {
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  if (!settings.cjTokenExpiry) {
    return null;
  }
  const now = new Date();
  const expiry = new Date(settings.cjTokenExpiry);
  const fiveMinutes = 5 * 60 * 1000;

  if (now.getTime() + fiveMinutes >= expiry.getTime()) {
    // Token expired or expiring soon, try to refresh
    if (settings.cjRefreshToken) {
      try {
        // CJ doesn't seem to have a dedicated refresh endpoint documented clearly in the chunks I read,
        // but usually it involves re-authenticating or using a refresh token endpoint.
        // The documentation mentioned "Refresh access token (POST)" in section 1.2.
        // Let's assume the endpoint is .../authentication/refreshAccessToken based on standard patterns or re-read docs if needed.
        // Wait, I saw "1.2 Refresh access token (POST)" in the docs list.
        // Let's try to find the URL for refresh.
        // If I can't find it, I'll just re-authenticate using the API Key if available.

        // Actually, re-authenticating with API Key is safer if we have it.
        if (settings.cjDropshippingApiKey) {
          const response = await axios.post(
            "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
            {
              apiKey: settings.cjDropshippingApiKey,
            }
          );

          if (response.data?.result && response.data?.data) {
            const { accessToken, refreshToken, accessTokenExpiryDate } =
              response.data.data;

            await SiteSettings.findOneAndUpdate(
              { _id: settings._id },
              {
                cjAccessToken: accessToken,
                cjRefreshToken: refreshToken,
                cjTokenExpiry: new Date(accessTokenExpiryDate),
              }
            );

            return accessToken;
          }
        }
      } catch (error) {
        console.error("Failed to refresh CJ token:", error);
        return null;
      }
    }
    return null;
  }

  return settings.cjAccessToken;
}
