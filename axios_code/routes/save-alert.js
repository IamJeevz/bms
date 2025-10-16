const express = require("express");
const router = express.Router();
const db = require("../db"); // MySQL connection

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
    const finalEventCode = event_code || null;
    const finalTempEventCode = temp_event_code || null;

    // ✅ Check if alert already exists (either event_code OR temp_event_code match)
    const checkSql = `
      SELECT COUNT(*) AS count
      FROM sec_alert_mst
      WHERE phone = ?
        AND alert_date = ?
        AND venue = ?
        AND lang = ?
        AND format = ?
        AND (
          (event_code IS NOT NULL AND event_code = ?) OR
          (temp_event_code IS NOT NULL AND temp_event_code = ?)
        )
    `;
    const [rows] = await db.query(checkSql, [
      phone,
      alert_date,
      venue,
      lang,
      format,
      finalEventCode,
      finalTempEventCode
    ]);

    if (rows[0].count > 0) {
      return res.json({ success: false, message: "⚠️ Alert has already been set for this movie." });
    }

    // ✅ Insert new alert if not exists
    const insertSql = `
      INSERT INTO sec_alert_mst
      (phone, event_code, temp_event_code, alert_date, venue, lang, format, b_status, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
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

    await db.query(insertSql, insertValues);

    return res.json({ success: true, message: "✅ Alert saved successfully" });

  } catch (err) {
    console.error("❌ Error in /save-alert:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
