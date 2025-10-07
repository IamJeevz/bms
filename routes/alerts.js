const express = require('express');
const router = express.Router();
const axios = require('axios');

// Setup alert
router.post('/movie-details', async (req, res) => {
  const { ctaUrl, title, img } = req.body;
  if (!ctaUrl || !title || !img) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const response = await axios.get(ctaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
        'Referer': 'https://in.bookmyshow.com/',
        'sec-ch-ua-platform': 'Windows'
      },
    });

    const html = response.data;
    const match = html.match(/"eventReleaseDate"\s*:\s*"([^"]+)"/);
    const releaseDate = match ? match[1] : 'TBA';

    res.json({ title, img, ctaUrl, releaseDate });
  } catch (err) {
    console.error('Error fetching movie details:', err.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

module.exports = router;
