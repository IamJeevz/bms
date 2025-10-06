const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 🔹 Generate dynamic x-bms-id
function generateBmsId() {
  const prefix = 1;
  const randomInt = Math.floor(Math.random() * 1_000_000_000);
  const timestamp = Date.now();
  return `${prefix}.${randomInt}.${timestamp}`;
}

// 🔹 Fetch cities
app.get('/api/cities', async (req, res) => {
  try {
    const response = await axios.get(
      'https://in.bookmyshow.com/api/explore/v1/discover/regions',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://in.bookmyshow.com/',
          'Origin': 'https://in.bookmyshow.com',
          'sec-ch-ua-platform': 'Windows',
        },
      }
    );

    const data = response.data.BookMyShow;
    let cities = [];

    const processCity = city => {
      if (city.SubRegions && city.SubRegions.length > 0) {
        city.SubRegions.forEach(sub => {
          cities.push({
            name: sub.SubRegionName,
            slug: sub.SubRegionSlug,
            regioncode: sub.SubRegionCode,
          });
        });
      } else {
        cities.push({
          name: city.RegionName,
          slug: city.RegionSlug,
          regioncode: city.RegionCode,
        });
      }
    };

    data.TopCities.forEach(processCity);
    data.OtherCities.forEach(processCity);

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error.response?.status, error.message);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// 🔹 Fetch movies
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
    const [currentMovies, upcomingMovies] = await Promise.all([
      axios.get(currentUrl, { headers }),
      axios.get(upcomingUrl, { headers }),
    ]);

    res.json({ current: currentMovies.data, upcoming: upcomingMovies.data });
  } catch (err) {
    console.error('Error fetching movies:', err.response?.status, err.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// 🔹 Setup Alert POST API
app.post('/api/movie-details', async (req, res) => {
  const { ctaUrl, title, img } = req.body;

  if (!ctaUrl || !title || !img) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await axios.get(ctaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
        'Referer': 'https://in.bookmyshow.com/',
		'sec-ch-ua-platform': 'Windows'
      },
    });

    const html = response.data;

    // Extract eventReleaseDate
    const match = html.match(/"eventReleaseDate"\s*:\s*"([^"]+)"/);
    const releaseDate = match ? match[1] : 'TBA';

    res.json({ title, img, ctaUrl, releaseDate });
  } catch (err) {
    console.error('Error fetching movie details:', err.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
