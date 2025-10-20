const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User'); // ✅ import from model

// Helper: generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ---------------------- FORGOT PASSWORD ----------------------
router.post('/sendOTP', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }

  try {
    // Find user
    const user = await User.findOne({ phone_number: phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate and update OTP
    const otp = generateOTP();
    const now = new Date();

    user.otp = otp;
    user.otp_created = now;
    await user.save();

    console.log('Generated OTP:', otp);
    console.log('OTP Timestamp:', now);

    // Send OTP via WhatsApp (using your API)
    const messageData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { preview_url: false, body: `Hello, your verification code is ${otp}` }
    };

    await axios.post(
      'https://graph.facebook.com/v22.0/793948707137006/messages',
      messageData,
      {
        headers: {
          'Authorization': `Bearer EAAY5tYDyDGcBPakPJgYD8IFN44x9wC6E3lGScXxyWt7ZAuwlFp5Kk6kH7f2fXXL0qmca3y1FjIHZCyjhEzWp3R88vIHu3beaTZAiXpZAVUK5Pik6TQ7SK0oZBGV0R0dhhwvPxZCq9g35TgCLnd2idDuxCbBmlM7cHxqxRjBbTrvkOWbzm6klsZC07I0FS6uDwZDZD`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

module.exports = router;
