require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetAndSeed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log('🔄 Cleaning old database records...');

  // Disable FK checks to clear existing tables safely
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE tasks');
  await connection.query('TRUNCATE TABLE projects');
  await connection.query('TRUNCATE TABLE refresh_tokens');
  await connection.query('TRUNCATE TABLE users');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('✨ Seeding fresh demo users, projects, and tasks...');

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

  // 2. Seed Projects
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

  // 3. Seed Tasks
  const tasksData = [
    // Project 1 Tasks
    [adminId, alexId, p1, 'Design UI/UX Mockups', 'Create responsive wireframes and high-fidelity Figma mockups for desktop & mobile.', 'Finished Figma mockups and user flow diagrams for executive review.', 'High', 'Completed', -5],
    [adminId, mariaId, p1, 'Setup React Frontend & Tailwind', 'Initialize Vite React boilerplate with atomic component structure and Tailwind utility classes.', 'Created reusable layout, sidebar, and navbar components.', 'High', 'In Progress', 3],
    [adminId, alexId, p1, 'Integrate Stripe Payment Gateway', 'Implement Stripe Checkout API with webhooks for automated order confirmation.', null, 'Medium', 'Pending', 7],

    // Project 2 Tasks
    [managerId, davidId, p2, 'API Endpoint Specifications', 'Document RESTful OpenAPI specification endpoints for user auth, tasks, and notifications.', 'Swagger UI documentation published to staging server.', 'High', 'Completed', -2],
    [managerId, alexId, p2, 'Implement Authentication Flow', 'Add JWT access/refresh token handling with biometric login support.', 'JWT authentication tokens & token rotation logic verified.', 'High', 'In Progress', 4],
    [managerId, mariaId, p2, 'Push Notification System', 'Configure Firebase Cloud Messaging (FCM) for real-time mobile push notifications.', null, 'Low', 'Pending', 10],

    // Project 3 Tasks
    [adminId, davidId, p3, 'Setup AWS S3 & RDS MySQL', 'Provision Amazon RDS MySQL multi-AZ instance and configure S3 bucket security policies.', 'Database migrated cleanly without data loss. Multi-AZ standby active.', 'High', 'Completed', -10],
    [adminId, managerId, p3, 'Configure CI/CD Pipelines', 'Automate GitHub Actions workflow for automated unit tests, linting, and ECS deployment.', 'GitHub Actions workflow active. Automated deployment passes smoke tests.', 'Medium', 'Completed', -4],

    // Project 4 Tasks
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

  console.log('\n🎉 Fresh Dummy Data Seeded Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Logins Available (Password for ALL is 123456):');
  console.log('   👑 Admin:          admin@test.com');
  console.log('   👔 Task Manager:   manager@test.com');
  console.log('   👤 Employee 1:      alex@test.com');
  console.log('   👤 Employee 2:      maria@test.com');
  console.log('   👤 Employee 3:      david@test.com');
  console.log('----------------------------------------------------');
}

resetAndSeed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
