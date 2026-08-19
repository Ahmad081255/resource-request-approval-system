-- Resource Request and Approval Management System
-- Database Schema (MySQL 8+)
-- Matches Figures 3.4 / 3.5 (ERD + Schema Design) in the project document

DROP DATABASE IF EXISTS rram_system;
CREATE DATABASE rram_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rram_system;

-- ============================
-- Table 3.2: Roles
-- ============================
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,   -- Administrator, Manager/Approver, Staff
  description TEXT
);

-- ============================
-- Table 3.3: Departments
-- ============================
CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  location VARCHAR(150),
  description TEXT
);

-- ============================
-- Table 3.1: Users
-- ============================
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  department_id INT,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(role_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- ============================
-- Resources (organisational resources catalogue)
-- ============================
CREATE TABLE resources (
  resource_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  description TEXT,
  location VARCHAR(150),
  status ENUM('available','unavailable') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Table 3.4: Resource Requests
-- ============================
CREATE TABLE requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                 -- requester
  resource_type VARCHAR(100) NOT NULL,  -- free text / resource name requested
  resource_id INT NULL,                 -- optional link to catalogued resource
  quantity INT NOT NULL DEFAULT 1,
  purpose TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  status ENUM('pending','approved','rejected','modification_requested') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE SET NULL
);

-- ============================
-- Table 3.5: Approvals
-- ============================
CREATE TABLE approvals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  approver_id INT NOT NULL,
  decision ENUM('approved','rejected','modification_requested') NOT NULL,
  remarks TEXT,
  approval_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(request_id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(user_id)
);

-- ============================
-- Table 3.6: Notifications
-- ============================
CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,           -- recipient
  request_id INT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES requests(request_id) ON DELETE SET NULL
);

-- ============================
-- Audit Trail (3.8.8 Activity Monitoring)
-- ============================
CREATE TABLE audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(150) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================
-- Seed data: Roles
-- ============================
INSERT INTO roles (role_name, description) VALUES
('Administrator', 'Manages users, resources, and has full system oversight'),
('Manager', 'Reviews and approves or rejects resource requests'),
('Staff', 'Submits resource requests and tracks their status');

-- ============================
-- Seed data: Departments
-- ============================
INSERT INTO departments (department_name, location, description) VALUES
('Operations', 'Ground Floor', 'General operations and logistics'),
('Finance', '1st Floor', 'Budgeting and financial control'),
('IT', '2nd Floor', 'Technology and infrastructure support');

-- ============================
-- Seed data: Resources
-- ============================
INSERT INTO resources (name, quantity, description, location, status) VALUES
('Laptop', 10, 'Standard issue office laptop', 'IT Store', 'available'),
('Projector', 3, 'Portable meeting room projector', 'Operations Store', 'available'),
('Office Chair', 15, 'Ergonomic office chair', 'Operations Store', 'available'),
('Printer Toner', 20, 'Black toner cartridge', 'IT Store', 'available');

-- ============================
-- Seed data: Users
-- password for ALL seeded users is: Password123
-- (hash generated with bcrypt, 10 rounds)
-- ============================
INSERT INTO users (full_name, username, email, password_hash, role_id, department_id, status) VALUES
('Ahmad Yusuf', 'admin', 'admin@miva.edu.ng', '$2b$10$t9WfJzZQOZ6bHorS5h9tDumRJpxLedIPsdroJ8pQsbpxzTD1ufdyi', 1, 3, 'active'),
('Fatima Bello', 'manager', 'fatima.bello@company.com', '$2b$10$t9WfJzZQOZ6bHorS5h9tDumRJpxLedIPsdroJ8pQsbpxzTD1ufdyi', 2, 1, 'active'),
('John Okafor', 'staff', 'john.okafor@company.com', '$2b$10$t9WfJzZQOZ6bHorS5h9tDumRJpxLedIPsdroJ8pQsbpxzTD1ufdyi', 3, 1, 'active');
