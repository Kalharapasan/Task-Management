require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
  } catch (_) {}
  await connection.query(`USE \`${db}\``);

  console.log('🧹 Clearing old tables...');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('DROP TABLE IF EXISTS refresh_tokens');
  await connection.query('DROP TABLE IF EXISTS tasks');
  await connection.query('DROP TABLE IF EXISTS projects');
  await connection.query('DROP TABLE IF EXISTS users');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('🏗️ Creating fresh database tables...');

  await connection.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  await connection.query(`
    CREATE TABLE projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      status ENUM('Active', 'Completed', 'On Hold') NOT NULL DEFAULT 'Active',
      created_by INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL,
      CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  await connection.query(`
    CREATE TABLE tasks (
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
      updated_at DATETIME DEFAULT NULL,
      INDEX idx_tasks_user_id(user_id),
      INDEX idx_tasks_assigned_to(assigned_to),
      INDEX idx_tasks_project_id(project_id),
      CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  await connection.query(`
    CREATE TABLE refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      jti VARCHAR(36) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_refresh_tokens_user_id(user_id),
      CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  console.log('✨ Seeding fresh demo users, projects, and tasks...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const usersData = [
    ['Admin User', 'admin@test.com', passwordHash, 'admin'],
    ['Sarah Manager', 'manager@test.com', passwordHash, 'task_manager'],
    ['Alex Rivera', 'alex@test.com', passwordHash, 'employee'],
    ['Maria Garcia', 'maria@test.com', passwordHash, 'employee'],
    ['David Chen', 'david@test.com', passwordHash, 'employee'],
  ];

  const userIds = {};
  for (const [uName, uEmail, uPass, uRole] of usersData) {
    const [res] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [uName, uEmail, uPass, uRole]
    );
    userIds[uEmail] = res.insertId;
  }

  const adminId = userIds['admin@test.com'];
  const managerId = userIds['manager@test.com'];
  const alexId = userIds['alex@test.com'];
  const mariaId = userIds['maria@test.com'];
  const davidId = userIds['david@test.com'];

  const projectsData = [
    ['E-Commerce Website Redesign', 'Revamp the online store UI/UX, improve checkout speed, and add Stripe payment integration.', 'Active', adminId],
    ['Mobile App Development', 'Build cross-platform iOS & Android mobile app for on-the-go task management.', 'Active', managerId],
    ['Cloud Infrastructure Migration', 'Migrate legacy server setup to scalable AWS cloud architecture with automated CI/CD.', 'Completed', adminId],
    ['Customer Support Portal', 'Self-service support ticketing portal with AI knowledgebase lookup.', 'On Hold', managerId],
  ];

  const projectIds = {};
  for (const [pName, pDesc, pStatus, pCreatedBy] of projectsData) {
    const [res] = await connection.query(
      'INSERT INTO projects (name, description, status, created_by) VALUES (?, ?, ?, ?)',
      [pName, pDesc, pStatus, pCreatedBy]
    );
    projectIds[pName] = res.insertId;
  }

  const p1 = projectIds['E-Commerce Website Redesign'];
  const p2 = projectIds['Mobile App Development'];
  const p3 = projectIds['Cloud Infrastructure Migration'];
  const p4 = projectIds['Customer Support Portal'];

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
    await connection.query(
      `INSERT INTO tasks (user_id, assigned_to, project_id, title, description, completion_note, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
      [uId, aId, pId, title, desc, note, priority, status, dayOffset]
    );
  }

  await connection.end();
  console.log('\n✅ Database reset and seeded successfully!');
}

init().catch((err) => {
  console.error('❌ Init failed:', err.message);
  process.exit(1);
});