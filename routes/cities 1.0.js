const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/cities', async (req, res) => {
  try {
    const response = await axios.get('https://in.bookmyshow.com/api/explore/v1/discover/regions', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://in.bookmyshow.com/',
        'Origin': 'https://in.bookmyshow.com',
        'sec-ch-ua-platform': 'Windows',
      },
    });

    const data = response.data.BookMyShow;
    let cities = [];

    const processCity = city => {
      if (city.SubRegions && city.SubRegions.length > 0) {
        city.SubRegions.forEach(sub => {
          cities.push({ name: sub.SubRegionName, slug: sub.SubRegionSlug, regioncode: sub.SubRegionCode });
        });
      } else {
        cities.push({ name: city.RegionName, slug: city.RegionSlug, regioncode: city.RegionCode });
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

module.exports = router;
