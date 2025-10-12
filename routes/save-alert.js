const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL connection

router.post("/save-alert", async (req, res) => {
  const {
    phone,
    event_code,
    temp_event_code,
    alert_date,
    venue,
    lang,
    format
  } = req.body;

  if (!phone || !alert_date || !venue || !lang || !format) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Decide which code to save
    const finalEventCode = event_code || null;
    const finalTempEventCode = temp_event_code || null;

    const sql = `
      INSERT INTO sec_alert_mst
      (phone, event_code, temp_event_code, alert_date, venue, lang, format, b_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      phone,
      finalEventCode,
      finalTempEventCode,
      alert_date,
      venue,
      lang,
      format,
      false, // b_status default
      false  // status default
    ];

    await db.query(sql, values);

    res.json({ success: true, message: "Alert saved successfully" });
  } catch (err) {
    console.error("Error inserting alert:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
