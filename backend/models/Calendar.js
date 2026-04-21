const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  event: { type: String }, // e.g., "Dinner Party", "Meeting"
  outfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit', default: null },
  moodboard: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Calendar', CalendarSchema);
