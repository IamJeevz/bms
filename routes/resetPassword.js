const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User'); // Mongoose model

// 🔹 Reset password (with current password verification)
router.post('/reset-password', async (req, res) => {
  const { phone, currentPassword, newPassword } = req.body;

  if (!phone || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // ✅ Check if user exists
    const user = await User.findOne({ phone_number: phone });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    // ✅ Compare current password
    const validPass = await bcrypt.compare(currentPassword, user.password);
    if (!validPass) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // ✅ Hash and update new password
    const hashedNew = await bcrypt.hash(newPassword, 10);
    user.password = hashedNew;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


// 🔹 Reset password (Forgot password flow)
router.post('/reset-frg_password', async (req, res) => {
  const { phone, newPassword, token } = req.body;

  if (!phone || !newPassword || !token) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // ✅ Find valid token entry (not used, not expired)
    const user = await User.findOne({
      phone_number: phone,
      token: token,
      used: 0
    }).sort({ user_id: -1 });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // ✅ Check if token expired
    if (user.expires_at && new Date() > new Date(user.expires_at)) {
      return res.status(400).json({ success: false, message: 'Expired token' });
    }

    // ✅ Hash and update new password
    const hashedNew = await bcrypt.hash(newPassword, 10);
    user.password = hashedNew;
    user.used = 1; // mark token used
    user.token = null; // clear token (optional)
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
