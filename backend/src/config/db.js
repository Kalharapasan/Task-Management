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
    if (
      err.code === 'ER_DUP_FIELDNAME' ||
      err.errno === 1060 ||
      err.code === 'ER_DUP_KEYNAME' ||
      err.errno === 1061
    ) {
      // Column/Index already exists, safe to ignore
    } else {
      console.warn('[Auto-Migration]', err.message);
    }
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');

    // 1. Ensure user role ENUM supports 'admin', 'task_manager', 'employee'
    await runAutoMigration(
      connection,
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee'"
    );

    // 2. Ensure projects table exists
    await runAutoMigration(
      connection,
      `CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('Active', 'Completed', 'On Hold') NOT NULL DEFAULT 'Active',
        created_by INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`
    );

    // 3. Ensure tasks has assigned_to, project_id, and completion_note
    await runAutoMigration(
      connection,
      "ALTER TABLE tasks ADD COLUMN assigned_to INT NULL AFTER user_id"
    );
    await runAutoMigration(
      connection,
      "ALTER TABLE tasks ADD COLUMN project_id INT NULL AFTER assigned_to"
    );
    await runAutoMigration(
      connection,
      "ALTER TABLE tasks ADD COLUMN completion_note TEXT NULL AFTER description"
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
