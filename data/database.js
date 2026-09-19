const mysql = require('mysql2/promise');
const fs = require('node:fs');
const sslEnabled = process.env.DB_SSL === 'true';
const ca = process.env.DB_CA_CERT?.replace(/\\n/g, '\n') ||
  (process.env.DB_CA_PATH ? fs.readFileSync(process.env.DB_CA_PATH, 'utf8') : undefined);
if (process.env.NODE_ENV === 'production' && !sslEnabled) {
  throw new Error('Set DB_SSL=true for the hosted database.');
}
module.exports = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'new_schema',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: sslEnabled ? { rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined,
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 50,
  charset: 'utf8mb4'
});
