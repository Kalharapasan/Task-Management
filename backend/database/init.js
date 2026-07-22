
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function runMigration(connection, sql, description) {
  try {
    await connection.query(sql);
    console.log(`  ✓ ${description}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
      console.log(`  – ${description} (already exists, skipped)`);
    } else {
      throw err;
    }
  }
}

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  const db = process.env.DB_NAME || 'sql12833613';
  console.log(`Connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT}`);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8 COLLATE utf8_general_ci`
    );
  } catch (err) {
    // Shared/Cloud hosting user may not have global CREATE DATABASE permissions; continue to USE
  }
  await connection.query(`USE \`${db}\``);
  console.log(`Database '${db}' ready.\n`);

  // ── Create base tables ──────────────────────────────────────────────────────

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      status ENUM('Active', 'Completed', 'On Hold') NOT NULL DEFAULT 'Active',
      created_by INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      assigned_to INT NULL,
      project_id INT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      completion_note TEXT,
      priority ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
      status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
      due_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tasks_user_id(user_id),
      INDEX idx_tasks_assigned_to(assigned_to),
      INDEX idx_tasks_project_id(project_id),
      CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      jti VARCHAR(36) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_refresh_tokens_user_id(user_id),
      CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  console.log('Base tables ready.\n');

  // ── Safe migrations (idempotent) ─────────────────────────────────────────────
  console.log('Running migrations...');

  await runMigration(
    connection,
    `ALTER TABLE users MODIFY COLUMN role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee'`,
    'users.role column'
  );

  await runMigration(
    connection,
    `ALTER TABLE tasks ADD COLUMN assigned_to INT NULL AFTER user_id`,
    'tasks.assigned_to column'
  );

  await runMigration(
    connection,
    `ALTER TABLE tasks ADD COLUMN project_id INT NULL AFTER assigned_to`,
    'tasks.project_id column'
  );

  await runMigration(
    connection,
    `ALTER TABLE tasks ADD COLUMN completion_note TEXT NULL AFTER description`,
    'tasks.completion_note column'
  );

  console.log('\nMigrations complete.\n');

  // ── Seed admin user ──────────────────────────────────────────────────────────
  const name = process.env.DEFAULT_USER_NAME || 'Admin User';
  const email = process.env.DEFAULT_USER_EMAIL || 'admin@test.com';
  const password = process.env.DEFAULT_USER_PASSWORD || '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
  let userId;

  if (existing.length > 0) {
    userId = existing[0].id;
    await connection.query(
      "UPDATE users SET name = ?, password = ?, role = 'admin' WHERE id = ?",
      [name, hashedPassword, userId]
    );
    console.log(`Admin user updated: ${email}`);
  } else {
    const [result] = await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
      [name, email, hashedPassword]
    );
    userId = result.insertId;
    console.log(`Admin user created: ${email} / ${password}`);
  }

  await connection.end();
  console.log('\n✅ Database initialized successfully!');
  console.log(`   Admin login: ${email} / ${password}`);
}

init().catch((err) => {
  console.error('❌ Init failed:', err.message);
  process.exit(1);
});