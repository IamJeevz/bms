const express = require('express');
const router = express.Router();
const https = require('https');

// Create an HTTPS agent that disables certificate validation
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// Setup alert
router.post('/movie-details', async (req, res) => {
  const { ctaUrl, title, img } = req.body;
  if (!ctaUrl || !title || !img)
    return res.status(400).json({ error: 'Missing parameters' });

  const headers = {
    'User-Agent': 'PostmanRuntime/7.49.1',
    'Accept': 'text/html',
    'Referer': 'https://in.bookmyshow.com/',
    'sec-ch-ua-platform': 'Windows',
  };

  try {
    const response = await fetch(ctaUrl, {
      method: 'GET',
      headers,
      agent,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const match = html.match(/"eventReleaseDate"\s*:\s*"([^"]+)"/);
    const releaseDate = match ? match[1] : 'TBA';

    res.json({ title, img, ctaUrl, releaseDate });
  } catch (err) {
    console.error('Error fetching movie details:', err.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

module.exports = router;
