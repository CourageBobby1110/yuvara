const fs = require('fs');

try {
  let data = fs.readFileSync('products_200.json');
  let str = data.toString('utf16le').replace(/^\uFEFF/, '');
  if (!str.trim().startsWith('[') && !str.trim().startsWith('{')) {
    str = data.toString('utf8').replace(/^\uFEFF/, '');
  }
  
  const products = JSON.parse(str);
  const outOfStock = products.filter(p => p.stock <= 0);
  
  console.log(`Out of stock products without images:`);
  outOfStock.forEach(p => {
    const hasImages = p.images && p.images.length > 0;
    const hasVariantImages = p.variants && p.variants.some(v => v.image);
    if (!hasImages && !hasVariantImages) {
      console.log(`[NO IMAGES] ${p.name}`);
    }
  });
} catch (e) {
  console.error("Error:", e.message);
}
