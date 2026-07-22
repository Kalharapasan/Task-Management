/**
 * Optional Node-based seeder. schema.sql already seeds the default
 * user and sample tasks, so this script is mainly useful if you want
 * to reset the demo data without re-running the full schema file.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function seed() {
  const name = process.env.DEFAULT_USER_NAME || 'Admin User';
  const email = process.env.DEFAULT_USER_EMAIL || 'admin@test.com';
  const password = process.env.DEFAULT_USER_PASSWORD || '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  let userId;
  if (existing.length > 0) {
    userId = existing[0].id;
    await pool.query('UPDATE users SET name = ?, password = ? WHERE id = ?', [
      name,
      hashedPassword,
      userId,
    ]);
    console.log(`Existing user updated: ${email}`);
  } else {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    userId = result.insertId;
    console.log(`Default user created: ${email} / ${password}`);
  }

  const [existingTasks] = await pool.query('SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?', [
    userId,
  ]);

  if (existingTasks[0].count === 0) {
    const sampleTasks = [
      ['Set up project repository', 'Initialize Git repo and push base structure.', 'High', 'Completed', -5],
      ['Design database schema', 'Model users and tasks tables.', 'High', 'Completed', -3],
      ['Build authentication API', 'Implement JWT login and route protection.', 'Medium', 'In Progress', 2],
      ['Implement task filtering', 'Add status and priority filters.', 'Medium', 'Pending', 5],
      ['Fix overdue task styling', 'Overdue tasks should stand out visually.', 'Low', 'Pending', -1],
    ];

    for (const [title, description, priority, status, dayOffset] of sampleTasks) {
      await pool.query(
        `INSERT INTO tasks (user_id, title, description, priority, status, due_date)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
        [userId, title, description, priority, status, dayOffset]
      );
    }
    console.log('Sample tasks inserted.');
  } else {
    console.log('Tasks already exist for this user, skipping sample task insert.');
  }

  await pool.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
