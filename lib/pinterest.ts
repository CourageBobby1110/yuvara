import axios from "axios";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

export interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
  pin_count?: number;
}

export interface PinterestApiError {
  code?: number;
  message?: string;
  isTrialPending?: boolean;
}

/**
 * Parses Pinterest API errors into friendly actionable messages.
 */
export function parsePinterestError(err: any): PinterestApiError {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const code = data?.code;
  const message = data?.message || err?.message || "Unknown Pinterest API error";

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
      message: "Pinterest authentication failed. Please verify your Access Token.",
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
