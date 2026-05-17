const fs = require('fs');

try {
  let data = fs.readFileSync('products_200.json');
  let str = data.toString('utf16le').replace(/^\uFEFF/, '');
  if (!str.trim().startsWith('[') && !str.trim().startsWith('{')) {
    str = data.toString('utf8').replace(/^\uFEFF/, '');
  }
  
  const products = JSON.parse(str);
  const outOfStock = products.filter(p => p.stock <= 0);
  
  console.log(`Total out of stock: ${outOfStock.length}`);
  
  outOfStock.forEach(p => {
    console.log(`--- ${p.name} ---`);
    console.log(`Stock: ${p.stock}`);
    console.log(`Images: ${JSON.stringify(p.images)}`);
    console.log(`Variants count: ${p.variants?.length}`);
    if (p.variants?.length > 0) {
      console.log(`First variant image: ${p.variants[0].image}`);
      console.log(`First variant stock: ${p.variants[0].stock}`);
    }
  });
} catch (e) {
  console.error("Error:", e.message);
}
