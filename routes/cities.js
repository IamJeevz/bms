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
  'PostmanRuntime/7.49.1'
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
  //const url = 'http://10.244.123.33:3000/get';
  
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows',
	'sec-ch-ua' : '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
	'sec-ch-ua-mobile':'?0',
	'Cookie':'__cf_bm=0jVQuGKeoqBcfLYK5tnvKu4avmwYxowCAFqKfonZfl4-1765195284-1.0.1.1-h6BQ4PP6V4WxMuKERl4WKVtWzUKPG_pjh9cSs.MPGVXI4FttCQsx7nGJcgultouZHEqvETz91FTepQwj_ITuOW3rBN3JrRKaGj68TQXAiYM; _cfuvid=IVnkukp7PKfh2LR.fxUM4OwjsDFEcgeFgjIS4FP7VGQ-1765195284709-0.0.1.1-604800000',
	'sentry-trace':'bf01580a61bc4ffbae089ec5c871dff1-824187eaad6a8640-0',
	'baggage':'sentry-environment=production,sentry-release=release_4184,sentry-public_key=4d17a59c2597410e714ab31d421148d9,sentry-trace_id=bf01580a61bc4ffbae089ec5c871dff1,sentry-transaction=%2Fexplore%2Fhome%2F%3AregionSlug%3F,sentry-sampled=false,sentry-sample_rand=0.22398215182183667,sentry-sample_rate=0.001',
	'cache-control':'no-cache',
	'sec-fetch-site':'same-origin',
	'priority':'u=1, i',
	'pragma':'no-cache',
	'sec-fetch-dest':'empty',
	'sec-fetch-mode':'cors',
	'Postman-Token':'08689d1a-08f5-48fc-91b2-7db89bad9669',
	'host': '10.244.123.33:3000'
	
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
    console.error('❌ Error fetching cities:', JSON.stringify(error.message));
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

module.exports = router;
