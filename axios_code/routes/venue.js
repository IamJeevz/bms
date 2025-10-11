const express = require('express');
const axios = require('axios');
const router = express.Router();

// Generate unique x-bms-id for request header
function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// Example usage: /api/venue_search?r=KOCH&q=vanitha
router.get('/venue_search', async (req, res) => {
  const { r, q } = req.query;

  if (!r || !q) {
    return res.status(400).json({ message: 'Missing required query parameters: r, q' });
  }

  try {
    const apiUrl = `https://in.bookmyshow.com/quickbook-search.bms?r=${r}&cat=VN&q=${q}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'x-app-code': 'WEB',
        'x-bms-id': generateBmsId(),
        'x-platform-code': 'DESKTOP-WEB',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://in.bookmyshow.com/',
        'Origin': 'https://in.bookmyshow.com',
        'sec-ch-ua-platform': 'Windows'
      },
    });

    const data = response.data;

    if (!data || !Array.isArray(data.hits)) {
      console.log('⚠️ No valid hits found in BookMyShow response.');
      return res.status(404).json({ message: 'Invalid or empty response from BookMyShow API' });
    }

    // Filter for movie results (TYPE contains 'MT')
    const filteredHits = data.hits.filter(hit =>
  hit.CAT && hit.CAT.includes('VN') &&
  hit.TYPE && hit.TYPE.includes('MT') &&
  hit.GRP && hit.GRP === 'Venue'
);

    const movies = filteredHits.map(hit => ({
      title: hit.TITLE
    }));


    res.json({
      count: movies.length,
      movies
    });

  } catch (error) {
    console.error('❌ Error fetching data from BookMyShow:', error.message);
    res.status(500).json({
      message: 'Failed to fetch data from BookMyShow API',
      error: error.message
    });
  }
});

module.exports = router;
