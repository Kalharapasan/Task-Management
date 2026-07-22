-- ---------------------------------------------------------------
-- users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,

    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ---------------------------------------------------------------
-- Default User
-- Email: admin@test.com
-- Password: 123456
-- ---------------------------------------------------------------
INSERT INTO users (name, email, password)
VALUES (
    'Admin User',
    'admin@test.com',
    '$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G'
)
ON DUPLICATE KEY UPDATE
name = VALUES(name);

-- ---------------------------------------------------------------
-- Sample Tasks
-- ---------------------------------------------------------------

INSERT INTO tasks (user_id,title,description,priority,status,due_date)
SELECT id,
'Set up project repository',
'Initialize Git repo and push the base project structure.',
'High',
'Completed',
DATE_SUB(CURDATE(), INTERVAL 5 DAY)
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks (user_id,title,description,priority,status,due_date)
SELECT id,
'Design database schema',
'Model users and tasks tables with proper relationships.',
'High',
'Completed',
DATE_SUB(CURDATE(), INTERVAL 3 DAY)
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks (user_id,title,description,priority,status,due_date)
SELECT id,
'Build authentication API',
'Implement JWT-based login and route protection.',
'Medium',
'In Progress',
DATE_ADD(CURDATE(), INTERVAL 2 DAY)
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks (user_id,title,description,priority,status,due_date)
SELECT id,
'Implement task filtering',
'Add status and priority filters to the task list.',
'Medium',
'Pending',
DATE_ADD(CURDATE(), INTERVAL 5 DAY)
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks (user_id,title,description,priority,status,due_date)
SELECT id,
'Fix overdue task styling',
'Overdue tasks should stand out visually on the dashboard.',
'Low',
'Pending',
DATE_SUB(CURDATE(), INTERVAL 1 DAY)
FROM users
WHERE email='admin@test.com';