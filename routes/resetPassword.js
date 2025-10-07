const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

router.post('/reset-password', async (req, res) => {
  const { phone, currentPassword, newPassword } = req.body;

  if (!phone || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Check if user exists
    db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone], async (err, result) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (result.length === 0) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }

      const user = result[0];
      const validPass = await bcrypt.compare(currentPassword, user.password);

      if (!validPass) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }

      const hashedNew = await bcrypt.hash(newPassword, 10);

      db.query('UPDATE sec_user_mst SET password = ? WHERE phone_number = ?', [hashedNew, phone], (err2) => {
        if (err2) {
          console.error('DB update error:', err2);
          return res.status(500).json({ success: false, message: 'Failed to update password' });
        }

        return res.json({ success: true, message: 'Password reset successfully' });
      });
    });
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
