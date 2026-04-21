const mongoose = require('mongoose');
const Wardrobe = require('./models/Wardrobe');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/lookbook';

async function diagnose() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('--- DATABASE DIAGNOSTICS ---');
    
    const userCount = await User.countDocuments();
    console.log('Total Users:', userCount);
    
    const wardrobeCount = await Wardrobe.countDocuments();
    console.log('Total Wardrobe Items:', wardrobeCount);
    
    if (userCount > 0) {
      const firstUser = await User.findOne();
      console.log('First User ID:', firstUser._id.toString());
      
      const userItems = await Wardrobe.find({ userId: firstUser._id.toString() });
      console.log(`Items for User ${firstUser.email}:`, userItems.length);
      
      if (userItems.length > 0) {
        console.log('Sample Item Name:', userItems[0].name);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Diagnostics failed:', err);
    process.exit(1);
  }
}

diagnose();
