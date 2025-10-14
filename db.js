const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12802756',
  password: 'bWdAele3Ud',
  database: 'sql12802756',
  port: 3306,
  // added new wait 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// connect
db.connect(err => {
  if (err) console.error('MySQL connection failed:', err);
  else console.log('✅ Connected to MySQL');
});

// wrap with promise
const promiseDb = db.promise();

module.exports = promiseDb;
