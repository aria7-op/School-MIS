-- School Management System Database Setup
-- For MySQL2 version (No WebAssembly)

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'parent', 'student') DEFAULT 'parent',
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  phone VARCHAR(20),
  address TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  grade VARCHAR(20),
  parentId BIGINT,
  address TEXT,
  phone VARCHAR(20),
  status ENUM('ACTIVE', 'INACTIVE', 'GRADUATED') DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  FOREIGN KEY (parentId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_grade (grade)
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  userId BIGINT,
  subject VARCHAR(100),
  qualification VARCHAR(255),
  experience INT DEFAULT 0,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subject (subject)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  credits INT DEFAULT 1,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  INDEX idx_code (code)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  subjectId BIGINT,
  teacherId BIGINT,
  grade VARCHAR(20),
  schedule VARCHAR(255),
  room VARCHAR(50),
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_grade (grade)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  studentId BIGINT,
  payerId BIGINT,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  paymentMethod ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE') DEFAULT 'CASH',
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  transactionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (payerId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created_at (createdAt)
);

-- Insert sample data

-- Sample users
INSERT INTO users (name, email, password, role, status) VALUES
('Admin User', 'admin@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE'),
('John Teacher', 'teacher@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'ACTIVE'),
('Parent One', 'parent@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'parent', 'ACTIVE');

-- Sample subjects
INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH101', 'Basic mathematics course'),
('English', 'ENG101', 'English language and literature'),
('Science', 'SCI101', 'General science course'),
('History', 'HIST101', 'World history course');

-- Sample teachers
INSERT INTO teachers (userId, subject, qualification, experience) VALUES
(2, 'Mathematics', 'MSc Mathematics', 5);

-- Sample students
INSERT INTO students (name, email, grade, parentId) VALUES
('Alice Student', 'alice@school.com', 'Grade 10', 3),
('Bob Student', 'bob@school.com', 'Grade 11', 3);

-- Sample classes
INSERT INTO classes (name, subjectId, teacherId, grade, schedule, room) VALUES
('Math Class A', 1, 1, 'Grade 10', 'Monday 9:00 AM', 'Room 101'),
('English Class A', 2, 1, 'Grade 10', 'Tuesday 10:00 AM', 'Room 102');

-- Sample payments
INSERT INTO payments (studentId, payerId, amount, description, paymentMethod, status) VALUES
(1, 3, 500.00, 'Tuition Fee', 'CASH', 'COMPLETED'),
(2, 3, 500.00, 'Tuition Fee', 'ONLINE', 'PENDING');

-- Note: The password hash above is for 'password' - change in production! 