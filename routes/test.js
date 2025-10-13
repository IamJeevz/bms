const express = require("express");
const router = express.Router();

router.post("/language", (req, res) => {
  res.json({ ok: true, message: "Language route working" });
});

module.exports = router;
