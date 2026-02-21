/**
 * WhatsApp Webhook Route
 * GET  — Meta webhook verification
 * POST — Incoming message handler with AI-powered conversation routing
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WhatsAppSession from "@/models/WhatsAppSession";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import {
  sendTextMessage,
  sendImageMessage,
  sendVideoMessage,
  sendInteractiveButtons,
  sendInteractiveList,
  markAsRead,
  formatNaira,
} from "@/lib/whatsapp";
import { generateAIResponse } from "@/lib/whatsapp-ai";
import {
  createPaystackCustomer,
  createDedicatedVirtualAccount,
  createPaymentLink,
} from "@/lib/paystack-dva";
import bcrypt from "bcryptjs";

// ══════════════════════════════════════════
//  GET — Webhook Verification
// ══════════════════════════════════════════
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ══════════════════════════════════════════
//  POST — Incoming Message Handler
// ══════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // WhatsApp sends status updates too — ignore those
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages || value.messages.length === 0) {
      return NextResponse.json({ status: "ok" });
    }

    const message = value.messages[0];
    const senderPhone = message.from;
    const messageId = message.id;
    const senderName =
      value.contacts?.[0]?.profile?.name || "Customer";

    // Extract message text based on type
    let userText = "";
    let buttonPayload = "";

    if (message.type === "text") {
      userText = message.text.body;
    } else if (message.type === "interactive") {
      if (message.interactive.type === "button_reply") {
        userText = message.interactive.button_reply.title;
        buttonPayload = message.interactive.button_reply.id;
      } else if (message.interactive.type === "list_reply") {
        userText = message.interactive.list_reply.title;
        buttonPayload = message.interactive.list_reply.id;
      }
    } else {
      // Image, sticker, etc. — respond that we can only handle text
      await sendTextMessage(
        senderPhone,
        "Hey! 😊 I can best help you with text messages. What are you looking for today?"
      );
      return NextResponse.json({ status: "ok" });
    }

    // Mark as read immediately
    await markAsRead(messageId);

    // Connect to DB and load/create session
    await dbConnect();
    let session = await WhatsAppSession.findOne({ phone: senderPhone });

    if (!session) {
      session = await WhatsAppSession.create({
        phone: senderPhone,
        name: senderName,
        state: "idle",
      });
    }

    session.lastMessageAt = new Date();
    if (senderName && senderName !== "Customer") {
      session.name = senderName;
    }

    // ── Handle button/list payloads (direct routing) ──
    if (buttonPayload) {
      await handleButtonPayload(
        senderPhone,
        buttonPayload,
        userText,
        session
      );
      await session.save();
      return NextResponse.json({ status: "ok" });
    }

    // ── Handle multi-step flows based on current state ──
    if (session.state !== "idle" && session.state !== "browsing") {
      const handled = await handleStatefulFlow(
        senderPhone,
        userText,
        session
      );
      if (handled) {
        await session.save();
        return NextResponse.json({ status: "ok" });
      }
    }

    // ── AI-powered intent routing ──
    const products = await Product.find()
      .select("name price slug category isFeatured")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(20)
      .lean();

    const cartItems = session.cart.map((c: any) => ({
      name: c.name,
      price: c.price,
      quantity: c.quantity,
    }));

    const aiResponse = await generateAIResponse(
      userText,
      session.conversationHistory || [],
      products.map((p: any) => ({
        name: p.name,
        price: p.price,
        slug: p.slug,
        category: p.category,
      })),
      cartItems,
      session.state,
      session.name
    );

    // Save conversation turn
    session.conversationHistory.push(
      { role: "user", content: userText },
      { role: "assistant", content: aiResponse.reply }
    );

    // ── Route by intent ──
    switch (aiResponse.intent) {
      case "greeting":
        await handleGreeting(senderPhone, session, aiResponse.reply);
        break;

      case "browse_catalog":
        await handleBrowseCatalog(senderPhone, session, aiResponse.reply);
        break;

      case "search_product":
        await handleSearchProduct(
          senderPhone,
          session,
          aiResponse.searchQuery || userText,
          aiResponse.reply
        );
        break;

      case "view_product":
        await handleViewProduct(
          senderPhone,
          session,
          aiResponse.productSlug || "",
          aiResponse.reply
        );
        break;

      case "add_to_cart":
        await handleAddToCart(senderPhone, session, aiResponse);
        break;

      case "view_cart":
        await handleViewCart(senderPhone, session, aiResponse.reply);
        break;

      case "checkout":
        await handleCheckout(senderPhone, session, aiResponse.reply);
        break;

      case "register":
        await handleStartRegistration(senderPhone, session, aiResponse.reply);
        break;

      case "order_status":
        await handleOrderStatus(senderPhone, session, aiResponse.reply);
        break;

      case "help":
      case "payment_info":
      case "shipping_info":
      case "general_chat":
      default:
        await sendTextMessage(senderPhone, aiResponse.reply);
        break;
    }

    session.state =
      aiResponse.intent === "browse_catalog"
        ? "browsing"
        : session.state === "browsing"
          ? "browsing"
          : "idle";

    await session.save();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "ok" }); // Always return 200 to WhatsApp
  }
}

// ══════════════════════════════════════════
//  Intent Handlers
// ══════════════════════════════════════════

async function handleGreeting(
  phone: string,
  session: any,
  aiReply: string
) {
  await sendTextMessage(phone, aiReply);

  // After greeting, show quick actions
  await sendInteractiveButtons(
    phone,
    "What would you like to do? 👇",
    [
      { id: "btn_catalog", title: "🛍️ Browse Products" },
      { id: "btn_cart", title: "🛒 My Cart" },
      { id: "btn_register", title: "📝 Register" },
    ],
    "Welcome to Yuvara! ✨"
  );
}

async function handleBrowseCatalog(
  phone: string,
  session: any,
  aiReply: string
) {
  await sendTextMessage(phone, aiReply);

  const products = await Product.find({ stock: { $gt: 0 } })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(10)
    .lean();

  if (products.length === 0) {
    await sendTextMessage(
      phone,
      "We're restocking right now! Check back soon 😊"
    );
    return;
  }

  // Send product list
  const rows = products.map((p: any) => ({
    id: `prod_${p.slug}`,
    title: p.name.slice(0, 24),
    description: `${formatNaira(p.price)} | ${p.category}`,
  }));

  await sendInteractiveList(
    phone,
    `🛍️ Here are our top products! Tap to see details:`,
    "View Products",
    [{ title: "Our Collection", rows }],
    "Yuvara Store",
    "Prices in Naira (₦)"
  );

  // Also send the first product image as a teaser
  if (products[0] && (products[0] as any).images?.[0]) {
    await sendImageMessage(
      phone,
      (products[0] as any).images[0],
      `🔥 ${(products[0] as any).name} — ${formatNaira((products[0] as any).price)}\nTap the list above to see more!`
    );
  }
}

async function handleSearchProduct(
  phone: string,
  session: any,
  query: string,
  aiReply: string
) {
  const searchRegex = new RegExp(query, "i");
  const products = await Product.find({
    $or: [
      { name: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
    ],
    stock: { $gt: 0 },
  })
    .limit(8)
    .lean();

  if (products.length === 0) {
    await sendTextMessage(
      phone,
      `${aiReply}\n\nI couldn't find "${query}" in our store right now. Want me to show you what we have? 😊`
    );
    await sendInteractiveButtons(phone, "Want to browse instead?", [
      { id: "btn_catalog", title: "🛍️ Browse All" },
    ]);
    return;
  }

  await sendTextMessage(phone, aiReply);

  const rows = products.map((p: any) => ({
    id: `prod_${p.slug}`,
    title: p.name.slice(0, 24),
    description: `${formatNaira(p.price)} | ${p.category}`,
  }));

  await sendInteractiveList(
    phone,
    `Found ${products.length} item(s) for "${query}":`,
    "View Results",
    [{ title: "Search Results", rows }]
  );
}

async function handleViewProduct(
  phone: string,
  session: any,
  slug: string,
  aiReply: string
) {
  const product = await Product.findOne({ slug }).lean();

  if (!product) {
    await sendTextMessage(phone, aiReply);
    return;
  }

  const p = product as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://yuvara.netlify.app";

  // Send all product images (max 3)
  const images = p.images?.slice(0, 3) || [];
  for (let i = 0; i < images.length; i++) {
    const caption =
      i === 0
        ? `✨ *${p.name}*\n💰 Price: ${formatNaira(p.price)}\n📦 ${p.stock > 0 ? `In Stock (${p.stock} left)` : "Out of Stock"}\n\n${p.description?.slice(0, 500) || ""}`
        : `${p.name} — Photo ${i + 1}`;
    await sendImageMessage(phone, images[i], caption);
  }

  // Send video if available
  if (p.videos && p.videos.length > 0) {
    await sendVideoMessage(
      phone,
      p.videos[0],
      `🎬 Watch ${p.name} in action!`
    );
  }

  // Show size/color options if available
  let optionsText = "";
  if (p.sizes?.length > 0) {
    optionsText += `📏 Sizes: ${p.sizes.join(", ")}\n`;
  }
  if (p.colors?.length > 0) {
    optionsText += `🎨 Colors: ${p.colors.join(", ")}\n`;
  }
  if (optionsText) {
    await sendTextMessage(phone, optionsText.trim());
  }

  // Action buttons
  if (p.stock > 0) {
    await sendInteractiveButtons(
      phone,
      `Want to grab this? 🛒`,
      [
        { id: `add_${p.slug}`, title: "🛒 Add to Cart" },
        { id: "btn_catalog", title: "🛍️ See More" },
        { id: `link_${p.slug}`, title: "🔗 View on Site" },
      ],
      p.name
    );
  } else {
    await sendTextMessage(
      phone,
      `This one is out of stock right now 😢\nBut check out our other amazing items!`
    );
    await sendInteractiveButtons(phone, "Keep shopping?", [
      { id: "btn_catalog", title: "🛍️ Browse More" },
    ]);
  }

  session.state = "viewing_product";
  session.tempData = { lastViewedSlug: p.slug };
}

async function handleAddToCart(
  phone: string,
  session: any,
  aiResponse: any
) {
  const slug =
    aiResponse.productSlug || session.tempData?.lastViewedSlug;

  if (!slug) {
    await sendTextMessage(
      phone,
      aiResponse.reply || "Which product would you like to add? Let me show you our collection!"
    );
    await handleBrowseCatalog(phone, session, "");
    return;
  }

  const product = await Product.findOne({ slug }).lean();
  if (!product) {
    await sendTextMessage(phone, "I can't find that product right now 😅");
    return;
  }

  const p = product as any;
  const qty = aiResponse.quantity || 1;

  // Check if already in cart
  const existingIdx = session.cart.findIndex(
    (c: any) => c.productId.toString() === p._id.toString()
  );

  if (existingIdx >= 0) {
    session.cart[existingIdx].quantity += qty;
  } else {
    session.cart.push({
      productId: p._id,
      name: p.name,
      price: p.price,
      quantity: qty,
      image: p.images?.[0] || "",
      variantColor: p.colors?.[0] || "",
      cjVid: p.variants?.[0]?.cjVid || "",
    });
  }

  const cartTotal = session.cart.reduce(
    (sum: number, c: any) => sum + c.price * c.quantity,
    0
  );

  await sendTextMessage(
    phone,
    `✅ Added *${p.name}* x${qty} to your cart!\n\n🛒 Cart total: ${formatNaira(cartTotal)} (${session.cart.length} item${session.cart.length > 1 ? "s" : ""})`
  );

  await sendInteractiveButtons(
    phone,
    "What's next? 😊",
    [
      { id: "btn_checkout", title: "💳 Checkout" },
      { id: "btn_catalog", title: "🛍️ Keep Shopping" },
      { id: "btn_cart", title: "🛒 View Cart" },
    ]
  );
}

async function handleViewCart(
  phone: string,
  session: any,
  aiReply: string
) {
  if (!session.cart || session.cart.length === 0) {
    await sendTextMessage(
      phone,
      "Your cart is empty! 🛒 Let me show you some amazing products! ✨"
    );
    await handleBrowseCatalog(phone, session, "");
    return;
  }

  let cartMessage = "🛒 *Your Cart:*\n\n";
  let total = 0;

  for (const item of session.cart) {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    cartMessage += `• ${item.name} x${item.quantity} — ${formatNaira(lineTotal)}\n`;
  }

  cartMessage += `\n*Total: ${formatNaira(total)}*`;

  await sendTextMessage(phone, cartMessage);

  await sendInteractiveButtons(
    phone,
    "Ready to checkout? 💪",
    [
      { id: "btn_checkout", title: "💳 Checkout" },
      { id: "btn_clear_cart", title: "🗑️ Clear Cart" },
      { id: "btn_catalog", title: "🛍️ Add More" },
    ]
  );
}

async function handleCheckout(
  phone: string,
  session: any,
  aiReply: string
) {
  if (!session.cart || session.cart.length === 0) {
    await sendTextMessage(
      phone,
      "Your cart is empty, my dear! Let's fill it up first 😊"
    );
    await handleBrowseCatalog(phone, session, "");
    return;
  }

  // Check if user is registered
  if (!session.userId) {
    await sendTextMessage(
      phone,
      "To complete your purchase, I'll need a few details. Let's get you set up real quick! 🚀"
    );
    session.state = "registering_name";
    await sendTextMessage(
      phone,
      "What's your full name? 📝"
    );
    await session.save();
    return;
  }

  // Check if we have shipping address
  if (
    !session.shippingAddress?.street ||
    !session.shippingAddress?.city
  ) {
    session.state = "awaiting_address";
    await sendTextMessage(
      phone,
      `${aiReply}\n\nPlease send your shipping address in this format:\n\n*Street, City, State, Zip Code*\n\nExample: 12 Allen Avenue, Ikeja, Lagos, 100001`
    );
    await session.save();
    return;
  }

  // Process payment
  await processPayment(phone, session);
}

async function handleStartRegistration(
  phone: string,
  session: any,
  aiReply: string
) {
  if (session.userId) {
    await sendTextMessage(
      phone,
      "You're already registered and linked! 🎉 What would you like to do?"
    );
    await sendInteractiveButtons(phone, "Quick actions:", [
      { id: "btn_catalog", title: "🛍️ Shop" },
      { id: "btn_orders", title: "📦 My Orders" },
    ]);
    return;
  }

  session.state = "registering_name";
  await sendTextMessage(phone, aiReply);
  await sendTextMessage(
    phone,
    "Let's get you started! What's your full name? 📝"
  );
}

async function handleOrderStatus(
  phone: string,
  session: any,
  aiReply: string
) {
  if (!session.userId) {
    await sendTextMessage(
      phone,
      "You need to register first so I can look up your orders! 😊"
    );
    await sendInteractiveButtons(phone, "Register now?", [
      { id: "btn_register", title: "📝 Register" },
    ]);
    return;
  }

  const orders = await Order.find({ user: session.userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  if (orders.length === 0) {
    await sendTextMessage(
      phone,
      "No orders yet! Let's change that — check out our collection! 😊✨"
    );
    await handleBrowseCatalog(phone, session, "");
    return;
  }

  let orderMsg = "📦 *Your Recent Orders:*\n\n";
  for (const order of orders) {
    const o = order as any;
    const statusEmoji: Record<string, string> = {
      pending: "⏳",
      processing: "📋",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    };
    orderMsg += `${statusEmoji[o.status] || "📋"} Order #${o._id.toString().slice(-6).toUpperCase()}\n`;
    orderMsg += `   Status: ${o.status}\n`;
    orderMsg += `   Total: ${formatNaira(o.total)}\n`;
    orderMsg += `   Date: ${new Date(o.createdAt).toLocaleDateString()}\n\n`;
  }

  await sendTextMessage(phone, orderMsg);
}

// ══════════════════════════════════════════
//  Button Payload Handler
// ══════════════════════════════════════════

async function handleButtonPayload(
  phone: string,
  payload: string,
  title: string,
  session: any
) {
  if (payload === "btn_catalog") {
    await handleBrowseCatalog(phone, session, "");
  } else if (payload === "btn_cart") {
    await handleViewCart(phone, session, "");
  } else if (payload === "btn_checkout") {
    await handleCheckout(phone, session, "");
  } else if (payload === "btn_register") {
    await handleStartRegistration(
      phone,
      session,
      "Great! Let's get you registered 🎉"
    );
  } else if (payload === "btn_orders") {
    await handleOrderStatus(phone, session, "");
  } else if (payload === "btn_clear_cart") {
    session.cart = [];
    await sendTextMessage(phone, "Cart cleared! 🗑️ Let's start fresh!");
    await handleBrowseCatalog(phone, session, "");
  } else if (payload.startsWith("prod_")) {
    const slug = payload.replace("prod_", "");
    await handleViewProduct(phone, session, slug, "");
  } else if (payload.startsWith("add_")) {
    const slug = payload.replace("add_", "");
    await handleAddToCart(phone, session, {
      productSlug: slug,
      quantity: 1,
      reply: "",
    });
  } else if (payload.startsWith("link_")) {
    const slug = payload.replace("link_", "");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://yuvara.netlify.app";
    await sendTextMessage(
      phone,
      `🔗 View on our website: ${siteUrl}/products/${slug}`
    );
  } else {
    await sendTextMessage(phone, "Let me help you with that! What do you need? 😊");
  }
}

// ══════════════════════════════════════════
//  Stateful Flow Handler (Multi-step)
// ══════════════════════════════════════════

async function handleStatefulFlow(
  phone: string,
  text: string,
  session: any
): Promise<boolean> {
  const lowerText = text.toLowerCase().trim();

  // Allow users to exit any flow
  if (["cancel", "exit", "stop", "back", "menu"].includes(lowerText)) {
    session.state = "idle";
    session.tempData = {};
    await sendTextMessage(phone, "No problem! 😊 What else can I help with?");
    await sendInteractiveButtons(phone, "Quick actions:", [
      { id: "btn_catalog", title: "🛍️ Shop" },
      { id: "btn_cart", title: "🛒 Cart" },
      { id: "btn_orders", title: "📦 Orders" },
    ]);
    return true;
  }

  switch (session.state) {
    case "registering_name": {
      session.tempData = { ...session.tempData, regName: text };
      session.state = "registering_email";
      await sendTextMessage(
        phone,
        `Nice to meet you, ${text}! 🤝\n\nNow, what's your email address? 📧`
      );
      return true;
    }

    case "registering_email": {
      const email = text.trim().toLowerCase();
      if (!email.includes("@") || !email.includes(".")) {
        await sendTextMessage(
          phone,
          "That doesn't look like a valid email 😅 Please enter a valid email address:"
        );
        return true;
      }

      // Check if email exists
      const existing = await User.findOne({ email });
      if (existing) {
        // Link to existing account
        session.userId = existing._id;
        session.name = existing.name || session.tempData?.regName;
        session.registeredAt = new Date();
        session.shippingAddress = {
          ...session.shippingAddress,
          email,
          phone: session.phone,
        };
        session.state = "idle";
        session.tempData = {};
        await sendTextMessage(
          phone,
          `Found your account! 🎉 You're now linked as ${existing.name || email}.\n\nYou can use this same email to log in on our website!`
        );
        await sendInteractiveButtons(phone, "What's next?", [
          { id: "btn_catalog", title: "🛍️ Shop" },
          { id: "btn_orders", title: "📦 My Orders" },
        ]);
        return true;
      }

      session.tempData = { ...session.tempData, regEmail: email };
      session.state = "registering_password";
      await sendTextMessage(
        phone,
        "Almost done! 🎯\n\nCreate a password (at least 6 characters) — you'll use this to log in on our website too!"
      );
      return true;
    }

    case "registering_password": {
      if (text.length < 6) {
        await sendTextMessage(
          phone,
          "Password needs to be at least 6 characters. Try again:"
        );
        return true;
      }

      const { regName, regEmail } = session.tempData || {};
      if (!regName || !regEmail) {
        session.state = "registering_name";
        await sendTextMessage(
          phone,
          "Let's start over. What's your full name?"
        );
        return true;
      }

      // Create the user
      const hashedPassword = await bcrypt.hash(text, 10);
      const referralCode = regName
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "X") +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const newUser = await User.create({
        name: regName,
        email: regEmail,
        password: hashedPassword,
        role: "user",
        referralCode,
        address: {
          country: "Nigeria",
        },
      });

      session.userId = newUser._id;
      session.name = regName;
      session.registeredAt = new Date();
      session.shippingAddress = {
        email: regEmail,
        phone: session.phone,
        country: "Nigeria",
      };
      session.state = "idle";
      session.tempData = {};

      await sendTextMessage(
        phone,
        `🎉 Welcome to the Yuvara family, ${regName}!\n\n✅ Account created successfully!\n📧 Email: ${regEmail}\n🔑 You can log in on our website with these credentials.\n\nNow let's get you shopping! 🛍️`
      );

      await sendInteractiveButtons(phone, "Let's shop!", [
        { id: "btn_catalog", title: "🛍️ Browse Products" },
        { id: "btn_cart", title: "🛒 View Cart" },
      ]);

      return true;
    }

    case "awaiting_address": {
      // Parse address: "Street, City, State, Zip"
      const parts = text.split(",").map((p) => p.trim());

      if (parts.length < 3) {
        await sendTextMessage(
          phone,
          "Please send your address in this format:\n*Street, City, State, Zip Code*\n\nExample: 12 Allen Avenue, Ikeja, Lagos, 100001"
        );
        return true;
      }

      session.shippingAddress = {
        ...session.shippingAddress,
        street: parts[0],
        city: parts[1],
        state: parts[2],
        zip: parts[3] || "100001",
        country: "Nigeria",
        phone: session.phone,
        email: session.shippingAddress?.email || "",
      };

      session.state = "idle";
      await sendTextMessage(
        phone,
        `✅ Address saved:\n📍 ${parts.slice(0, 3).join(", ")}\n\nProcessing your payment...`
      );

      // Proceed to payment
      await processPayment(phone, session);
      return true;
    }

    case "awaiting_payment": {
      // Check if they're confirming payment was made
      if (
        lowerText.includes("paid") ||
        lowerText.includes("sent") ||
        lowerText.includes("transferred") ||
        lowerText.includes("done")
      ) {
        await sendTextMessage(
          phone,
          "Thanks! 🙏 Let me verify your payment... This may take a moment."
        );
        // In production, Paystack webhook handles this automatically
        // For now, inform the user
        await sendTextMessage(
          phone,
          "Your payment will be automatically confirmed once we receive it. You'll get a notification here! 📩\n\nMeanwhile, keep shopping! 😊"
        );
        session.state = "idle";
        return true;
      }
      return false; // Let AI handle other messages during payment
    }

    default:
      return false;
  }
}

// ══════════════════════════════════════════
//  Payment Processing
// ══════════════════════════════════════════

async function processPayment(phone: string, session: any) {
  const cartTotal = session.cart.reduce(
    (sum: number, c: any) => sum + c.price * c.quantity,
    0
  );

  if (cartTotal <= 0) {
    await sendTextMessage(phone, "Your cart is empty!");
    return;
  }

  const email = session.shippingAddress?.email || `${phone}@whatsapp.yuvara.com`;

  // Try DVA first
  let dvaSuccess = false;

  if (!session.dvaAccountNumber) {
    try {
      // Create Paystack customer if not exists
      if (!session.paystackCustomerCode) {
        const nameParts = (session.name || "Customer").split(" ");
        const customer = await createPaystackCustomer(
          email,
          nameParts[0] || "Customer",
          nameParts.slice(1).join(" ") || "User",
          phone
        );

        if (customer) {
          session.paystackCustomerCode = customer.customer_code;

          // Create DVA
          const dva = await createDedicatedVirtualAccount(
            customer.customer_code
          );
          if (dva) {
            session.dvaAccountNumber = dva.accountNumber;
            session.dvaBankName = dva.bankName;
            session.dvaAccountName = dva.accountName;
            dvaSuccess = true;
          }
        }
      } else {
        dvaSuccess = !!session.dvaAccountNumber;
      }
    } catch (err) {
      console.error("DVA creation failed, falling back to payment link:", err);
    }
  } else {
    dvaSuccess = true;
  }

  if (dvaSuccess && session.dvaAccountNumber) {
    // Show bank transfer details
    await sendTextMessage(
      phone,
      `💳 *Payment Details*\n\n` +
      `Amount: *${formatNaira(cartTotal)}*\n\n` +
      `🏦 Transfer to:\n` +
      `Bank: *${session.dvaBankName}*\n` +
      `Account Number: *${session.dvaAccountNumber}*\n` +
      `Account Name: *${session.dvaAccountName || "Yuvara Store"}*\n\n` +
      `⚡ Payment will be confirmed automatically!\n` +
      `Send "paid" once you've transferred.`
    );

    session.state = "awaiting_payment";
    session.tempData = { pendingTotal: cartTotal };
  } else {
    // Fallback to payment link
    const paymentData = await createPaymentLink(email, cartTotal, {
      phone,
      source: "whatsapp_bot",
      cartItems: session.cart.map((c: any) => ({
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        productId: c.productId?.toString(),
      })),
    });

    if (paymentData) {
      await sendTextMessage(
        phone,
        `💳 *Pay ${formatNaira(cartTotal)}*\n\n` +
        `Click the link below to complete your payment:\n` +
        `${paymentData.authorizationUrl}\n\n` +
        `🔒 Secured by Paystack\n` +
        `Reference: ${paymentData.reference}`
      );
      session.state = "awaiting_payment";
      session.tempData = {
        pendingTotal: cartTotal,
        paymentReference: paymentData.reference,
      };
    } else {
      await sendTextMessage(
        phone,
        "Sorry, there was an issue setting up payment 😢 Please try again or visit our website to complete your purchase!"
      );
    }
  }
}
