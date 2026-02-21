/**
 * WhatsApp Daily Promotions Worker
 * Sends 2-3 featured products daily to active WhatsApp users
 * with AI-generated personalized sales pitches.
 *
 * Usage: npm run worker:whatsapp-promo
 */
import * as dotenv from "dotenv";
import * as dns from "dns";

// Ensure env is loaded BEFORE any other imports
dotenv.config({ path: ".env.local" });
dotenv.config();

// Fix: Force Node.js to use public DNS servers instead of broken local proxy
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

console.log("Starting WhatsApp Promo Worker... 📣");

async function main() {
  const { default: mongoose } = await import("mongoose");
  const { default: dbConnect } = await import("@/lib/db");
  const { default: WhatsAppSession } = await import("@/models/WhatsAppSession");
  const { default: Product } = await import("@/models/Product");
  const {
    sendTextMessage,
    sendImageMessage,
    sendVideoMessage,
    sendInteractiveButtons,
    formatNaira,
  } = await import("@/lib/whatsapp");
  const { generateAIResponse } = await import("@/lib/whatsapp-ai");

  const PROMO_COOLDOWN_HOURS = 24; // Don't send more than once per day
  const MAX_PRODUCTS_PER_PROMO = 3;
  const DELAY_BETWEEN_USERS = 2000; // 2 seconds between users (rate limiting)
  const DELAY_BETWEEN_PRODUCTS = 1500; // 1.5 seconds between product messages

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  await dbConnect();
  console.log("✅ Connected to Database.");

  while (true) {
    try {
      const now = new Date();
      const cooldownDate = new Date(
        now.getTime() - PROMO_COOLDOWN_HOURS * 60 * 60 * 1000
      );
      const activeThreshold = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000 // Active in last 30 days
      );

      // Find users who are active and haven't received a promo recently
      const eligibleUsers = await WhatsAppSession.find({
        lastMessageAt: { $gte: activeThreshold },
        $or: [
          { lastPromoSentAt: { $exists: false } },
          { lastPromoSentAt: null },
          { lastPromoSentAt: { $lt: cooldownDate } },
        ],
      }).limit(50);

      if (eligibleUsers.length === 0) {
        console.log(
          "💤 No eligible users for promotions. Waiting 1 hour..."
        );
        await wait(1000 * 60 * 60); // Wait 1 hour
        continue;
      }

      console.log(
        `📣 Found ${eligibleUsers.length} users eligible for promotions`
      );

      // Pick featured/popular products
      const products = await Product.find({
        stock: { $gt: 0 },
      })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(10)
        .lean();

      if (products.length === 0) {
        console.log("⚠️ No products in stock. Waiting 2 hours...");
        await wait(1000 * 60 * 120);
        continue;
      }

      // Pick random subset of products for today
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      const promoProducts = shuffled.slice(0, MAX_PRODUCTS_PER_PROMO);

      for (const user of eligibleUsers) {
        try {
          console.log(`📨 Sending promo to ${user.phone}...`);

          // Generate a personalized intro using AI
          const userCartHistory = user.cart?.map((c: any) => c.name) || [];
          const productNames = promoProducts
            .map((p: any) => `${p.name} (${formatNaira(p.price)})`)
            .join(", ");

          const aiIntro = await generateAIResponse(
            `Generate a short, exciting promotional message introducing these products to a customer: ${productNames}. Make it feel personal and urgent. The customer's name is ${user.name || "there"}. Previously browsed: ${userCartHistory.join(", ") || "various items"}.`,
            [],
            promoProducts.map((p: any) => ({
              name: p.name,
              price: p.price,
              slug: p.slug,
              category: p.category,
            })),
            undefined,
            undefined,
            user.name
          );

          // Send intro text
          await sendTextMessage(user.phone, `📣 ${aiIntro.reply}`);
          await wait(DELAY_BETWEEN_PRODUCTS);

          // Send each product
          for (const product of promoProducts) {
            const p = product as any;

            // Send product image
            if (p.images?.[0]) {
              await sendImageMessage(
                user.phone,
                p.images[0],
                `✨ *${p.name}*\n💰 ${formatNaira(p.price)}\n${p.stock <= 5 ? `⚡ Only ${p.stock} left!` : "📦 In Stock"}`
              );
            }

            // Send video if available
            if (p.videos?.[0]) {
              await sendVideoMessage(
                user.phone,
                p.videos[0],
                `🎬 See ${p.name} in action!`
              );
            }

            await wait(DELAY_BETWEEN_PRODUCTS);
          }

          // Send CTA buttons
          const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL || "https://yuvara.netlify.app";

          await sendInteractiveButtons(
            user.phone,
            "🔥 Don't miss out! These deals won't last long!",
            [
              { id: "btn_catalog", title: "🛍️ Shop Now" },
              {
                id: `prod_${(promoProducts[0] as any).slug}`,
                title: "👀 View Details",
              },
              { id: "btn_cart", title: "🛒 My Cart" },
            ]
          );

          // Update last promo sent
          user.lastPromoSentAt = new Date();
          await user.save();

          console.log(`   ✅ Promo sent to ${user.phone}`);
          await wait(DELAY_BETWEEN_USERS);
        } catch (userError: any) {
          console.error(
            `   ❌ Failed for ${user.phone}: ${userError.message}`
          );
          await wait(DELAY_BETWEEN_USERS);
        }
      }

      console.log(
        `✅ Promo batch complete. Waiting ${PROMO_COOLDOWN_HOURS} hours for next round...`
      );
      await wait(PROMO_COOLDOWN_HOURS * 60 * 60 * 1000);
    } catch (error: any) {
      console.error("❌ Promo Worker Error:", error.message);
      console.log("Retrying in 30 minutes...");
      await wait(1000 * 60 * 30);
    }
  }
}

main().catch((err) => {
  console.error("Fatal Promo Worker Error:", err);
  process.exit(1);
});
