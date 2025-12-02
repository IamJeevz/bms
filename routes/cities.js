const express = require('express');
const router = express.Router();
const https = require('https');

// Create an HTTPS agent that disables certificate validation
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// List of different User-Agent strings to randomize requests
const userAgents = [
  //'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.89 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
 // 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
 // 'Mozilla/5.0 (Windows NT 10.0; Win64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'PostmanRuntime/7.49.0'
];

// Function to perform fetch with retry logic
async function fetchWithRetry(url, options, retries = 4, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    // Rotate User-Agent each attempt
	const ran=Math.floor(Math.random() * userAgents.length);
	console.log('userAgents>>',userAgents[ran],'attempt=',attempt);
    options.headers['User-Agent'] = userAgents[ran];

    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }

      // Retry only if status is between 400–499
      if (response.status >= 400 && response.status < 500) {
        console.warn(`⚠️ Attempt ${attempt} failed with status ${response.status}. Retrying...`);
        if (attempt < retries) await new Promise(res => setTimeout(res, delay));
        continue;
      }

      // If error is 500+, don’t retry
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⚠️ Attempt ${attempt} failed (${err.message}). Retrying...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

router.get('/cities', async (req, res) => {
  const url = 'https://in.bookmyshow.com/api/explore/v1/discover/regions';

  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows',
  };

  try {
    const response = await fetchWithRetry(url, { method: 'GET', headers, agent });
    const json = await response.json();
    const data = json.BookMyShow;
    let allCities = [];
    let topCities = [];

    const processCity = city => {
      const cityList = [];
      if (city.SubRegions && city.SubRegions.length > 0) {
        city.SubRegions.forEach(sub => {
          const c = { name: sub.SubRegionName, slug: sub.SubRegionSlug, regioncode: sub.SubRegionCode };
          cityList.push(c);
        });
      } else {
        cityList.push({ name: city.RegionName, slug: city.RegionSlug, regioncode: city.RegionCode });
      }
      return cityList;
    };

    data.TopCities.forEach(city => {
      topCities.push(...processCity(city));
    });

    data.TopCities.forEach(city => {
      allCities.push(...processCity(city));
    });
    data.OtherCities.forEach(city => {
      allCities.push(...processCity(city));
    });

    res.json({ topCities, allCities });
  } catch (error) {
    console.error('❌ Error fetching cities:', error.message);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

module.exports = router;
