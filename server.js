const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// DB
const db = require('./db');

// Middleware
app.use(express.json());

// ?? Route: when user opens "/", send login page instead of index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Static files (after the above so it doesn’t override)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/cities'));
app.use('/api', require('./routes/movies'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/forgotPassword'));
app.use('/api', require('./routes/resetPassword'));
app.use('/api', require('./routes/verify-otp'));
app.use('/api', require('./routes/venue'));

// Start Server
app.listen(PORT, () => console.log(`?? Server running on http://localhost:${PORT}`));
