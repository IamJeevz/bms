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
    console.error('Error fetching cities:', error.response?.status, error.message);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});


module.exports = router;
