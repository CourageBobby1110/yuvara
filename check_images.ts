import dbConnect from "./lib/db";
import Product from "./models/Product";

async function check() {
  await dbConnect();
  const outOfStock = await Product.find({ stock: { $lte: 0 }, variants: { $size: 0 } }).limit(5);
  console.log("Out of stock (no variants):", outOfStock.map(p => ({ name: p.name, imagesCount: p.images?.length, firstImage: p.images?.[0] })));
  
  const inStock = await Product.find({ stock: { $gt: 0 } }).limit(5);
  console.log("In stock:", inStock.map(p => ({ name: p.name, imagesCount: p.images?.length, firstImage: p.images?.[0] })));
}

check().then(() => process.exit(0));
