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

  // Create database
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${db}\`
     CHARACTER SET utf8
     COLLATE utf8_general_ci`
  );

  await connection.query(`USE \`${db}\``);

  console.log(`Database '${db}' ready.`);

  // USERS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  // TASKS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      priority ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
      status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
      due_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL,

      INDEX idx_tasks_user_id(user_id),

      CONSTRAINT fk_tasks_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  // REFRESH TOKENS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      jti VARCHAR(36) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_refresh_tokens_user_id(user_id),

      CONSTRAINT fk_refresh_tokens_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);

  console.log("Tables created.");

  // Seed User
  const name = process.env.DEFAULT_USER_NAME || "Admin User";
  const email = process.env.DEFAULT_USER_EMAIL || "admin@test.com";
  const password = process.env.DEFAULT_USER_PASSWORD || "123456";

  const hash = await bcrypt.hash(password, 10);

  const [rows] = await connection.query(
    "SELECT id FROM users WHERE email=?",
    [email]
  );

  let userId;

  if (rows.length > 0) {

    userId = rows[0].id;

    await connection.query(
      "UPDATE users SET name=?,password=? WHERE id=?",
      [name, hash, userId]
    );

    console.log("Default user updated.");

  } else {

    const [result] = await connection.query(
      "INSERT INTO users(name,email,password) VALUES(?,?,?)",
      [name, email, hash]
    );

    userId = result.insertId;

    console.log("Default user inserted.");
  }

  // Sample Tasks
  const [count] = await connection.query(
    "SELECT COUNT(*) total FROM tasks WHERE user_id=?",
    [userId]
  );

  if (count[0].total === 0) {

    const sample = [
      ["Set up project repository","Initialize Git repository.","High","Completed",-5],
      ["Design database schema","Create MySQL tables.","High","Completed",-3],
      ["Build authentication API","Implement JWT Authentication.","Medium","In Progress",2],
      ["Implement task filtering","Filter by priority and status.","Medium","Pending",5],
      ["Fix overdue task styling","Highlight overdue tasks.","Low","Pending",-1]
    ];

    for (const t of sample) {

      await connection.query(
        `INSERT INTO tasks
        (user_id,title,description,priority,status,due_date)
        VALUES(?,?,?,?,?,DATE_ADD(CURDATE(),INTERVAL ? DAY))`,
        [userId,...t]
      );

    }

    console.log("Sample tasks inserted.");
  }

  await connection.end();

  console.log("\nDatabase initialized successfully.");
  console.log(`Login : ${email}`);
  console.log(`Password : ${password}`);
}

init().catch(err=>{
  console.error(err);
});