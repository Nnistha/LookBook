const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    name: { type: String, default: 'Elena Vance' },
    bio: { type: String, default: 'Crafting a narrative through texture and tone. My wardrobe is a living gallery of moments captured in silk and wool.' },
    socialHandle: { type: String, default: '@elenavance_style' },
    profileImage: { type: String, default: '' },
    todayOutfitImage: { type: String, default: '' },
    todayOutfitTitle: { type: String, default: 'Winter Dinner Look' },
    todayOutfitNote: { type: String, default: '"The deep burgundy tones of the boots anchor the neutral coat, creating a balanced silhouette for a sophisticated evening out."' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
