const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'loikrathong2026',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Helper query function that mimics prepared statement execution
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

module.exports = {
  pool,
  query,
  execute,
  dbConfig
};
