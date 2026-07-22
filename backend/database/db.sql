USE sql12833613;

-- ==========================================
-- USERS TABLE
-- ==========================================

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ==========================================
-- TASKS TABLE
-- ==========================================

CREATE TABLE tasks (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending','In Progress','Completed') NOT NULL DEFAULT 'Pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,

    PRIMARY KEY (id),
    INDEX idx_user(user_id),

    CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ==========================================
-- REFRESH TOKENS TABLE
-- ==========================================

CREATE TABLE refresh_tokens (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    jti VARCHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_jti (jti),
    INDEX idx_refresh_user(user_id),

    CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ==========================================
-- DEFAULT ADMIN USER
-- Email : admin@test.com
-- Password : 123456
-- ==========================================

INSERT INTO users(name,email,password)
VALUES
(
'Admin User',
'admin@test.com',
'$2a$10$JWRgS69y2tHot17.oiVXl.ukKIvhRAhS2iKIUl2DqSN4BDTXccX7G'
);

-- ==========================================
-- SAMPLE TASKS
-- ==========================================

INSERT INTO tasks(user_id,title,description,priority,status,due_date)
SELECT
id,
'Set up project repository',
'Initialize Git repository.',
'High',
'Completed',
CURDATE()-INTERVAL 5 DAY
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks(user_id,title,description,priority,status,due_date)
SELECT
id,
'Design database schema',
'Create MySQL tables.',
'High',
'Completed',
CURDATE()-INTERVAL 3 DAY
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks(user_id,title,description,priority,status,due_date)
SELECT
id,
'Build authentication API',
'Implement JWT login.',
'Medium',
'In Progress',
CURDATE()+INTERVAL 2 DAY
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks(user_id,title,description,priority,status,due_date)
SELECT
id,
'Implement task filtering',
'Add status and priority filters.',
'Medium',
'Pending',
CURDATE()+INTERVAL 5 DAY
FROM users
WHERE email='admin@test.com';

INSERT INTO tasks(user_id,title,description,priority,status,due_date)
SELECT
id,
'Fix overdue task styling',
'Highlight overdue tasks.',
'Low',
'Pending',
CURDATE()-INTERVAL 1 DAY
FROM users
WHERE email='admin@test.com';