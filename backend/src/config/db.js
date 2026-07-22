const mysql = require('mysql2/promise');
require('dotenv').config();


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  connectTimeout: 10000,       // 10 s — fail fast instead of hanging
  enableKeepAlive: true,       // recover from idle-dropped connections
  keepAliveInitialDelay: 0,
});

async function runAutoMigration(connection, sql) {
  try {
    await connection.query(sql);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
      // Column already exists, safe to ignore
    } else {
      console.warn('[Auto-Migration]', err.message);
    }
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');

    // Automatically ensure role and assigned_to columns exist on boot
    await runAutoMigration(
      connection,
      "ALTER TABLE users ADD COLUMN role ENUM('admin','employee') NOT NULL DEFAULT 'employee'"
    );
    await runAutoMigration(
      connection,
      "ALTER TABLE tasks ADD COLUMN assigned_to INT NULL AFTER user_id"
    );

    // Ensure default admin user has admin role
    try {
      await connection.query("UPDATE users SET role = 'admin' WHERE email = 'admin@test.com'");
    } catch (_) {}

    connection.release();
    console.log('Database schema auto-migrated and ready.');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    console.error('Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in your .env file.');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
