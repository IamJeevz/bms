const { mongoose } = require('../db');

const userSchema = new mongoose.Schema({
  phone_number: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  signup_health: {type : Boolean},
  otp: { type: String },
  otp_created: { type: Date },
  token: { type: String },
  used: { type: Boolean, default: false }
}, { timestamps: true }); // optional: adds createdAt, updatedAt

// Reuse existing model if already compiled
module.exports = mongoose.models.sec_user_mst ||
                 mongoose.model('sec_user_mst', userSchema, 'sec_user_mst');
