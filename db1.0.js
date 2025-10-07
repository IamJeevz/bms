const mysql = require('mysql2');

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

module.exports = db;
