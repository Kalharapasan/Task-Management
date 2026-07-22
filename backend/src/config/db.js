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
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function runSql(connection, sql, label) {
  try {
    await connection.query(sql);
    console.log(`[Auto-Migration] Success: ${label}`);
  } catch (err) {
    if (
      err.code === 'ER_DUP_FIELDNAME' ||
      err.errno === 1060 ||
      err.code === 'ER_DUP_KEYNAME' ||
      err.errno === 1061 ||
      err.code === 'ER_TABLE_EXISTS_ERROR' ||
      err.errno === 1050
    ) {
      // Already exists, safe
    } else {
      console.warn(`[Auto-Migration] Notice on ${label}:`, err.message);
    }
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');

    // 1. Ensure projects table exists first (without complex FK to avoid creation failures)
    await runSql(
      connection,
      `CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('Active', 'Completed', 'On Hold') NOT NULL DEFAULT 'Active',
        created_by INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        INDEX idx_projects_created_by(created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
      'create projects table'
    );

    // 2. Ensure user role column exists & supports 'admin', 'task_manager', 'employee'
    await runSql(
      connection,
      "ALTER TABLE users ADD COLUMN role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee'",
      'add users.role column'
    );
    await runSql(
      connection,
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee'",
      'modify users.role enum'
    );

    // 3. Ensure tasks table has all required columns (no positional AFTER clauses)
    await runSql(
      connection,
      "ALTER TABLE tasks ADD COLUMN assigned_to INT NULL",
      'add tasks.assigned_to'
    );
    await runSql(
      connection,
      "ALTER TABLE tasks ADD COLUMN project_id INT NULL",
      'add tasks.project_id'
    );
    await runSql(
      connection,
      "ALTER TABLE tasks ADD COLUMN completion_note TEXT NULL",
      'add tasks.completion_note'
    );

    // 4. Ensure default admin user has admin role
    try {
      await connection.query("UPDATE users SET role = 'admin' WHERE email = 'admin@test.com'");
    } catch (_) {}

    connection.release();
    console.log('Database schema auto-migrated and verified.');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    console.error('Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in your .env file.');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
