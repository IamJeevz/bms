const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API to fetch cities (your existing code)
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
        }
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

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error.response?.status, error.message);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// New API to fetch movies for selected city
app.get('/api/movies', async (req, res) => {
  const { slug, regioncode } = req.query;

  if (!slug || !regioncode) {
    return res.status(400).json({ error: 'Missing slug or regioncode' });
  }

  // Construct URLs
  const currentUrl = `https://in.bookmyshow.com/api/explore/v1/discover/movies-${slug}?region=${regioncode}`;
  const upcomingUrl = `https://in.bookmyshow.com/api/explore/v1/discover/upcoming-movies-${slug}?region=${regioncode}`;

  // ✅ Print URLs for debugging
  console.log("📌 Current movies URL:", currentUrl);
  console.log("📌 Upcoming movies URL:", upcomingUrl);

  try {
    // Fetch current movies
    const currentMovies = await axios.get(currentUrl, {
      headers: {
        'x-app-code': 'WEB',
        'x-bms-id': '1.250796596.1759067863599',
        'x-platform-code': 'DESKTOP-WEB',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://in.bookmyshow.com/',
        'Origin': 'https://in.bookmyshow.com',
        'sec-ch-ua-platform': 'Windows'
      }
    });

    // Fetch upcoming movies
    const upcomingMovies = await axios.get(upcomingUrl, {
      headers: {
        'x-app-code': 'WEB',
        'x-bms-id': '1.250796596.1759067863599',
        'x-platform-code': 'DESKTOP-WEB',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://in.bookmyshow.com/',
        'Origin': 'https://in.bookmyshow.com',
        'sec-ch-ua-platform': 'Windows'
      }
    });

    res.json({
      current: currentMovies.data,
      upcoming: upcomingMovies.data
    });

  } catch (error) {
    console.error('Error fetching movies:', error.response?.status, error.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});



app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
