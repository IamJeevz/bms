const https = require('https');

// Create an HTTPS agent that disables certificate validation
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchRegions() {
  const url = 'https://in.bookmyshow.com/api/explore/v1/discover/regions';

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows'
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      agent
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.error('Fetch error:', err.message || err);
  }
}

fetchRegions();
