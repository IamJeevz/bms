const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch cities
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

    // TopCities
    data.TopCities.forEach(city => {
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
    });

    // OtherCities
    data.OtherCities.forEach(city => {
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
    });

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error.response?.status, error.message);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
