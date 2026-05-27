const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    images: [String],
    name: String,
  },
  { strict: false }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function cleanup() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from environment variables.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const products = await Product.find({});
    let deletedCount = 0;

    for (const p of products) {
      let isCorrupted = false;
      if (p.images && p.images.length > 0) {
        // Check if any image string looks like a JSON array
        if (
          p.images.some(
            (img) =>
              typeof img === "string" &&
              img.trim().startsWith("[") &&
              img.trim().endsWith("]")
          )
        ) {
          isCorrupted = true;
        }
      }

      if (isCorrupted) {
        await Product.deleteOne({ _id: p._id });
        console.log(`Deleted corrupted product: ${p.name}`);
        deletedCount++;
      }
    }

    console.log(
      `Cleanup complete. Deleted ${deletedCount} corrupted products.`
    );
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

cleanup();
