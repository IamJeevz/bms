const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert"); // Mongo model

router.post("/save-alert", async (req, res) => {
  const { phone, event_code, temp_event_code, alert_date, venue, lang, format } = req.body;

  if (!phone || !alert_date || !venue || !lang || !format) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const finalEventCode = event_code || null;
    const finalTempEventCode = temp_event_code || null;

    // ✅ Check if alert already exists (either event_code OR temp_event_code match)
    const existing = await Alert.findOne({
      phone,
      alert_date,
      venue,
      lang,
      format,
      $or: [
        { event_code: finalEventCode, event_code: { $ne: null } },
        { temp_event_code: finalTempEventCode, temp_event_code: { $ne: null } }
      ]
    });

    if (existing) {
      return res.json({ success: false, message: "⚠️ Alert has already been set for this movie." });
    }

    // ✅ Insert new alert if not exists
    const newAlert = new Alert({
      phone,
      event_code: finalEventCode,
      temp_event_code: finalTempEventCode,
      alert_date,
      venue,
      lang,
      format,
      b_status: false,
      status: false
    });

    await newAlert.save();

    return res.json({ success: true, message: "✅ Alert saved successfully" });
  } catch (err) {
    console.error("❌ Error in /save-alert:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
