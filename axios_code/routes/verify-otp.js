// routes/verify-otp
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const db = require('../db'); // mysql2 promise connection

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required' });
  }

  try {
    // Query OTP and otp_created for the given phone
    const [rows] =  await db.query(
      'SELECT otp, otp_created FROM sec_user_mst WHERE phone_number = ?',
      [phone]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    const user = rows[0];

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired (2 mins)
    const otpCreated = new Date(user.otp_created);
    const now = new Date();
    const diffMinutes = (now - otpCreated) / 1000 / 60;

    if (diffMinutes > 2) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
	const token = crypto.randomBytes(32).toString('hex');
	await db.query('UPDATE sec_user_mst SET token = ?, used=0 WHERE phone_number = ?', [token, phone]);
    return res.json({ message: 'OTP verified successfully',token });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
