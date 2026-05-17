const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = "mongodb://yuvara:iKbC3P0NrXdwNzh5@ac-8nggafi-shard-00-00.pnnmbp1.mongodb.net:27017,ac-8nggafi-shard-00-01.pnnmbp1.mongodb.net:27017,ac-8nggafi-shard-00-02.pnnmbp1.mongodb.net:27017/?authSource=admin&replicaSet=atlas-uzmu48-shard-0&appName=yuvaras&ssl=true";

async function exportProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Use strict: false to get everything regardless of schema
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');

    console.log('Fetching all products...');
    const products = await Product.find({});
    console.log(`Found ${products.length} products.`);

    const outputPath = path.join(__dirname, '../public/all_products_backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

    console.log(`Exported all products to ${outputPath}`);
    console.log('You can now find the file in the public folder as all_products_backup.json');
    process.exit(0);
  } catch (error) {
    console.error('Error exporting products:', error);
    process.exit(1);
  }
}

exportProducts();
