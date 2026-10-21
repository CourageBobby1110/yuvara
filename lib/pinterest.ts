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
 * Sanitizes Pinterest client secret to strip accidental quotes, whitespace, or known typos.
 */
export function sanitizePinterestSecret(secret: string): string {
  if (!secret) return "";
  let cleaned = secret.trim().replace(/['"]/g, "");
  // Correct the known 41-char typo where an 's' was inserted after 1618036 app secret prefix
  if (cleaned.length === 41 && cleaned.startsWith("a7519s84")) {
    cleaned = cleaned.replace("a7519s84", "a751984");
  }
  return cleaned;
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
  const cleanId = clientId.trim();
  const cleanSecret = sanitizePinterestSecret(clientSecret);
  const cleanCode = code.trim();
  const cleanUri = redirectUri.trim();

  try {
    const credentials = Buffer.from(
      `${cleanId}:${cleanSecret}`
    ).toString("base64");
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: cleanCode,
      redirect_uri: cleanUri,
      continuous_refresh: "true",
    });

    console.log(
      `[Pinterest OAuth] Sending code exchange request: clientId=${cleanId}, secretLength=${cleanSecret.length}, redirectUri=${cleanUri}`
    );

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

    console.log("[Pinterest OAuth] Token exchange successful! Scope:", res.data?.scope);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(
      `[Pinterest OAuth Error] status=${status}, data=`,
      data || err?.message
    );
    if (status === 401 || data?.code === 2) {
      throw new Error(
        "Pinterest rejected your App ID or App Secret (Authentication failed). Please re-copy your App ID and App Secret from the Pinterest Developer Portal."
      );
    }
    if (data?.error === "invalid_grant" || data?.message?.includes("code") || data?.code === 283) {
      throw new Error(
        "Authorization code expired or invalid grant. Please click 'Connect with Pinterest' again to grant fresh access."
      );
    }
    const parsed = parsePinterestError(err);
    throw new Error(parsed.message || "Failed to exchange authorization code with Pinterest");
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
  const cleanId = clientId.trim();
  const cleanSecret = sanitizePinterestSecret(clientSecret);
  try {
    const credentials = Buffer.from(
      `${cleanId}:${cleanSecret}`
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
 * Executes a Pinterest API action with automatic token refresh on 401/expired token errors.
 */
export async function withPinterestTokenRefresh<T>(
  action: (token: string) => Promise<T>,
  credentials: {
    accessToken: string;
    refreshToken?: string;
    appId?: string;
    appSecret?: string;
    onTokenRefreshed?: (newToken: string, newRefreshToken?: string) => Promise<void>;
  }
): Promise<T> {
  try {
    return await action(credentials.accessToken);
  } catch (err: any) {
    const isAuthErr =
      err?.code === 2 ||
      err?.status === 401 ||
      err?.response?.status === 401 ||
      err?.message?.toLowerCase().includes("authentication failed") ||
      err?.message?.toLowerCase().includes("invalid or expired");

    if (
      isAuthErr &&
      credentials.refreshToken &&
      credentials.appId &&
      credentials.appSecret
    ) {
      console.log("[Pinterest Token Auto-Refresh] Access token expired. Refreshing token...");
      try {
        const tokenRes = await refreshPinterestToken(
          credentials.refreshToken,
          credentials.appId,
          credentials.appSecret
        );
        if (tokenRes.access_token) {
          if (credentials.onTokenRefreshed) {
            await credentials.onTokenRefreshed(
              tokenRes.access_token,
              tokenRes.refresh_token
            );
          }
          return await action(tokenRes.access_token);
        }
      } catch (refreshErr) {
        console.error("[Pinterest Token Auto-Refresh Failed]", refreshErr);
      }
    }
    throw err;
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
  let message =
    data?.message ||
    data?.error_description ||
    data?.error ||
    err?.message ||
    "Unknown Pinterest API error";

  // If Pinterest included specific field validation details
  if (Array.isArray(data?.details) && data.details.length > 0) {
    const detailMsg = data.details
      .map((d: any) => d.message || d.field || JSON.stringify(d))
      .join("; ");
    message = `${message} (${detailMsg})`;
  }

  // Code 29 = "Apps with Trial access may not create Pins in production"
  // Code 3 = "Your application consumer type is not supported"
  if (
    code === 29 ||
    code === 3 ||
    message?.toLowerCase().includes("trial access") ||
    message?.toLowerCase().includes("consumer type")
  ) {
    return {
      code,
      message:
        "Standard Access Required: Pinterest Trial access does not permit creating live Pins in production. Board creation and OAuth are fully active—please submit your integration demo for Standard Access approval to sync Pins.",
      isTrialPending: true,
    };
  }

  // Code 58 = Board with name already exists
  if (code === 58 || message?.toLowerCase().includes("already have a board with this name")) {
    return {
      code: 58,
      message: "A Pinterest board with this name already exists in your account.",
    };
  }

  if (status === 401 || code === 2) {
    return {
      code,
      message:
        "Pinterest authentication failed: Your access token is invalid or expired. Please re-authenticate via OAuth or refresh your token in settings.",
    };
  }

  if (status === 403) {
    return {
      code,
      message: `Pinterest permission error (403): ${message}. Verify that your app has the required scopes (boards:read, boards:write).`,
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
 * Create a new board on Pinterest.
 * If a board with the requested name already exists (code 58), automatically
 * retrieves and returns that existing board.
 */
export async function createPinterestBoard(
  token: string,
  name: string,
  description: string = "Shop curated collections and products from YuVara",
  privacy: "PUBLIC" | "PROTECTED" | "SECRET" = "PUBLIC"
): Promise<PinterestBoard> {
  const cleanName = (name || "").trim().slice(0, 50);
  const cleanDescription = (description || "")
    .trim()
    .slice(0, 500);

  if (!cleanName) {
    throw new Error("Board name is required and cannot be empty.");
  }

  try {
    const res = await axios.post(
      `${PINTEREST_API_BASE}/boards`,
      {
        name: cleanName,
        description: cleanDescription,
        privacy,
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
    // If board already exists, gracefully locate and return the existing board
    const errCode = err?.response?.data?.code;
    const errMsg = err?.response?.data?.message || "";
    if (errCode === 58 || errMsg.toLowerCase().includes("already have a board with this name")) {
      try {
        const existingBoards = await getPinterestBoards(token);
        const match = existingBoards.find(
          (b) => b.name?.toLowerCase().trim() === cleanName.toLowerCase()
        );
        if (match) {
          return match;
        }
      } catch {
        // Fall through to normal error parsing if board list fails
      }
    }

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
