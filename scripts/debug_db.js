const mongoose = require('mongoose');

async function debugProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const product = await mongoose.connection.db.collection('products').findOne({});
    console.log('Sample Product:', JSON.stringify(product, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugProducts();
