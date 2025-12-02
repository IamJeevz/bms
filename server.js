const express = require('express');
const path = require('path');
const app = express();
require("dotenv").config();

const PORT = process.env.PORT;

// DB
const { connectDB } = require('./db');

connectDB();
// Middleware
app.use(express.json());

// ?? Route: when user opens "/", send login page instead of index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/cities'));
app.use('/api', require('./routes/movies'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/sendOTP'));
app.use('/api', require('./routes/resetPassword'));
app.use('/api', require('./routes/verify-otp'));
app.use('/api', require('./routes/venue'));
app.use('/api', require('./routes/languages'));
app.use('/api', require('./routes/save-alert'));

// Static files (after the above so it doesn�t override)
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => console.log(`?? Server running on http://localhost:${PORT}`));
