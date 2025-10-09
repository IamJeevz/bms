const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db'); // this exports promiseDb

router.post('/reset-password', async (req, res) => {
  const { phone, currentPassword, newPassword } = req.body;

  if (!phone || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // ✅ Check if user exists
    const [users] = await db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    const validPass = await bcrypt.compare(currentPassword, user.password);

    if (!validPass) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // ✅ Hash new password
    const hashedNew = await bcrypt.hash(newPassword, 10);

    // ✅ Update password in DB
    await db.query('UPDATE sec_user_mst SET password = ? WHERE phone_number = ?', [hashedNew, phone]);

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
