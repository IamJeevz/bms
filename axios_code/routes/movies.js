const express = require('express');
const router = express.Router();
const https = require('https');

// Create an HTTPS agent that disables certificate validation
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// Generate BMS ID
function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// Rotating User-Agents
const userAgents = [
  //'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.89 Safari/537.36',
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

  console.log(`Fetching [Attempt ${attempt}] using UA: ${userAgent}`);

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

// Fetch movies
router.get('/movies', async (req, res) => {
  const { slug, regioncode } = req.query;
  if (!slug || !regioncode)
    return res.status(400).json({ error: 'Missing slug or regioncode' });

  const headers = {
    'x-app-code': 'WEB',
    'x-bms-id': generateBmsId(),
    'x-platform-code': 'DESKTOP-WEB',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows',
  };

  const currentUrl = `https://in.bookmyshow.com/api/explore/v1/discover/movies-${slug}?region=${regioncode}`;
  const upcomingUrl = `https://in.bookmyshow.com/api/explore/v1/discover/upcoming-movies-${slug}?region=${regioncode}`;

  try {
    const [currentRes, upcomingRes] = await Promise.all([
      fetchWithRetry(currentUrl, { ...headers }),
      fetchWithRetry(upcomingUrl, { ...headers }),
    ]);

    if (!currentRes.ok || !upcomingRes.ok) {
      throw new Error(`HTTP error ${currentRes.status} or ${upcomingRes.status}`);
    }

    const [currentMovies, upcomingMovies] = await Promise.all([
      currentRes.json(),
      upcomingRes.json(),
    ]);

    res.json({ current: currentMovies, upcoming: upcomingMovies });
  } catch (err) {
    console.error('Error fetching movies:', err.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

module.exports = router;
