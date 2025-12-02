// db.js
const mongoose = require('mongoose');
require("dotenv").config();

// MongoDB connection URI
const uri = process.env.DB_URI;

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // avoid hanging connections
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
};

// Export both mongoose and connect function
module.exports = { mongoose, connectDB };
