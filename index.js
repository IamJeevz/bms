const express = require('express');
const { connectDB } = require('./db'); // import the db.js

const app = express();
const PORT = 3000;

// connect to MongoDB
connectDB();

app.use(express.json());

// sample route
app.get('/', (req, res) => {
  res.send('MongoDB Connected and API Running ✅');
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
