const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Signup
router.post('/signup', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const [existing] = await db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone]);
    if (existing.length > 0)
      return res.status(400).json({ success: false, message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO sec_user_mst (phone_number, password) VALUES (?, ?)', [phone, hashed]);

    res.json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const [rows] = await db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone]);
    if (rows.length === 0)
      return res.status(400).json({ success: false, message: 'User not found' });

    const user = rows[0];
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
