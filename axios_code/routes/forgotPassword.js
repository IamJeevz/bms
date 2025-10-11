const express = require('express');
const router = express.Router();
const db = require('../db'); // your mysql connection
const axios = require('axios');

// Helper: generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

router.post('/forgotPassword', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  try {
    // Check if user exists
    const [user] = await db.query("SELECT * FROM sec_user_mst WHERE phone_number = ?", [phone]);
    if (!user || !user.length) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const now = new Date();
	console.log(otp,'otp');
	console.log(now,'now');

    // Update OTP and timestamp in DB
    await db.query(
      "UPDATE sec_user_mst SET otp = ?, otp_created = ? WHERE phone_number = ?",
      [otp, now, phone]
    );

    // Send OTP via WhatsApp
    const messageData = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { preview_url: false, body: `Hello, your verification code is ${otp}` }
    };

    await axios.post('https://graph.facebook.com/v22.0/793948707137006/messages', messageData, {
      headers: {
        'Authorization': `Bearer EAAY5tYDyDGcBPakPJgYD8IFN44x9wC6E3lGScXxyWt7ZAuwlFp5Kk6kH7f2fXXL0qmca3y1FjIHZCyjhEzWp3R88vIHu3beaTZAiXpZAVUK5Pik6TQ7SK0oZBGV0R0dhhwvPxZCq9g35TgCLnd2idDuxCbBmlM7cHxqxRjBbTrvkOWbzm6klsZC07I0FS6uDwZDZD`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

module.exports = router;
