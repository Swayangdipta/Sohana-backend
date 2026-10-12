/**
 * Database Initialization Script
 * Purpose: Reads all SQL schema files in the schema directory and executes them
 * to ensure the database structure is up to date.
 * Safety: All SQL scripts must use 'CREATE TABLE IF NOT EXISTS' for idempotency.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDb() {
  // Create a connection to run multiple statements for initial DB setup
  let connection;
  try {
    const dbName = process.env.DB_NAME || 'hotel_db';
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Allows running multi-statement scripts
    });

    // Automatically create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log('Connected to database successfully. Starting schema initialization...');

    // Check if base tables exist (like 'hotels')
    const [tables] = await connection.query("SHOW TABLES LIKE 'hotels'");
    if (tables.length === 0) {
      console.log('Base schema not found. Importing hotel.sql...');
      const baseSqlPath = path.join(__dirname, '../../hotel.sql');
      if (fs.existsSync(baseSqlPath)) {
        const baseSql = fs.readFileSync(baseSqlPath, 'utf8');
        await connection.query(baseSql);
        console.log('Base schema imported successfully.');
      } else {
        console.warn('Warning: Base schema hotel.sql not found at project root!');
      }
    }

    const schemaDir = path.join(__dirname, 'schema');
    const files = fs.readdirSync(schemaDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Process files in alphanumeric order (e.g., 001_, 002_)

    let processedCount = 0;

    for (const file of files) {
      console.log(`Executing: ${file}...`);
      const filePath = path.join(schemaDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      if (sql.trim()) {
        await connection.query(sql);
        processedCount++;
      }
    }

    console.log(`Database schema initialized successfully. ${processedCount} tables processed.`);
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDb();
