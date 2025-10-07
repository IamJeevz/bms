const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Signup
router.post('/signup', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone], async (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (result.length > 0) return res.status(400).json({ success: false, message: 'User already exists' });

      const hashed = await bcrypt.hash(password, 10);
      db.query('INSERT INTO sec_user_mst (phone_number, password) VALUES (?, ?)', [phone, hashed], err2 => {
        if (err2) return res.status(500).json({ success: false, message: 'Error inserting user' });
        res.json({ success: true, message: 'Signup successful' });
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

  db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (result.length === 0) return res.status(400).json({ success: false, message: 'User not found' });

    const user = result[0];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ success: false, message: 'Incorrect password' });

    res.json({ success: true, message: 'Login successful' });
  });
});

module.exports = router;
