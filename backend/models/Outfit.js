const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, default: 'Untitled Look' },
  items: [{
    wardrobeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wardrobe' },
    x: Number,
    y: Number,
    scale: Number,
    rotation: Number,
    zIndex: Number
  }],
  thumbnail: { type: String },
  isPosted: { type: Boolean, default: false },
  caption: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Outfit', OutfitSchema);
