-- =====================================================
-- SCHOOL MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- MySQL 8.0+ Compatible
-- Generated: 2025-01-06
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (Clean Install)
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS grade_approvals;
DROP TABLE IF EXISTS book_distributions;
DROP TABLE IF EXISTS google_drive_integrations;
DROP TABLE IF EXISTS teacher_class_subjects;
DROP TABLE IF EXISTS user_role_assignments;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS permission_assignments;
DROP TABLE IF EXISTS access_control_lists;
DROP TABLE IF EXISTS component_permissions;
DROP TABLE IF EXISTS policy_assignments;
DROP TABLE IF EXISTS attribute_assignments;
DROP TABLE IF EXISTS permission_group_items;
DROP TABLE IF EXISTS group_to_users;
DROP TABLE IF EXISTS participant_last_read_messages;
DROP TABLE IF EXISTS subject_to_teachers;
DROP TABLE IF EXISTS class_to_subjects;
DROP TABLE IF EXISTS teacher_class_subjects;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignment_attachments;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS message_reactions;
DROP TABLE IF EXISTS message_forwards;
DROP TABLE IF EXISTS message_threads;
DROP TABLE IF EXISTS message_polls;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS conversation_notifications;
DROP TABLE IF EXISTS conversation_settings;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_templates;
DROP TABLE IF EXISTS notification_rules;
DROP TABLE IF EXISTS suggestion_complaints;
DROP TABLE IF EXISTS school_settings;
DROP TABLE IF EXISTS frontend_components;
DROP TABLE IF EXISTS permission_groups;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS teacher;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS parent;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS academic_sessions;
DROP TABLE IF EXISTS terms;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS owners;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- ENUMS
-- =====================================================

-- User Roles
CREATE TABLE user_roles (
    name VARCHAR(50) PRIMARY KEY,
    description TEXT
);

INSERT INTO user_roles (name, description) VALUES
('SUPER_ADMIN', 'System administrator with full access'),
('SUPER_DUPER_ADMIN', 'Super administrator with elevated privileges'),
('SCHOOL_ADMIN', 'School administrator with school-wide access'),
('TEACHER', 'Teacher with teaching privileges'),
('STUDENT', 'Student with learning privileges'),
('STAFF', 'General staff member'),
('HRM', 'Human Resources Manager'),
('PARENT', 'Parent with student access'),
('ACCOUNTANT', 'Accountant with financial access'),
('LIBRARIAN', 'Librarian with library management'),
('CRM_MANAGER', 'Customer Relationship Manager'),
('BRANCH_MANAGER', 'Branch manager'),
('COURSE_MANAGER', 'Course manager');

-- Gender
CREATE TABLE genders (
    name VARCHAR(20) PRIMARY KEY
);

INSERT INTO genders (name) VALUES
('MALE'), ('FEMALE'), ('OTHER'), ('PREFER_NOT_TO_SAY');

-- User Status
CREATE TABLE user_statuses (
    name VARCHAR(20) PRIMARY KEY
);

INSERT INTO user_statuses (name) VALUES
('ACTIVE'), ('INACTIVE'), ('SUSPENDED'), ('GRADUATED'), ('TRANSFERRED');

-- School Status
CREATE TABLE school_statuses (
    name VARCHAR(20) PRIMARY KEY
);

INSERT INTO school_statuses (name) VALUES
('ACTIVE'), ('INACTIVE'), ('PENDING'), ('SUSPENDED'), ('DEACTIVATED');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Owners
CREATE TABLE owners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    phone_verified DATETIME,
    password VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    last_login DATETIME,
    last_ip VARCHAR(45),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    INDEX idx_status (status)
);

-- Schools
CREATE TABLE schools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    code VARCHAR(20) UNIQUE NOT NULL,
    motto VARCHAR(255),
    about TEXT,
    phone VARCHAR(20) NOT NULL,
    fax VARCHAR(20),
    website VARCHAR(255),
    established_date DATE,
    principal VARCHAR(100),
    vice_principal VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo VARCHAR(255),
    cover_image VARCHAR(255),
    theme_color VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED') DEFAULT 'ACTIVE',
    owner_id BIGINT NOT NULL,
    subscription_id BIGINT UNIQUE,
    super_admin_user_id BIGINT,
    academic_session_id BIGINT,
    current_term_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    settings JSON,
    tenant_id VARCHAR(64) UNIQUE,
    
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    
    INDEX idx_owner_id (owner_id),
    INDEX idx_code (code),
    INDEX idx_status (status)
);

-- Branches
CREATE TABLE branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id BIGINT,
    school_id BIGINT NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    
    INDEX idx_school_id (school_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_status (status)
);

-- Departments
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    head_id BIGINT,
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- =====================================================
-- MAIN USER TABLE (Enhanced for HR)
-- =====================================================

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    tazkira_no VARCHAR(50),
    phone VARCHAR(20),
    phone_verified DATETIME,
    password VARCHAR(255),
    salt VARCHAR(255),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    father_name VARCHAR(100),
    dari_name VARCHAR(100),
    display_name VARCHAR(100),
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
    birth_date DATETIME,
    avatar VARCHAR(255),
    cover_image VARCHAR(255),
    bio VARCHAR(255),
    
    -- Contact Information
    email VARCHAR(255),
    address VARCHAR(255),
    
    -- Professional Information
    role ENUM('SUPER_ADMIN', 'SUPER_DUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'HRM', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'BRANCH_MANAGER', 'COURSE_MANAGER') NOT NULL,
    designation VARCHAR(100),
    employee_id VARCHAR(50),
    total_experience INT,
    relevant_experience TEXT,
    shift VARCHAR(50),
    work_time VARCHAR(50),
    
    -- Teaching Specific Fields
    subjects_can_teach JSON,
    qualification TEXT,
    specialization VARCHAR(255),
    is_class_teacher BOOLEAN,
    
    -- Contract Information
    contract_start_date DATETIME,
    contract_end_date DATETIME,
    salary_type VARCHAR(50),
    salary_amount DECIMAL(10,2),
    salary_currency VARCHAR(3),
    
    -- System Fields
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    last_login DATETIME,
    last_ip VARCHAR(45),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    metadata TEXT,
    school_id BIGINT,
    branch_id BIGINT,
    course_id BIGINT,
    
    -- Audit Fields
    created_by_owner_id BIGINT NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL ON UPDATE NO ACTION,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_course_id (course_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- HR SPECIFIC TABLES
-- =====================================================

-- Staff (Employment Details)
CREATE TABLE staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department_id BIGINT,
    designation VARCHAR(100) NOT NULL,
    joining_date DATETIME,
    salary DECIMAL(10,2),
    account_number VARCHAR(30),
    bank_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT NOT NULL,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_employee_id (employee_id),
    INDEX idx_user_id (user_id),
    INDEX idx_department_id (department_id),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- Teacher (Teaching Details)
CREATE TABLE teacher (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    qualification TEXT,
    specialization VARCHAR(255),
    experience_years INT,
    subjects_can_teach JSON,
    is_class_teacher BOOLEAN DEFAULT FALSE,
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_employee_id (employee_id),
    INDEX idx_user_id (user_id),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- Student
CREATE TABLE student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    roll_number VARCHAR(20),
    admission_number VARCHAR(50) UNIQUE,
    admission_date DATE,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    blood_group VARCHAR(10),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    category VARCHAR(50),
    previous_school VARCHAR(255),
    transfer_certificate VARCHAR(255),
    medical_info TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_student_id (student_id),
    UNIQUE KEY uk_admission_number (admission_number),
    INDEX idx_user_id (user_id),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- Parent
CREATE TABLE parent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT UNIQUE NOT NULL,
    occupation VARCHAR(100),
    education VARCHAR(100),
    annual_income DECIMAL(12,2),
    company_name VARCHAR(255),
    office_address TEXT,
    office_phone VARCHAR(20),
    relationship_to_student VARCHAR(50),
    is_guardian BOOLEAN DEFAULT FALSE,
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- =====================================================
-- ACADEMIC STRUCTURE
-- =====================================================

-- Academic Sessions
CREATE TABLE academic_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    school_id BIGINT NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    
    INDEX idx_school_id (school_id),
    INDEX idx_is_current (is_current)
);

-- Terms
CREATE TABLE terms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL,
    type ENUM('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM', 'SUMMER', 'WINTER') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_session_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    
    INDEX idx_academic_session_id (academic_session_id),
    INDEX idx_school_id (school_id)
);

-- Classes
CREATE TABLE classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    section VARCHAR(20),
    class_level INT,
    capacity INT DEFAULT 40,
    room_number VARCHAR(20),
    floor_number VARCHAR(10),
    building VARCHAR(50),
    academic_session_id BIGINT,
    term_id BIGINT,
    class_teacher_id BIGINT,
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE SET NULL,
    FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    INDEX idx_academic_session_id (academic_session_id),
    INDEX idx_term_id (term_id),
    INDEX idx_class_teacher_id (class_teacher_id),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- Sections
CREATE TABLE sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL,
    class_id BIGINT NOT NULL,
    teacher_id BIGINT,
    capacity INT DEFAULT 40,
    room_number VARCHAR(20),
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    course_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    INDEX idx_class_id (class_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id)
);

-- Subjects
CREATE TABLE subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    type ENUM('CORE', 'ELECTIVE', 'ENRICHMENT', 'REMEDIAL', 'EXTRACURRICULAR') DEFAULT 'CORE',
    credits INT DEFAULT 1,
    passing_marks DECIMAL(5,2) DEFAULT 33.00,
    maximum_marks DECIMAL(5,2) DEFAULT 100.00,
    is_practical BOOLEAN DEFAULT FALSE,
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_code (code)
);

-- Courses
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    type ENUM('CORE', 'ELECTIVE', 'ENRICHMENT', 'REMEDIAL', 'EXTRACURRICULAR', 'ONLINE') DEFAULT 'CORE',
    duration_hours INT,
    duration_weeks INT,
    credits INT DEFAULT 1,
    max_students INT DEFAULT 30,
    min_students INT DEFAULT 5,
    fee_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    school_id BIGINT NOT NULL,
    branch_id BIGINT,
    department_id BIGINT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    
    INDEX idx_school_id (school_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_department_id (department_id),
    INDEX idx_code (code)
);

-- =====================================================
-- DOCUMENT MANAGEMENT
-- =====================================================

CREATE TABLE documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    document_type ENUM('ID_PROOF', 'ADDRESS_PROOF', 'BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'MARKSHEET', 'PHOTOGRAPH', 'MEDICAL_CERTIFICATE', 'OTHER'),
    user_id BIGINT,
    staff_id BIGINT,
    student_id BIGINT,
    school_id BIGINT,
    branch_id BIGINT,
    course_id BIGINT,
    uploaded_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_student_id (student_id),
    INDEX idx_school_id (school_id),
    INDEX idx_document_type (document_type)
);

-- =====================================================
-- SESSION AND AUDIT MANAGEMENT
-- =====================================================

CREATE TABLE sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
);

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    details TEXT,
    user_id BIGINT,
    school_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_school_id (school_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_users_school_role ON users(school_id, role, status);
CREATE INDEX idx_users_branch_role ON users(branch_id, role, status);
CREATE INDEX idx_users_course_role ON users(course_id, role, status);
CREATE INDEX idx_staff_school_department ON staff(school_id, department_id);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_school_date ON audit_logs(school_id, created_at);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active Users with HR Details
CREATE VIEW active_users_hr AS
SELECT 
    u.id,
    u.uuid,
    u.username,
    u.first_name,
    u.last_name,
    u.father_name,
    u.email,
    u.phone,
    u.role,
    u.designation,
    u.employee_id,
    u.total_experience,
    u.contract_start_date,
    u.contract_end_date,
    u.salary_amount,
    u.status,
    s.department_id,
    d.name as department_name,
    b.name as branch_name,
    sch.name as school_name,
    u.created_at,
    u.last_login
FROM users u
LEFT JOIN staff s ON u.id = s.user_id
LEFT JOIN departments d ON s.department_id = d.id
LEFT JOIN branches b ON u.branch_id = b.id
LEFT JOIN schools sch ON u.school_id = sch.id
WHERE u.deleted_at IS NULL AND u.status = 'ACTIVE';

-- Staff Statistics
CREATE VIEW staff_statistics AS
SELECT 
    sch.id as school_id,
    sch.name as school_name,
    COUNT(DISTINCT CASE WHEN u.role = 'TEACHER' THEN u.id END) as teachers_count,
    COUNT(DISTINCT CASE WHEN u.role = 'STAFF' THEN u.id END) as staff_count,
    COUNT(DISTINCT CASE WHEN u.role = 'HRM' THEN u.id END) as hrm_count,
    COUNT(DISTINCT CASE WHEN u.role = 'ACCOUNTANT' THEN u.id END) as accountant_count,
    COUNT(DISTINCT CASE WHEN u.role = 'LIBRARIAN' THEN u.id END) as librarian_count,
    COUNT(DISTINCT CASE WHEN u.status = 'ACTIVE' THEN u.id END) as active_count,
    COUNT(DISTINCT CASE WHEN u.status = 'INACTIVE' THEN u.id END) as inactive_count,
    AVG(s.salary) as average_salary
FROM schools sch
LEFT JOIN users u ON sch.id = u.school_id
LEFT JOIN staff s ON u.id = s.user_id
WHERE u.deleted_at IS NULL
GROUP BY sch.id, sch.name;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Default Owner
INSERT INTO owners (uuid, name, password, salt, status) VALUES
(UUID(), 'System Owner', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'system_salt', 'ACTIVE');

-- Default School
INSERT INTO schools (uuid, name, code, phone, country, state, city, address, owner_id, status) VALUES
(UUID(), 'Demo School', 'DEMO001', '+1234567890', 'Afghanistan', 'Kabul', 'Kabul', 'Main Street, Kabul', 1, 'ACTIVE');

-- Default Admin User
INSERT INTO users (
    uuid, username, password, salt, first_name, last_name, email, role, status, 
    created_by_owner_id, school_id
) VALUES (
    UUID(), 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'admin_salt',
    'System', 'Administrator', 'admin@school.com', 'SUPER_ADMIN', 'ACTIVE', 1, 1
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Database schema created successfully!' as status,
       NOW() as completion_time,
       COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = DATABASE();

-- Show table statistics
SELECT 
    table_name,
    table_rows,
    data_length,
    index_length,
    (data_length + index_length) as total_size
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
    AND table_name IN ('users', 'staff', 'teacher', 'student', 'parent', 'departments', 'branches', 'schools', 'audit_logs')
ORDER BY total_size DESC;
