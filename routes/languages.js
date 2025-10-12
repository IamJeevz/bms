const express = require('express');
const router = express.Router();
const https = require('https');
const cheerio = require('cheerio');

const userAgents = [
 // 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.89 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

// Dummy BMS ID generator
function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// Disable SSL verification (only for development/testing)
const agent = new https.Agent({ rejectUnauthorized: false });

/**
 * Utility: Create headers with a random user-agent each time
 */
function createHeaders() {
  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
  return {
    'x-app-code': 'WEB',
    'x-bms-id': generateBmsId(),
    'x-platform-code': 'DESKTOP-WEB',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows',
    'User-Agent': randomUA
  };
}

/**
 * Extract data from the __INITIAL_STATE__ script inside the page
 */
async function fetchInitialState(url) {
  const headers = createHeaders();
  const res = await fetch(url, { method: 'GET', headers, agent });

  // Throw if the status is 400–499 (to trigger retry logic)
  if (res.status >= 400 && res.status < 500) {
    throw new Error(`Client error ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const scriptContent = $('script')
    .toArray()
    .map(tag => $(tag).html())
    .find(content => content && content.trim().startsWith('window.__INITIAL_STATE__ ='));

  if (!scriptContent) throw new Error('Script tag with __INITIAL_STATE__ not found.');

  const jsonString = scriptContent
    .replace('window.__INITIAL_STATE__ =', '')
    .trim()
    .replace(/;$/, '');

  return JSON.parse(jsonString);
}

/**
 * Primary method: Extract data from `pageCta`
 */
async function fetchLanguagesPrimary(url) {
  const json = await fetchInitialState(url);
  const pageCta = json?.synopsisStore?.synopsisRender?.bannerWidget?.pageCta;

  if (!Array.isArray(pageCta)) return [];

  const results = [];

  pageCta.forEach(cta => {
    const options = cta?.meta?.options || [];
    options.forEach(opt => {
      const language = opt.language;
      const formats = (opt.formats || []).map(fmt => ({
        dimension: fmt.dimension,
        eventCode: fmt.eventCode
      }));
      results.push({ language, formats });
    });
  });

  return results;
}

/**
 * Fallback method: Extract languages from `analytics.language`
 */
async function fetchLanguagesFallback(url) {
  const json = await fetchInitialState(url);
  const analytics = json?.synopsisStore?.synopsis?.analytics;

  if (!analytics) return { languages: [], formats: [] };

  const languages = (analytics.language || '')
    .split(',')
    .map(lang => lang.trim())
    .filter(Boolean);

  const formats = (analytics.format || '')
    .split(',')
    .map(fmt => fmt.trim())
    .filter(Boolean);

  return { languages, formats };
}

/**
 * Retry wrapper for primary/fallback with 3 attempts
 */
async function retryFetch(fetchFn, url, retries = 3, label = 'Primary') {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`${label} attempt ${attempt}...`);
      const result = await fetchFn(url);
      if (result && (Array.isArray(result) ? result.length > 0 : result.languages?.length > 0))
        return result;
    } catch (err) {
      console.error(`${label} attempt ${attempt} failed: ${err.message}`);
      if (!err.message.includes('Client error')) break; // stop retrying if not 400–499
    }
  }
  return null;
}

/**
 * Route: POST /api/language
 * Accepts { "ctaUrl": "<BMS movie ctaUrl>" } in body
 */
router.post('/language', async (req, res) => {
  try {
    const { ctaUrl } = req.body;

    if (!ctaUrl || typeof ctaUrl !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid ctaUrl in request body.' });
    }

    // Try primary up to 3 times
    const primaryData = await retryFetch(fetchLanguagesPrimary, ctaUrl, 3, 'Primary');

    if (primaryData && primaryData.length > 0) {
      return res.json({ available_languages: primaryData });
    }

    // If primary failed, try fallback 3 times
    const fallbackResult = await retryFetch(fetchLanguagesFallback, ctaUrl, 3, 'Fallback');

    if (fallbackResult && (fallbackResult.languages.length > 0 || fallbackResult.formats.length > 0)) {
      return res.json({
        preferred_languages: fallbackResult.languages,
        preferred_formats: fallbackResult.formats
      });
    }

    return res.status(404).json({ message: 'No language data found.' });
  } catch (err) {
    console.error('Error in /api/language:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

