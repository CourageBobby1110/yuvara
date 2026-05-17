const fs = require('fs');

try {
  let data = fs.readFileSync('products_200.json');
  let str = data.toString('utf16le').replace(/^\uFEFF/, '');
  if (!str.trim().startsWith('[') && !str.trim().startsWith('{')) {
    str = data.toString('utf8').replace(/^\uFEFF/, '');
  }
  
  const products = JSON.parse(str);
  const inStock = products.filter(p => p.stock > 0);
  
  console.log(`In stock products with potential corruption:`);
  inStock.slice(0, 10).forEach(p => {
    const isCorrupted = p.images?.[0]?.startsWith('["');
    if (isCorrupted) {
      console.log(`[CORRUPTED] ${p.name}`);
    } else {
      console.log(`[CLEAN] ${p.name}`);
    }
  });
} catch (e) {
  console.error("Error:", e.message);
}
