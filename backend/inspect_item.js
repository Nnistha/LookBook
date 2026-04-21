const mongoose = require('mongoose');
const Wardrobe = require('./models/Wardrobe');

const MONGO_URI = 'mongodb://localhost:27017/lookbook';

async function inspect() {
  try {
    await mongoose.connect(MONGO_URI);
    const item = await Wardrobe.findOne();
    if (item) {
      console.log('Item Name:', item.name);
      console.log('Image starts with:', item.image ? item.image.substring(0, 50) : 'NULL');
      console.log('Image length:', item.image ? item.image.length : 0);
    } else {
      console.log('No items found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
