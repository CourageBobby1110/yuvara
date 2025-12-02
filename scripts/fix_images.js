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

async function fixImages() {
  try {
    await mongoose.connect(
      "mongodb+srv://courage:Courage1110@cluster0.g1hdl.mongodb.net/yuvara?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Connected to DB");

    const products = await Product.find({});
    let fixedCount = 0;

    for (const p of products) {
      let needsSave = false;
      let newImages = [];

      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          if (
            typeof img === "string" &&
            img.trim().startsWith("[") &&
            img.trim().endsWith("]")
          ) {
            try {
              const parsed = JSON.parse(img);
              if (Array.isArray(parsed)) {
                newImages.push(...parsed);
                needsSave = true;
                console.log(`Fixed images for ${p.name}`);
              } else {
                newImages.push(img);
              }
            } catch (e) {
              newImages.push(img);
            }
          } else {
            newImages.push(img);
          }
        }
      }

      if (needsSave) {
        p.images = newImages;
        await p.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixImages();
