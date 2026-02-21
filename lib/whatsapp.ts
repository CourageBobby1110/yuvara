/**
 * WhatsApp Cloud API Helper
 * Handles sending messages, images, videos, interactive buttons, and lists.
 */

const WA_API_VERSION = "v21.0";

function getApiUrl() {
  return `https://graph.facebook.com/${WA_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function sendRequest(body: object) {
  const res = await fetch(getApiUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("WhatsApp API Error:", JSON.stringify(err, null, 2));
  }
  return res;
}

// ── Text Message ──
export async function sendTextMessage(phone: string, text: string) {
  // WhatsApp limits text to 4096 chars. Split if needed.
  const chunks = splitText(text, 4000);
  for (const chunk of chunks) {
    await sendRequest({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: chunk },
    });
  }
}

// ── Image Message ──
export async function sendImageMessage(
  phone: string,
  imageUrl: string,
  caption?: string
) {
  await sendRequest({
    messaging_product: "whatsapp",
    to: phone,
    type: "image",
    image: {
      link: imageUrl,
      ...(caption ? { caption: caption.slice(0, 1024) } : {}),
    },
  });
}

// ── Video Message ──
export async function sendVideoMessage(
  phone: string,
  videoUrl: string,
  caption?: string
) {
  await sendRequest({
    messaging_product: "whatsapp",
    to: phone,
    type: "video",
    video: {
      link: videoUrl,
      ...(caption ? { caption: caption.slice(0, 1024) } : {}),
    },
  });
}

// ── Interactive Buttons (max 3) ──
export async function sendInteractiveButtons(
  phone: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  headerText?: string,
  footerText?: string
) {
  await sendRequest({
    messaging_product: "whatsapp",
    to: phone,
    type: "interactive",
    interactive: {
      type: "button",
      ...(headerText
        ? { header: { type: "text", text: headerText } }
        : {}),
      body: { text: bodyText },
      ...(footerText ? { footer: { text: footerText } } : {}),
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

// ── Interactive List (max 10 rows per section) ──
export async function sendInteractiveList(
  phone: string,
  bodyText: string,
  buttonText: string,
  sections: {
    title: string;
    rows: { id: string; title: string; description?: string }[];
  }[],
  headerText?: string,
  footerText?: string
) {
  await sendRequest({
    messaging_product: "whatsapp",
    to: phone,
    type: "interactive",
    interactive: {
      type: "list",
      ...(headerText
        ? { header: { type: "text", text: headerText } }
        : {}),
      body: { text: bodyText },
      ...(footerText ? { footer: { text: footerText } } : {}),
      action: {
        button: buttonText.slice(0, 20),
        sections: sections.map((s) => ({
          title: s.title.slice(0, 24),
          rows: s.rows.slice(0, 10).map((r) => ({
            id: r.id.slice(0, 200),
            title: r.title.slice(0, 24),
            ...(r.description
              ? { description: r.description.slice(0, 72) }
              : {}),
          })),
        })),
      },
    },
  });
}

// ── Mark message as read (blue ticks) ──
export async function markAsRead(messageId: string) {
  await sendRequest({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

// ── Helper: split long text ──
function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at last newline before maxLen
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx === -1 || splitIdx < maxLen * 0.5) {
      splitIdx = remaining.lastIndexOf(" ", maxLen);
    }
    if (splitIdx === -1) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }
  return chunks;
}

// ── Format price in Naira ──
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}
