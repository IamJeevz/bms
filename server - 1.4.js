const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 🔹 Function to generate dynamic x-bms-id
function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// 🔹 Axios GET with retry
async function axiosGetWithRetry(url, headers, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { headers });
    } catch (err) {
      console.warn(`⚠️ Attempt ${i + 1} failed for ${url}:`, err.response?.status || err.message);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
      else throw err;
    }
  }
}

// 🔹 Cache for cities
let cachedCities = null;

// API to fetch cities
app.get('/api/cities', async (req, res) => {
  if (cachedCities) return res.json(cachedCities);

  const citiesUrl = 'https://in.bookmyshow.com/api/explore/v1/discover/regions';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows',
  };

  try {
    const response = await axiosGetWithRetry(citiesUrl, headers);
    const data = response.data.BookMyShow;
    if (!data) throw new Error('Invalid response from BMS');

    const cities = [];
    const processCity = city => {
      if (city.SubRegions?.length) {
        city.SubRegions.forEach(sub => {
          cities.push({
            name: sub.SubRegionName,
            slug: sub.SubRegionSlug,
            regioncode: sub.SubRegionCode
          });
        });
      } else {
        cities.push({
          name: city.RegionName,
          slug: city.RegionSlug,
          regioncode: city.RegionCode
        });
      }
    };

    data.TopCities.forEach(processCity);
    data.OtherCities.forEach(processCity);

    cachedCities = cities; // cache
    console.log(`✅ Extracted ${cities.length} cities`);
    res.json(cities);

  } catch (err) {
    console.error('❌ Error fetching cities:', err.response?.status || err.message);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// API to fetch movies (current + upcoming)
app.get('/api/movies', async (req, res) => {
  const { slug, regioncode } = req.query;
  if (!slug || !regioncode) return res.status(400).json({ error: 'Missing slug or regioncode' });

  const headers = {
    'x-app-code': 'WEB',
    'x-bms-id': generateBmsId(),
    'x-platform-code': 'DESKTOP-WEB',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://in.bookmyshow.com/',
    'Origin': 'https://in.bookmyshow.com',
    'sec-ch-ua-platform': 'Windows'
  };

  const currentUrl = `https://in.bookmyshow.com/api/explore/v1/discover/movies-${slug}?region=${regioncode}`;
  const upcomingUrl = `https://in.bookmyshow.com/api/explore/v1/discover/upcoming-movies-${slug}?region=${regioncode}`;

  try {
    console.log(`🎬 Fetching movies for ${slug} (${regioncode})`);
    console.log('🆔 x-bms-id:', headers['x-bms-id']);

    const [currentMovies, upcomingMovies] = await Promise.all([
      axiosGetWithRetry(currentUrl, headers),
      axiosGetWithRetry(upcomingUrl, headers)
    ]);

    res.json({
      current: currentMovies.data || {},
      upcoming: upcomingMovies.data || {}
    });

  } catch (err) {
    console.error('❌ Error fetching movies:', err.response?.status || err.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});


// Fetch movie details by eventCode
app.post('/api/set-alert', (req, res) => {
  const { title, img, releaseDate, ctaUrl, alertDate, venue } = req.body;

  if (!title || !alertDate || !venue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Here you can save alert to database, schedule reminders, send emails, etc.
  console.log("Alert data received:", req.body);

  res.json({ message: `Alert set for "${title}" on ${alertDate} at ${venue}` });
});




app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
