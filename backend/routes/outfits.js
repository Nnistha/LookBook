const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Outfit = require('../models/Outfit');

// Get user outfits
router.get('/', auth, async (req, res) => {
  try {
    const outfits = await Outfit.find({ userId: req.user })
      .populate('items.wardrobeId')
      .sort({ createdAt: -1 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save new outfit
router.post('/', auth, async (req, res) => {
  try {
    const { name, items, thumbnail, caption } = req.body;
    console.log('--- OUTFIT SAVE ATTEMPT ---');
    console.log('User ID:', req.user);
    console.log('Items Count:', items?.length);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const newOutfit = new Outfit({ 
      userId: req.user.toString(), 
      name, 
      items, 
      thumbnail,
      caption 
    });
    
    await newOutfit.save();
    console.log('Outfit saved successfully');
    res.status(201).json(newOutfit);
  } catch (err) {
    console.error('OUTFIT_SAVE_ERROR:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Toggle posting status
router.patch('/:id/post', auth, async (req, res) => {
  try {
    const outfit = await Outfit.findOne({ _id: req.params.id, userId: req.user });
    if (!outfit) return res.status(404).json({ message: 'Outfit not found' });
    
    const { caption, isPosted } = req.body;
    outfit.isPosted = typeof isPosted === 'boolean' ? isPosted : true;
    if (caption !== undefined) outfit.caption = caption;
    await outfit.save();
    await outfit.populate('items.wardrobeId');
    res.json(outfit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posted outfits
router.get('/posted', async (req, res) => {
  try {
    const outfits = await Outfit.find({ isPosted: true })
      .populate('items.wardrobeId')
      .sort({ createdAt: -1 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update outfit
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, items, thumbnail, caption } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (items !== undefined) updates.items = items;
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (caption !== undefined) updates.caption = caption;

    const updatedOutfit = await Outfit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      { $set: updates },
      { new: true }
    );
    if (!updatedOutfit) return res.status(404).json({ message: 'Outfit not found' });
    await updatedOutfit.populate('items.wardrobeId');
    res.json(updatedOutfit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete outfit
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedOutfit = await Outfit.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!deletedOutfit) return res.status(404).json({ message: 'Outfit not found' });
    res.json({ message: 'Outfit deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
