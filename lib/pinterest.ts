import axios from "axios";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
  pin_count?: number;
}

export interface PinterestUserAccount {
  username?: string;
  account_type?: string;
  profile_image?: string;
  website_url?: string;
  business_name?: string;
}

export interface PinterestTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export interface PinterestApiError {
  code?: number;
  message?: string;
  isTrialPending?: boolean;
}

export const PINTEREST_OAUTH_SCOPES = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
  "user_accounts:read",
];

/**
 * Builds Pinterest OAuth 2.0 authorization URL
 */
export function getPinterestAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string = "yuvara_pinterest_auth"
): string {
  const scopeParam = PINTEREST_OAUTH_SCOPES.join(",");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopeParam,
    state,
  });
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

/**
 * Exchanges authorization code for access and refresh tokens
 */
export async function exchangePinterestCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<PinterestTokenResponse> {
  try {
    const credentials = Buffer.from(
      `${clientId.trim()}:${clientSecret.trim()}`
    ).toString("base64");
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code.trim(),
      redirect_uri: redirectUri.trim(),
      continuous_refresh: "true",
    });

    const res = await axios.post(
      `${PINTEREST_API_BASE}/oauth/token`,
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.data;
  } catch (err: any) {
    const parsed = parsePinterestError(err);
    throw parsed;
  }
}

/**
 * Refreshes an expired Pinterest access token
 */
export async function refreshPinterestToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<PinterestTokenResponse> {
  try {
    const credentials = Buffer.from(
      `${clientId.trim()}:${clientSecret.trim()}`
    ).toString("base64");
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken.trim(),
    });

    const res = await axios.post(
      `${PINTEREST_API_BASE}/oauth/token`,
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return res.data;
  } catch (err: any) {
    const parsed = parsePinterestError(err);
    throw parsed;
  }
}

/**
 * Retrieves the currently authenticated Pinterest user account details
 */
export async function getPinterestUserAccount(
  token: string
): Promise<PinterestUserAccount> {
  try {
    const res = await axios.get(`${PINTEREST_API_BASE}/user_account`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return res.data || {};
  } catch (err: any) {
    const parsed = parsePinterestError(err);
    throw parsed;
  }
}

/**
 * Parses Pinterest API errors into friendly actionable messages.
 */
export function parsePinterestError(err: any): PinterestApiError {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const code = data?.code;
  const message =
    data?.message ||
    data?.error_description ||
    data?.error ||
    err?.message ||
    "Unknown Pinterest API error";

  // Code 3 = "Your application consumer type is not supported" -> App is in Trial review
  if (code === 3 || message?.toLowerCase().includes("consumer type")) {
    return {
      code,
      message:
        "Trial access pending: Pinterest is still reviewing your Developer App. Token will activate as soon as Pinterest approves it.",
      isTrialPending: true,
    };
  }

  if (status === 401) {
    return {
      code,
      message:
        "Pinterest authentication failed. Your access token is invalid or expired. Please generate a fresh token in the Pinterest Developer Portal.",
    };
  }

  return { code, message };
}

/**
 * Fetch all boards for the authenticated Pinterest user
 */
export async function getPinterestBoards(token: string): Promise<PinterestBoard[]> {
  try {
    const res = await axios.get(`${PINTEREST_API_BASE}/boards`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: {
        page_size: 100,
      },
    });

    return res.data?.items || [];
  } catch (err: any) {
    const parsed = parsePinterestError(err);
    throw parsed;
  }
}

/**
 * Create a new board on Pinterest
 */
export async function createPinterestBoard(
  token: string,
  name: string,
  description: string = "Exclusive curated products from YuVara"
): Promise<PinterestBoard> {
  try {
    const res = await axios.post(
      `${PINTEREST_API_BASE}/boards`,
      {
        name,
        description,
        privacy: "PUBLIC",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (err: any) {
    const parsed = parsePinterestError(err);
    throw parsed;
  }
}

/**
 * Publish a single product as a Pin to Pinterest
 */
export async function createPinterestPin(
  token: string,
  boardId: string,
  product: {
    name: string;
    description?: string;
    slug: string;
    price: number;
    images: string[];
    category?: string;
  },
  baseUrl: string
): Promise<{ id: string; link?: string }> {
  try {
    const cleanDescription = (product.description || "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    const priceText = `$${Number(product.price || 0).toFixed(2)}`;
    const fullDescription = `${product.name} - Available now on YuVara for ${priceText}. ${cleanDescription}`.slice(
      0,
      800
    );

    // Pick first valid image URL
    let imageUrl = product.images?.[0] || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    if (!imageUrl) {
      imageUrl = `${baseUrl}/icon.png`;
    }

    const link = `${baseUrl}/products/${product.slug}`;

    const res = await axios.post(
      `${PINTEREST_API_BASE}/pins`,
      {
        title: product.name.slice(0, 100),
        description: fullDescription,
        link,
        alt_text: product.name.slice(0, 500),
        board_id: boardId,
        media_source: {
          source_type: "image_url",
          url: imageUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (err: any) {
    const parsed = parsePinterestError(err);
    throw parsed;
  }
}
