const express = require('express');
const router = express.Router();
const https = require('https');

// Create an HTTPS agent that disables certificate validation
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// Generate unique x-bms-id for request header
function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// Rotating User-Agents
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.89 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

// Helper function for 1-second delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch helper with retry logic and delay
async function fetchWithRetry(url, headers, attempt = 1, maxAttempts = 5) {
  const userAgent = userAgents[(attempt - 1) % userAgents.length];
  headers['User-Agent'] = userAgent;

  console.log(`Fetching [Attempt ${attempt}] URL: for venue using UA: ${userAgent}`);

  try {
    const response = await fetch(url, { method: 'GET', headers, agent });

    if (response.status >= 400 && response.status < 500 && attempt < maxAttempts) {
      console.warn(`Retrying... got status ${response.status}, waiting 1s before retry`);
      await delay(1000); // 1-second delay
      return fetchWithRetry(url, headers, attempt + 1, maxAttempts);
    }

    return response;
  } catch (err) {
    if (attempt < maxAttempts) {
      console.warn(`Error: ${err.message}. Retrying attempt ${attempt + 1} after 1s`);
      await delay(1000);
      return fetchWithRetry(url, headers, attempt + 1, maxAttempts);
    }
    throw err;
  }
}

// Example usage: /api/venue_search?r=KOCH&q=vanitha
router.get('/venue_search', async (req, res) => {
  const { r, q } = req.query;

  if (!r || !q) {
    return res.status(400).json({ message: 'Missing required query parameters: r, q' });
  }

  const apiUrl = `https://in.bookmyshow.com/quickbook-search.bms?r=${r}&cat=VN&q=${q}`;

  const headers = {
    'x-app-code': 'WEB',
    'x-bms-id': generateBmsId(),
    'x-platform-code': 'DESKTOP-WEB',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows',
  };

  try {
    const response = await fetchWithRetry(apiUrl, { ...headers });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.hits)) {
      console.log('⚠️ No valid hits found in BookMyShow response.');
      return res.status(404).json({ message: 'Invalid or empty response from BookMyShow API' });
    }

    // Filter for movie results (TYPE contains 'MT')
    const filteredHits = data.hits.filter(
      hit =>
        hit.CAT && hit.CAT.includes('VN') &&
        hit.TYPE && hit.TYPE.includes('MT') &&
        hit.GRP && hit.GRP === 'Venue'
    );

    const movies = filteredHits.map(hit => ({
      title: hit.TITLE,
    }));

    res.json({
      count: movies.length,
      movies,
    });

  } catch (error) {
    console.error('❌ Error fetching data from BookMyShow:', error.message);
    res.status(500).json({
      message: 'Failed to fetch data from BookMyShow API',
      error: error.message,
    });
  }
});

module.exports = router;
