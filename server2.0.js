const express = require('express');
const axios = require('axios');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// MySQL connection
const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12801770',
  password: '9hYwsEFdGy',
  database: 'sql12801770',
  port: 3306
});


db.connect(err => {
  if (err) console.error('MySQL connection failed:', err);
  else console.log('✅ Connected to MySQL');
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ------------------ LOGIN / SIGNUP ------------------ //

// Signup
// Signup API
app.post('/api/signup', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    // Check if user already exists
    db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone], async (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (result.length > 0) return res.status(400).json({ success: false, message: 'User already exists' });

      const hashed = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO sec_user_mst (phone_number, password) VALUES (?, ?)',
        [phone, hashed],
        (err2) => {
          if (err2) return res.status(500).json({ success: false, message: 'Error inserting user' });
          res.json({ success: true, message: 'Signup successful' });
        }
      );
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login API
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  db.query('SELECT * FROM sec_user_mst WHERE phone_number = ?', [phone], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (result.length === 0) return res.status(400).json({ success: false, message: 'User not found' });

    const user = result[0];
    const validPass = await bcrypt.compare(password, user.password);

    if (!validPass) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    res.json({ success: true, message: 'Login successful' });
  });
});

// ------------------ EXISTING MOVIE/CITY APIS ------------------ //

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
          'User-Agent': 'Mozilla/5.0',
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
    'User-Agent': 'Mozilla/5.0',
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
  if (!ctaUrl || !title || !img) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const response = await axios.get(ctaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
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

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
