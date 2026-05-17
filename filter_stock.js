const fs = require('fs');

try {
  // Read file as UTF-16LE or UTF-8 depending on how it was saved
  let data = fs.readFileSync('products_200.json');
  // Handle UTF-16LE if present (common in PS redirection)
  let str = data.toString('utf16le').replace(/^\uFEFF/, '');
  if (!str.trim().startsWith('[') && !str.trim().startsWith('{')) {
    str = data.toString('utf8').replace(/^\uFEFF/, '');
  }
  
  const products = JSON.parse(str);
  const outOfStock = products.filter(p => p.stock <= 0);
  
  console.log(`Total products: ${products.length}`);
  console.log(`Out of stock: ${outOfStock.length}`);
  
  if (outOfStock.length > 0) {
    console.log("First 3 out of stock products:");
    console.log(JSON.stringify(outOfStock.slice(0, 3).map(p => ({
      name: p.name,
      images: p.images,
      variantsCount: p.variants?.length,
      firstVariantImage: p.variants?.[0]?.image,
      stock: p.stock
    })), null, 2));
  }
} catch (e) {
  console.error("Error:", e.message);
}
