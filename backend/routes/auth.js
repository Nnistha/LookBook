const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('profile');
    res.json(user.profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user,
      { profile: req.body },
      { new: true }
    );
    res.json(user.profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
