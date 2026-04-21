const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// Mock AI endpoint
router.post('/recommend', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Real implementation would call OpenAI API here
    const recommendation = "Based on your wardrobe, I recommend pairing the Silk Top with the Charcoal Trousers for an elegant look.";
    
    res.json({ reply: recommendation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
