const mongoose = require('mongoose');

const WardrobeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String },
  notes: { type: String },
  tags: { type: String },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wardrobe', WardrobeSchema);
