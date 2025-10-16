const { mongoose } = require('../db');

const alertSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  event_code: { type: String },
  temp_event_code: { type: String },
  created_date: { type: Date, default: Date.now },
  alert_date: { type: String },
  venue: { type: String },
  lang: { type: String },
  format: { type: String },
  b_status: { type: Boolean, default: false },
  status: { type: Boolean, default: false }
});

// Reuse existing model if already compiled
module.exports = mongoose.models.sec_alert_mst ||
                 mongoose.model('sec_alert_mst', alertSchema, 'sec_alert_mst');
