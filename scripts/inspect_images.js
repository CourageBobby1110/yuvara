const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const products = await Product.find({}).limit(5);
    products.forEach((p) => {
      console.log(`Product: ${p.name}`);
      console.log("Images type:", typeof p.images);
      console.log("Images isArray:", Array.isArray(p.images));
      console.log("Images content:", p.images);
      if (Array.isArray(p.images) && p.images.length > 0) {
        console.log("First image type:", typeof p.images[0]);
        console.log("First image content:", p.images[0]);
      }
      console.log("---");
    });

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

inspect();
