/**
 * Database configuration and connection pool setup.
 * We use a connection pool to improve performance by reusing database connections
 * instead of opening and closing a new connection for every query.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // dateStrings: true prevents mysql2 from automatically converting DATE/DATETIME
  // columns into JavaScript Date objects. This is useful to avoid timezone shifts
  // and formatting issues when sending data directly to the client.
  dateStrings: true
});

module.exports = pool;
