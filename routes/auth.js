const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Import from models/User.js

// ---------------------- SIGNUP ----------------------
router.post('/signup', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const existing = await User.findOne({ phone_number: phone });
    if (existing)
      return res.status(400).json({ success: false, message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      phone_number: phone,
      password: hashed,
	    signup_health:0
    });

    await newUser.save();
    res.json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------------------- LOGIN ----------------------
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    const user = await User.findOne({ phone_number: phone });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    // ✅ Check if signup is completed
    if (!user.signup_health) {
      return res.status(403).json({ success: false, message: 'Please verify your account before logging in.' });
    }

    // Login success
    return res.json({ success: true, message: 'Login successful' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

module.exports = router;
