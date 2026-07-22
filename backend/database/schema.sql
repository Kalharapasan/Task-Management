

CREATE DATABASE IF NOT EXISTS task_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE task_management;


CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  assigned_to INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
  due_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tasks_user_id (user_id),
  INDEX idx_tasks_assigned_to (assigned_to),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority),
  INDEX idx_tasks_due_date (due_date)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jti VARCHAR(36) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user_id (user_id)
) ENGINE=InnoDB;

INSERT INTO users (name, email, password, role)
VALUES ('Admin User', 'admin@test.com', '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);


INSERT INTO tasks (user_id, title, description, priority, status, due_date)
SELECT id, 'Set up project repository', 'Initialize Git repo and push the base project structure.', 'High', 'Completed', CURDATE() - INTERVAL 5 DAY
FROM users WHERE email = 'admin@test.com';

INSERT INTO tasks (user_id, title, description, priority, status, due_date)
SELECT id, 'Design database schema', 'Model users and tasks tables with proper relationships.', 'High', 'Completed', CURDATE() - INTERVAL 3 DAY
FROM users WHERE email = 'admin@test.com';

INSERT INTO tasks (user_id, title, description, priority, status, due_date)
SELECT id, 'Build authentication API', 'Implement JWT-based login and route protection.', 'Medium', 'In Progress', CURDATE() + INTERVAL 2 DAY
FROM users WHERE email = 'admin@test.com';

INSERT INTO tasks (user_id, title, description, priority, status, due_date)
SELECT id, 'Implement task filtering', 'Add status and priority filters to the task list.', 'Medium', 'Pending', CURDATE() + INTERVAL 5 DAY
FROM users WHERE email = 'admin@test.com';

INSERT INTO tasks (user_id, title, description, priority, status, due_date)
SELECT id, 'Fix overdue task styling', 'Overdue tasks should stand out visually on the dashboard.', 'Low', 'Pending', CURDATE() - INTERVAL 1 DAY
FROM users WHERE email = 'admin@test.com';
