const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Calendar = require('../models/Calendar');

// Get calendar entries
router.get('/', auth, async (req, res) => {
  try {
    const entries = await Calendar.find({ userId: req.user }).populate({
      path: 'outfitId',
      populate: {
        path: 'items.wardrobeId'
      }
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign outfit to date
router.post('/', auth, async (req, res) => {
  try {
    const { date, event, outfitId, moodboard } = req.body;

    if (!outfitId && !moodboard) {
      return res.status(400).json({ error: 'Either outfitId or moodboard is required.' });
    }
    
    // Update if exists, otherwise create new
    let entry = await Calendar.findOne({ userId: req.user, date });
    if (entry) {
      entry.outfitId = outfitId || null;
      entry.moodboard = moodboard || null;
      entry.event = event || '';
      await entry.save();
    } else {
      entry = new Calendar({
        userId: req.user,
        date,
        event,
        outfitId: outfitId || null,
        moodboard: moodboard || null
      });
      await entry.save();
    }

    await entry.populate({
      path: 'outfitId',
      populate: {
        path: 'items.wardrobeId'
      }
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove calendar entry by date
router.delete('/:date', auth, async (req, res) => {
  try {
    const deleted = await Calendar.findOneAndDelete({
      userId: req.user,
      date: req.params.date
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Calendar entry not found' });
    }

    res.json({ message: 'Calendar entry removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
