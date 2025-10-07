const express = require('express');
const router = express.Router();
const axios = require('axios');

function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// Fetch movies
router.get('/movies', async (req, res) => {
  const { slug, regioncode } = req.query;
  if (!slug || !regioncode) return res.status(400).json({ error: 'Missing slug or regioncode' });

  const headers = {
    'x-app-code': 'WEB',
    'x-bms-id': generateBmsId(),
    'x-platform-code': 'DESKTOP-WEB',
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows'
  };

  const currentUrl = `https://in.bookmyshow.com/api/explore/v1/discover/movies-${slug}?region=${regioncode}`;
  const upcomingUrl = `https://in.bookmyshow.com/api/explore/v1/discover/upcoming-movies-${slug}?region=${regioncode}`;

  try {
    const [currentMovies, upcomingMovies] = await Promise.all([
      axios.get(currentUrl, { headers }),
      axios.get(upcomingUrl, { headers }),
    ]);

    res.json({ current: currentMovies.data, upcoming: upcomingMovies.data });
  } catch (err) {
    console.error('Error fetching movies:', err.response?.status, err.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

module.exports = router;
