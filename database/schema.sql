-- Task Management System - MySQL Schema & Seed
-- Koncepthive Technical Assessment

CREATE DATABASE IF NOT EXISTS task_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE task_management;

-- ---------------------------------------------------------------
-- users table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','task_manager','employee') NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- projects table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('Active', 'Completed', 'On Hold') NOT NULL DEFAULT 'Active',
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- tasks table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  assigned_to INT NULL,
  project_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  completion_note TEXT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
  due_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_tasks_user_id (user_id),
  INDEX idx_tasks_assigned_to (assigned_to),
  INDEX idx_tasks_project_id (project_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- refresh_tokens table
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jti VARCHAR(36) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user_id (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Demo Seed Data (Default credentials: admin@test.com / 123456)
-- ---------------------------------------------------------------
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@test.com', '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G', 'admin'),
('Sarah Manager', 'manager@test.com', '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G', 'task_manager'),
('Alex Rivera', 'alex@test.com', '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G', 'employee'),
('Maria Garcia', 'maria@test.com', '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G', 'employee'),
('David Chen', 'david@test.com', '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G', 'employee')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

INSERT INTO tasks (user_id, assigned_to, title, description, priority, status, due_date) VALUES
(1, 1, 'Finalize Q3 Assessment Documentation', 'Prepare technical submission docs and deployment links.', 'High', 'In Progress', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(1, 2, 'Database Migration Strategy', 'Set up initial schemas and indexes for optimal queries.', 'Medium', 'Completed', CURDATE()),
(1, 3, 'Design Mobile Responsive Views', 'Ensure task list and Kanban board look great on tablet and mobile.', 'High', 'Pending', DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
(1, 4, 'Implement Refresh Token Rotation', 'Configure secure httpOnly cookies for rotating authentication tokens.', 'High', 'Completed', CURDATE()),
(1, 1, 'Review API Rate Limits', 'Apply rate limiting middleware across sensitive endpoints.', 'Low', 'Pending', DATE_ADD(CURDATE(), INTERVAL 7 DAY));
