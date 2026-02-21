import * as dotenv from "dotenv";
import * as dns from "dns";
// Ensure env is loaded BEFORE any other imports
dotenv.config({ path: ".env.local" });
dotenv.config();

// Fix: Force Node.js to use public DNS servers instead of broken local proxy (127.0.0.1)
// The local DNS proxy can't handle SRV record lookups required by MongoDB Atlas (mongodb+srv://)
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

console.log("Starting CJ Sync Worker...");
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing from environment variables.");
  process.exit(1);
}

// Dynamic imports to ensure env vars are set before these modules init
async function main() {
  const { default: mongoose } = await import("mongoose");
  const { default: dbConnect } = await import("@/lib/db");
  const { default: Product } = await import("@/models/Product");
  const { syncProductPrice, syncVariantStock, syncVariantShipping } =
    await import("@/lib/cj-sync-service");

  const DELAY_BETWEEN_PRODUCTS = 1000 * 30; // 30 seconds
  const DELAY_BETWEEN_STEPS = 1000 * 5; // 5 seconds (Human-like pause)
  const DELAY_BETWEEN_VARIANTS = 1000 * 5; // 5 seconds per variant (Very safe)
  const IDLE_DELAY_MINUTES = 5;

  const wait = (ms: number) => {
    // Add +/- 10% jitter to look more human
    const jitter = Math.floor(Math.random() * (ms * 0.2)) - ms * 0.1;
    return new Promise((resolve) => setTimeout(resolve, ms + jitter));
  };

  await dbConnect();
  console.log("✅ Connected to Database.");

  while (true) {
    try {
      // Find products sorted by oldest lastSyncedStock
      const product = await Product.findOne({
        cjPid: { $exists: true, $ne: null },
      }).sort({ lastSyncedStock: 1 });

      if (!product) {
        console.log("⚠️ No CJ-linked products found.");
        await wait(1000 * 60 * IDLE_DELAY_MINUTES);
        continue;
      }

      // Check if it was synced recently (30m cooldown)
      const lastSynced = product.lastSyncedStock
        ? new Date(product.lastSyncedStock).getTime()
        : 0;
      const now = Date.now();
      const timeSinceSync = now - lastSynced;

      if (timeSinceSync < 1000 * 60 * 30) {
        console.log(
          `💤 All products seem recently synced. Waiting ${IDLE_DELAY_MINUTES} minutes...`,
        );
        await wait(1000 * 60 * IDLE_DELAY_MINUTES);
        continue;
      }

      console.log(`\n📦 Processing Product: ${product.name} (${product._id})`);

      // 1. Sync Price
      console.log(`   🔸 Step 1: Syncing Price...`);
      try {
        const priceRes = await syncProductPrice(product._id);
        console.log(
          `      ✅ Price synced. Updated ${priceRes.processedCount} variants.`,
        );
      } catch (e: any) {
        console.error(`      ❌ Price sync failed: ${e.message}`);
      }
      await wait(DELAY_BETWEEN_STEPS);

      // Reload product
      const freshProduct = await Product.findById(product._id);
      if (!freshProduct) continue;
      const variants = freshProduct.variants || [];

      // 2. Sync Stock (Per Variant)
      console.log(
        `   🔸 Step 2: Syncing Stock for ${variants.length} variants...`,
      );
      for (const variant of variants) {
        if (!variant.cjVid) continue;
        console.log(`      ... Variant ${variant.cjVid} (Stock)`);
        try {
          await syncVariantStock(freshProduct._id, variant.cjVid);
        } catch (e: any) {
          console.error(`      ❌ Stock sync failed for ${variant.cjVid}`);
        }
        await wait(DELAY_BETWEEN_VARIANTS);
      }
      console.log(`      ✅ Stock sync completed.`);
      await wait(DELAY_BETWEEN_STEPS);

      // 3. Sync Shipping (Per Variant)
      console.log(
        `   🔸 Step 3: Syncing Shipping for ${variants.length} variants...`,
      );
      for (const variant of variants) {
        if (!variant.cjVid) continue;
        console.log(`      ... Variant ${variant.cjVid} (Shipping)`);
        try {
          await syncVariantShipping(freshProduct._id, variant.cjVid);
        } catch (e: any) {
          console.error(`      ❌ Shipping sync failed for ${variant.cjVid}`);
        }
        await wait(DELAY_BETWEEN_VARIANTS);
      }
      console.log(`      ✅ Shipping sync completed.`);

      console.log(
        `✅ Finished Product: ${product.name}. Waiting ${
          DELAY_BETWEEN_PRODUCTS / 1000
        }s...`,
      );

      // ALWAYS update timestamps to prevent infinite loop on failure/empty variants
      await Product.findByIdAndUpdate(product._id, {
        lastSyncedStock: new Date(),
        lastSyncedPrice: new Date(),
        lastSyncedShipping: new Date(),
      });

      await wait(DELAY_BETWEEN_PRODUCTS);
    } catch (error: any) {
      console.error("❌ Worker Error:", error.message);
      console.log("Retrying in 1 minute...");
      await wait(1000 * 60);
    }
  }
}

main().catch((err) => {
  console.error("Fatal Worker Error:", err);
  process.exit(1);
});
