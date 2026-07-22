const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

async function autoSeedDemoData(connection) {
  const [uRows] = await connection.query('SELECT COUNT(*) AS total FROM users');
  if (Number(uRows[0].total) > 1) {
    console.log('[Auto-Seed] Demo data already exists, skipping auto-seed.');
    return;
  }

  console.log('[Auto-Seed] Seeding fresh demo users, projects, and tasks...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Seed Users
  const usersData = [
    ['Admin User', 'admin@test.com', passwordHash, 'admin'],
    ['Sarah Manager', 'manager@test.com', passwordHash, 'task_manager'],
    ['Alex Rivera', 'alex@test.com', passwordHash, 'employee'],
    ['Maria Garcia', 'maria@test.com', passwordHash, 'employee'],
    ['David Chen', 'david@test.com', passwordHash, 'employee'],
  ];

  const userIds = {};
  for (const [uName, uEmail, uPass, uRole] of usersData) {
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [uEmail]);
    if (existing.length > 0) {
      userIds[uEmail] = existing[0].id;
      await connection.query(
        'UPDATE users SET name = ?, password = ?, role = ? WHERE id = ?',
        [uName, uPass, uRole, existing[0].id]
      );
    } else {
      const [res] = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [uName, uEmail, uPass, uRole]
      );
      userIds[uEmail] = res.insertId;
    }
  }

  const adminId = userIds['admin@test.com'];
  const managerId = userIds['manager@test.com'];
  const alexId = userIds['alex@test.com'];
  const mariaId = userIds['maria@test.com'];
  const davidId = userIds['david@test.com'];

  // 2. Seed Projects
  const projectsData = [
    ['E-Commerce Website Redesign', 'Revamp online store UI/UX, improve checkout speed, and add Stripe payment integration.', 'Active', adminId],
    ['Mobile App Development', 'Build cross-platform iOS & Android mobile app for on-the-go task management.', 'Active', managerId],
    ['Cloud Infrastructure Migration', 'Migrate legacy server setup to scalable AWS cloud architecture with automated CI/CD.', 'Completed', adminId],
    ['Customer Support Portal', 'Self-service support ticketing portal with AI knowledgebase lookup.', 'On Hold', managerId],
  ];

  const projectIds = {};
  for (const [pName, pDesc, pStatus, pCreatedBy] of projectsData) {
    const [existingP] = await connection.query('SELECT id FROM projects WHERE name = ?', [pName]);
    if (existingP.length > 0) {
      projectIds[pName] = existingP[0].id;
    } else {
      const [res] = await connection.query(
        'INSERT INTO projects (name, description, status, created_by) VALUES (?, ?, ?, ?)',
        [pName, pDesc, pStatus, pCreatedBy]
      );
      projectIds[pName] = res.insertId;
    }
  }

  const p1 = projectIds['E-Commerce Website Redesign'];
  const p2 = projectIds['Mobile App Development'];
  const p3 = projectIds['Cloud Infrastructure Migration'];
  const p4 = projectIds['Customer Support Portal'];

  // 3. Seed Tasks
  const tasksData = [
    [adminId, alexId, p1, 'Design UI/UX Mockups', 'Create responsive wireframes and high-fidelity Figma mockups for desktop & mobile.', 'Finished Figma mockups and user flow diagrams for executive review.', 'High', 'Completed', -5],
    [adminId, mariaId, p1, 'Setup React Frontend & Tailwind', 'Initialize Vite React boilerplate with atomic component structure and Tailwind utility classes.', 'Created reusable layout, sidebar, and navbar components.', 'High', 'In Progress', 3],
    [adminId, alexId, p1, 'Integrate Stripe Payment Gateway', 'Implement Stripe Checkout API with webhooks for automated order confirmation.', null, 'Medium', 'Pending', 7],

    [managerId, davidId, p2, 'API Endpoint Specifications', 'Document RESTful OpenAPI specification endpoints for user auth, tasks, and notifications.', 'Swagger UI documentation published to staging server.', 'High', 'Completed', -2],
    [managerId, alexId, p2, 'Implement Authentication Flow', 'Add JWT access/refresh token handling with biometric login support.', 'JWT authentication tokens & token rotation logic verified.', 'High', 'In Progress', 4],
    [managerId, mariaId, p2, 'Push Notification System', 'Configure Firebase Cloud Messaging (FCM) for real-time mobile push notifications.', null, 'Low', 'Pending', 10],

    [adminId, davidId, p3, 'Setup AWS S3 & RDS MySQL', 'Provision Amazon RDS MySQL multi-AZ instance and configure S3 bucket security policies.', 'Database migrated cleanly without data loss. Multi-AZ standby active.', 'High', 'Completed', -10],
    [adminId, managerId, p3, 'Configure CI/CD Pipelines', 'Automate GitHub Actions workflow for automated unit tests, linting, and ECS deployment.', 'GitHub Actions workflow active. Automated deployment passes smoke tests.', 'Medium', 'Completed', -4],

    [managerId, davidId, p4, 'Integrate AI Knowledge Base', 'Connect OpenAI embeddings for automated support ticket recommendations.', null, 'Low', 'Pending', 14],
  ];

  for (const [uId, aId, pId, title, desc, note, priority, status, dayOffset] of tasksData) {
    const [existingT] = await connection.query('SELECT id FROM tasks WHERE title = ?', [title]);
    if (existingT.length === 0) {
      await connection.query(
        `INSERT INTO tasks (user_id, assigned_to, project_id, title, description, completion_note, priority, status, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
        [uId, aId, pId, title, desc, note, priority, status, dayOffset]
      );
    }
  }

  console.log('[Auto-Seed] Demo accounts & records populated successfully!');
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');

    // 1. Ensure users table exists
    await runSql(
      connection,
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
      'create users table'
    );

    // 2. Ensure projects table exists
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

    // 3. Ensure tasks table exists
    await runSql(
      connection,
      `CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        assigned_to INT NULL,
        project_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        completion_note TEXT NULL,
        priority ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
        status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
        due_date DATE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL,
        INDEX idx_tasks_user_id(user_id),
        INDEX idx_tasks_assigned_to(assigned_to),
        INDEX idx_tasks_project_id(project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
      'create tasks table'
    );

    // 4. Ensure refresh_tokens table exists
    await runSql(
      connection,
      `CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        jti VARCHAR(36) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_refresh_tokens_user_id(user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8`,
      'create refresh_tokens table'
    );

    // 5. Ensure missing columns are added if tables already existed
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

    // 6. Auto-seed demo users, projects, and tasks
    await autoSeedDemoData(connection);

    connection.release();
    console.log('Database schema auto-migrated and demo data ready.');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    console.error('Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in your .env file.');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
