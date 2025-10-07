const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// DB
const db = require('./db');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/cities'));
app.use('/api', require('./routes/movies'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/forgotPassword'));
app.use('/api', require('./routes/resetPassword'));
app.use('/api', require('./routes/verify-otp'));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
