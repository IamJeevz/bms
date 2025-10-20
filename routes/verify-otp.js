const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User'); // import the Mongoose model

// ---------------------- VERIFY OTP ----------------------
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required' });
  }

  try {
    // Find user by phone
    const user = await User.findOne({ phone_number: phone });

    if (!user) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    // Check OTP match
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check OTP expiry (2 minutes)
    const otpCreated = new Date(user.otp_created);
    const now = new Date();
    const diffMinutes = (now - otpCreated) / 1000 / 60;

    if (diffMinutes > 2) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Generate and update new token
    const token = crypto.randomBytes(32).toString('hex');
    user.token = token;
    user.used = false;
    user.signup_health = true;
    await user.save();

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
