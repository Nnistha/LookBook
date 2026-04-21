const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Wardrobe = require('../models/Wardrobe');

// Get user wardrobe
router.get('/', auth, async (req, res) => {
  try {
    const items = await Wardrobe.find({ userId: req.user });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to wardrobe
router.post('/', auth, async (req, res) => {
  try {
    const { image, category, name, notes, tags } = req.body;
    console.log('--- WARDROBE SAVE ATTEMPT ---');
    console.log('User ID from token:', req.user);
    console.log('Category:', category);
    console.log('Name:', name);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!image || !category) {
      return res.status(400).json({ error: 'Image and category are required' });
    }

    const newItem = new Wardrobe({ 
      userId: req.user.toString(), 
      image, 
      category, 
      name, 
      notes, 
      tags 
    });

    await newItem.save();
    console.log('Item saved successfully:', newItem._id);
    res.status(201).json(newItem);
  } catch (err) {
    console.error('WARDROBE_SAVE_ERROR:', err);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});

// Update item
router.patch('/:id', auth, async (req, res) => {
  try {
    const updatedItem = await Wardrobe.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      { $set: req.body },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    await Wardrobe.findOneAndDelete({ _id: req.params.id, userId: req.user });
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
