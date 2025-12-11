const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Datenbankverbindung hergestellt');
});

pool.on('error', (err) => {
  console.error('Unerwarteter Datenbankfehler:', err);
  process.exit(-1);
});

module.exports = pool;
