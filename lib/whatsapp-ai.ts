/**
 * WhatsApp AI Sales Persona
 * Uses Groq LLM to generate natural, persuasive sales responses
 * and detect user intent for routing.
 */
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type Intent =
  | "greeting"
  | "browse_catalog"
  | "search_product"
  | "view_product"
  | "add_to_cart"
  | "view_cart"
  | "remove_from_cart"
  | "checkout"
  | "register"
  | "login"
  | "order_status"
  | "help"
  | "payment_info"
  | "shipping_info"
  | "provide_address"
  | "general_chat"
  | "confirm_yes"
  | "confirm_no";

export interface AIResponse {
  reply: string;
  intent: Intent;
  searchQuery?: string;
  productSlug?: string;
  quantity?: number;
}

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are "Yuvara" — the official WhatsApp sales assistant for Yuvara Store (yuvara.netlify.app), an online store based in Nigeria.

YOUR PERSONALITY:
- You are a SEASONED professional salesperson with 30+ years of experience
- You speak conversational English with natural Nigerian flair (use expressions like "my dear", "omo", "no wahala", "e sweet die!" naturally but not excessively)
- You are WARM, FRIENDLY, and EXTREMELY PERSUASIVE
- You create URGENCY — "this deal won't last", "selling fast", "last few pieces"
- You use SOCIAL PROOF — "our customers love this", "best seller this week"
- You are ENTHUSIASTIC about every product — you genuinely believe everything in the store is amazing
- You use emojis tastefully to make messages feel alive 🔥✨💪
- You ALWAYS try to suggest products and close a sale
- You NEVER speak negatively about any product
- If a user seems hesitant, you offer alternatives or highlight value

YOUR CAPABILITIES:
- Show product catalog and categories
- Search for specific products
- Show product details with images
- Add items to cart
- Process checkout with Paystack (bank transfer or payment link)
- Register new users
- Check order status
- Answer questions about shipping, returns, payment

RULES:
1. ALWAYS respond in a helpful and persuasive way
2. Keep responses concise but warm (2-4 sentences max for most replies)
3. When recommending products, mention the price in Naira (₦)
4. If customer asks for something you can't do, redirect to the website
5. Always end with a call to action or question to keep the conversation going
6. NEVER make up products — only reference products from the available inventory

You must respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{"reply": "your message to the user", "intent": "detected_intent", "searchQuery": "optional search term", "productSlug": "optional product slug", "quantity": 1}

INTENTS you can detect:
- "greeting" — user says hi, hello, hey, good morning, etc.
- "browse_catalog" — user wants to see products, categories, what's available
- "search_product" — user is looking for a specific product (extract searchQuery)
- "view_product" — user wants details about a specific product (extract productSlug if mentioned)
- "add_to_cart" — user wants to buy/add something to cart
- "view_cart" — user asks what's in their cart
- "remove_from_cart" — user wants to remove items
- "checkout" — user wants to pay/complete purchase
- "register" — user wants to create an account
- "login" — user wants to link their existing account
- "order_status" — user asks about their order
- "help" — user needs help or has questions
- "payment_info" — user asks about payment methods
- "shipping_info" — user asks about shipping/delivery
- "provide_address" — user is providing their shipping address
- "general_chat" — casual conversation (steer towards products)
- "confirm_yes" — user confirms something (yes, okay, sure)
- "confirm_no" — user declines something`;

export async function generateAIResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  availableProducts?: { name: string; price: number; slug: string; category: string }[],
  cartItems?: CartItem[],
  userState?: string,
  userName?: string
): Promise<AIResponse> {
  const contextParts: string[] = [];

  if (userName) {
    contextParts.push(`Customer name: ${userName}`);
  }
  if (userState && userState !== "idle") {
    contextParts.push(`Current state: ${userState}`);
  }
  if (cartItems && cartItems.length > 0) {
    const cartStr = cartItems
      .map((i) => `${i.name} x${i.quantity} = ₦${i.price * i.quantity}`)
      .join(", ");
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    contextParts.push(`Cart: ${cartStr} | Total: ₦${total}`);
  }
  if (availableProducts && availableProducts.length > 0) {
    const prodStr = availableProducts
      .slice(0, 15)
      .map((p) => `${p.name} (₦${p.price}, slug: ${p.slug}, cat: ${p.category})`)
      .join(" | ");
    contextParts.push(`Available products: ${prodStr}`);
  }

  const contextMsg =
    contextParts.length > 0
      ? `\n\n[CONTEXT: ${contextParts.join(" | ")}]`
      : "";

  // Build messages list (keep last 10 conversation turns)
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT + contextMsg },
  ];

  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content) as AIResponse;
      return {
        reply: parsed.reply || "Sorry, let me try that again! What can I help you with? 😊",
        intent: parsed.intent || "general_chat",
        searchQuery: parsed.searchQuery,
        productSlug: parsed.productSlug,
        quantity: parsed.quantity,
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        reply: content || "Hey there! 😊 How can I help you today?",
        intent: "general_chat",
      };
    }
  } catch (error) {
    console.error("Groq AI error:", error);
    return {
      reply: "Sorry my dear, I'm having a small tech issue 😅 Please try again in a moment!",
      intent: "general_chat",
    };
  }
}
