-- SkillPulse Database Schema
--
-- This script runs inside the database created by the MYSQL_DATABASE env var
-- (see docker-compose.yml / k8s ConfigMap), so it does NOT hardcode a database
-- name. Whatever you set as DB_NAME is what the app connects to and what these
-- tables are created in — keep .env, docker-compose and the manifests in sync.

CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT '',
    target_hours INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Key/value app settings (e.g. the weekly hours goal shown on the dashboard).
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
);

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('weekly_goal', '10');

CREATE TABLE IF NOT EXISTS learning_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_id INT NOT NULL,
    hours DECIMAL(4,1) NOT NULL,
    notes TEXT,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Seed data for demo
INSERT INTO skills (name, category, target_hours) VALUES
    ('Docker', 'DevOps', 40),
    ('Kubernetes', 'DevOps', 60),
    ('Go', 'Programming', 50),
    ('Azure DevOps', 'Cloud', 30),
    ('Terraform', 'DevOps', 35);

INSERT INTO learning_logs (skill_id, hours, notes, log_date) VALUES
    (1, 2.0, 'Learned Docker basics - images, containers, volumes', '2026-03-10'),
    (1, 1.5, 'Built multi-stage Dockerfile for Go app', '2026-03-12'),
    (1, 3.0, 'Docker Compose with multiple services', '2026-03-14'),
    (2, 1.0, 'Kubernetes architecture overview', '2026-03-11'),
    (2, 2.0, 'Deployed first pod and service', '2026-03-13'),
    (3, 2.5, 'Go basics - structs, interfaces, goroutines', '2026-03-10'),
    (3, 1.5, 'Built REST API with Gin framework', '2026-03-15'),
    (4, 1.0, 'Created Azure DevOps org and project', '2026-03-16'),
    (5, 1.5, 'Terraform basics - providers, resources, state', '2026-03-17');

-- A little status variety for the demo (most skills stay 'active')
UPDATE skills SET status = 'paused'    WHERE name = 'Azure DevOps';
UPDATE skills SET status = 'completed' WHERE name = 'Go';
