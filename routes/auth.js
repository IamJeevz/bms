const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { mongoose } = require('../db'); // import mongoose connection

// Define schema — no user_id
const userSchema = new mongoose.Schema({
  phone_number: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otp_created: { type: Date },
  token: { type: String },
  used: { type: Boolean, default: false }
});

// Create model linked to "sec_user_mst" collection in "bms" database
const User = mongoose.model('sec_user_mst', userSchema, 'sec_user_mst');

// ---------------------- SIGNUP ----------------------
router.post('/signup', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    // check if user exists
    const existing = await User.findOne({ phone_number: phone });
    if (existing)
      return res.status(400).json({ success: false, message: 'User already exists' });

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // create new user
    const newUser = new User({
      phone_number: phone,
      password: hashed,
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
  if (!phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const user = await User.findOne({ phone_number: phone });
    if (!user)
      return res.status(400).json({ success: false, message: 'User not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass)
      return res.status(400).json({ success: false, message: 'Incorrect password' });

    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

module.exports = router;
