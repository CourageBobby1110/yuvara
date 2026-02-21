/**
 * Paystack Webhook Route
 * Handles charge.success events for DVA payments and creates orders + WhatsApp notifications.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import WhatsAppSession from "@/models/WhatsAppSession";
import Order from "@/models/Order";
import { sendTextMessage, sendInteractiveButtons, formatNaira } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    // Verify Paystack webhook signature
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const event = body.event;

    if (event === "charge.success") {
      const data = body.data;
      const metadata = data.metadata || {};

      // Check if this is a WhatsApp bot payment
      if (metadata.source === "whatsapp_bot" && metadata.phone) {
        await handleWhatsAppPayment(data, metadata);
      }

      // Also handle DVA charges
      if (data.authorization?.authorization_code && data.customer?.customer_code) {
        await handleDVAPayment(data);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ status: "ok" }); // Always return 200
  }
}

async function handleWhatsAppPayment(data: any, metadata: any) {
  await dbConnect();

  const phone = metadata.phone;
  const session = await WhatsAppSession.findOne({ phone });

  if (!session || !session.cart || session.cart.length === 0) {
    console.log("No active WhatsApp session/cart for phone:", phone);
    return;
  }

  // Create order
  const order = await Order.create({
    user: session.userId,
    items: session.cart.map((item: any) => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      cjVid: item.cjVid,
    })),
    total: data.amount / 100, // Convert from kobo
    status: "processing",
    shippingAddress: session.shippingAddress || {
      email: data.customer?.email || "",
      phone: phone,
      street: "Provided via WhatsApp",
      city: "Lagos",
      state: "Lagos",
      zip: "100001",
      country: "Nigeria",
    },
    paymentReference: data.reference,
    paymentStatus: "paid",
  });

  // Clear cart and update state
  session.cart = [];
  session.state = "idle";
  session.tempData = {};
  await session.save();

  // Notify user on WhatsApp
  const orderId = order._id.toString().slice(-6).toUpperCase();
  await sendTextMessage(
    phone,
    `🎉 *Payment Confirmed!*\n\n` +
    `✅ We received your payment of ${formatNaira(data.amount / 100)}\n` +
    `📦 Order #${orderId} has been created\n` +
    `📍 Status: Processing\n\n` +
    `Thank you for shopping with Yuvara! 🛍️\n` +
    `We'll keep you updated on your delivery! 🚚`
  );

  await sendInteractiveButtons(
    phone,
    "Keep the vibes going! 💪",
    [
      { id: "btn_catalog", title: "🛍️ Shop More" },
      { id: "btn_orders", title: "📦 Track Order" },
    ]
  );
}

async function handleDVAPayment(data: any) {
  await dbConnect();

  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;

  const session = await WhatsAppSession.findOne({
    paystackCustomerCode: customerCode,
  });

  if (!session || session.state !== "awaiting_payment") return;

  // Verify amount matches cart total
  const cartTotal = session.cart.reduce(
    (sum: number, c: any) => sum + c.price * c.quantity,
    0
  );

  const paidAmount = data.amount / 100; // kobo to naira

  if (paidAmount < cartTotal * 0.95) {
    // Allow 5% tolerance for fees
    await sendTextMessage(
      session.phone,
      `⚠️ We received ₦${paidAmount.toLocaleString()} but your cart total is ${formatNaira(cartTotal)}.\n\nPlease transfer the remaining amount or contact support.`
    );
    return;
  }

  // Create order
  const order = await Order.create({
    user: session.userId,
    items: session.cart.map((item: any) => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      cjVid: item.cjVid,
    })),
    total: cartTotal,
    status: "processing",
    shippingAddress: session.shippingAddress || {
      email: `${session.phone}@whatsapp.yuvara.com`,
      phone: session.phone,
      street: "Provided via WhatsApp",
      city: "Lagos",
      state: "Lagos",
      zip: "100001",
      country: "Nigeria",
    },
    paymentReference: data.reference,
    paymentStatus: "paid",
  });

  // Clear cart
  session.cart = [];
  session.state = "idle";
  session.tempData = {};
  await session.save();

  const orderId = order._id.toString().slice(-6).toUpperCase();
  await sendTextMessage(
    session.phone,
    `🎉 *Payment Confirmed!*\n\n` +
    `✅ Bank transfer of ${formatNaira(paidAmount)} received!\n` +
    `📦 Order #${orderId} created\n` +
    `📍 Status: Processing\n\n` +
    `Thank you for shopping with Yuvara! 🛍️ You'll get delivery updates right here! 🚚`
  );

  await sendInteractiveButtons(
    session.phone,
    "What next? 😊",
    [
      { id: "btn_catalog", title: "🛍️ Shop More" },
      { id: "btn_orders", title: "📦 Track Order" },
    ]
  );
}
