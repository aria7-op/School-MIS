-- ======================
-- HR Fields Migration - Users Table
-- ======================
-- Migration to add comprehensive HR fields to the users table
-- This migration adds all necessary fields for HR user creation functionality

-- Add Personal Information Fields (excluding middleName as requested)
ALTER TABLE users 
ADD COLUMN fatherName VARCHAR(100) COMMENT 'HR: Father name (required for some roles)',
ADD COLUMN email VARCHAR(255) COMMENT 'HR: Email field',
ADD COLUMN address VARCHAR(255) COMMENT 'HR: Address field';

-- Add Professional Information Fields
ALTER TABLE users 
ADD COLUMN designation VARCHAR(100) COMMENT 'HR: Job title/designation',
ADD COLUMN employeeId VARCHAR(50) COMMENT 'HR: Employee ID',
ADD COLUMN totalExperience INT COMMENT 'HR: Total years of experience',
ADD COLUMN relevantExperience TEXT COMMENT 'HR: Relevant experience details',
ADD COLUMN shift VARCHAR(50) COMMENT 'HR: Work shift (morning/evening/night)',
ADD COLUMN workTime VARCHAR(50) COMMENT 'HR: Work time (FullTime/PartTime)';

-- Add Teaching Specific Fields
ALTER TABLE users 
ADD COLUMN subjectsCanTeach JSON COMMENT 'HR: Array of subjects teacher can teach',
ADD COLUMN qualification TEXT COMMENT 'HR: Educational qualification',
ADD COLUMN specialization VARCHAR(255) COMMENT 'HR: Specialization area',
ADD COLUMN isClassTeacher BOOLEAN COMMENT 'HR: Whether teacher is class teacher';

-- Add Contract Information Fields
ALTER TABLE users 
ADD COLUMN contractStartDate DATETIME COMMENT 'HR: Contract start date',
ADD COLUMN contractEndDate DATETIME COMMENT 'HR: Contract end date',
ADD COLUMN salaryType VARCHAR(50) COMMENT 'HR: Salary type (fixed/percentage/hourly)',
ADD COLUMN salaryAmount DECIMAL(10,2) COMMENT 'HR: Salary amount',
ADD COLUMN salaryCurrency VARCHAR(3) COMMENT 'HR: Salary currency';

-- Add Course Assignment Field
ALTER TABLE users 
ADD COLUMN courseId BIGINT COMMENT 'HR: Course ID for course-specific users';

-- Add Indexes for Performance Optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_courseId ON users(courseId);
CREATE INDEX idx_users_employeeId ON users(employeeId);
CREATE INDEX idx_users_contract_dates ON users(contractStartDate, contractEndDate);
CREATE INDEX idx_users_salaryType ON users(salaryType);
CREATE INDEX idx_users_totalExperience ON users(totalExperience);

-- Add Unique Constraint for Email per School
ALTER TABLE users 
ADD UNIQUE KEY uk_users_email_school (email, schoolId) COMMENT 'HR: Unique email per school';

-- Add Foreign Key for Course ID (if courses table exists)
SET @dbname = DATABASE();
SET @tablename = 'courses';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
  ) > 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_courseId FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT "Courses table does not exist, skipping foreign key constraint for courseId" AS message;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing users with default values for new fields
UPDATE users SET 
  fatherName = NULL,
  email = NULL,
  address = NULL,
  designation = NULL,
  employeeId = NULL,
  totalExperience = NULL,
  relevantExperience = NULL,
  shift = 'morning',
  workTime = 'FullTime',
  subjectsCanTeach = NULL,
  qualification = NULL,
  specialization = NULL,
  isClassTeacher = NULL,
  contractStartDate = NULL,
  contractEndDate = NULL,
  salaryType = NULL,
  salaryAmount = NULL,
  salaryCurrency = 'AFN',
  courseId = NULL
WHERE fatherName IS NULL OR email IS NULL;

-- Create a trigger to ensure email uniqueness per school
DELIMITER //
CREATE TRIGGER check_email_uniqueness_per_school
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE email_count INT;
    IF NEW.email IS NOT NULL AND NEW.schoolId IS NOT NULL THEN
        SELECT COUNT(*) INTO email_count
        FROM users
        WHERE email = NEW.email AND schoolId = NEW.schoolId AND deletedAt IS NULL;
        
        IF email_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email already exists for this school';
        END IF;
    END IF;
END//
DELIMITER ;

-- Create a trigger to validate HR fields based on role
DELIMITER //
CREATE TRIGGER validate_hr_fields_on_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    -- Validate teacher role requirements
    IF NEW.role = 'TEACHER' THEN
        IF NEW.subjectsCanTeach IS NULL OR JSON_LENGTH(NEW.subjectsCanTeach) = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Subjects can teach is required for teacher role';
        END IF;
        
        IF NEW.relevantExperience IS NULL OR NEW.relevantExperience = '' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Relevant experience is required for teacher role';
        END IF;
    END IF;
    
    -- Validate HRM role requirements
    IF NEW.role = 'HRM' THEN
        IF NEW.totalExperience IS NULL OR NEW.totalExperience < 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'HRM role requires at least 2 years of experience';
        END IF;
    END IF;
    
    -- Validate BRANCH_MANAGER role requirements
    IF NEW.role = 'BRANCH_MANAGER' THEN
        IF NEW.branchId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Branch ID is required for branch manager role';
        END IF;
        
        IF NEW.totalExperience IS NULL OR NEW.totalExperience < 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Branch manager role requires at least 2 years of experience';
        END IF;
    END IF;
    
    -- Validate staff roles requirements
    IF NEW.role IN ('ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'COURSE_MANAGER') THEN
        IF NEW.designation IS NULL OR NEW.designation = '' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Designation is required for staff roles';
        END IF;
    END IF;
END//
DELIMITER ;

-- Create a trigger to validate HR fields on update
DELIMITER //
CREATE TRIGGER validate_hr_fields_on_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    -- Validate teacher role requirements
    IF NEW.role = 'TEACHER' THEN
        IF NEW.subjectsCanTeach IS NULL OR JSON_LENGTH(NEW.subjectsCanTeach) = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Subjects can teach is required for teacher role';
        END IF;
        
        IF NEW.relevantExperience IS NULL OR NEW.relevantExperience = '' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Relevant experience is required for teacher role';
        END IF;
    END IF;
    
    -- Validate HRM role requirements
    IF NEW.role = 'HRM' THEN
        IF NEW.totalExperience IS NULL OR NEW.totalExperience < 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'HRM role requires at least 2 years of experience';
        END IF;
    END IF;
    
    -- Validate BRANCH_MANAGER role requirements
    IF NEW.role = 'BRANCH_MANAGER' THEN
        IF NEW.branchId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Branch ID is required for branch manager role';
        END IF;
        
        IF NEW.totalExperience IS NULL OR NEW.totalExperience < 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Branch manager role requires at least 2 years of experience';
        END IF;
    END IF;
    
    -- Validate staff roles requirements
    IF NEW.role IN ('ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'COURSE_MANAGER') THEN
        IF NEW.designation IS NULL OR NEW.designation = '' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Designation is required for staff roles';
        END IF;
    END IF;
END//
DELIMITER ;

-- Create a view for HR users with enhanced fields
CREATE OR REPLACE VIEW hr_users_view AS
SELECT 
    u.id,
    u.uuid,
    u.username,
    u.firstName,
    u.lastName,
    u.fatherName,
    u.email,
    u.phone,
    u.address,
    u.role,
    u.designation,
    u.employeeId,
    u.totalExperience,
    u.relevantExperience,
    u.shift,
    u.workTime,
    u.subjectsCanTeach,
    u.qualification,
    u.specialization,
    u.isClassTeacher,
    u.contractStartDate,
    u.contractEndDate,
    u.salaryType,
    u.salaryAmount,
    u.salaryCurrency,
    u.schoolId,
    u.branchId,
    u.courseId,
    u.status,
    u.metadata,
    u.createdAt,
    u.updatedAt,
    s.name as schoolName,
    b.name as branchName,
    c.name as courseName
FROM users u
LEFT JOIN schools s ON u.schoolId = s.id
LEFT JOIN branches b ON u.branchId = b.id
LEFT JOIN courses c ON u.courseId = c.id
WHERE u.deletedAt IS NULL
AND u.role IN ('TEACHER', 'HRM', 'BRANCH_MANAGER', 'ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'COURSE_MANAGER', 'SCHOOL_ADMIN');

-- Create a stored procedure to generate employee IDs
DELIMITER //
CREATE PROCEDURE generate_employee_id(
    IN p_role VARCHAR(50),
    IN p_school_id BIGINT,
    IN p_school_code VARCHAR(20),
    OUT p_employee_id VARCHAR(50)
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_sequence INT;
    DECLARE v_year VARCHAR(4);
    
    SET v_year = YEAR(NOW());
    
    -- Set prefix based on role
    CASE p_role
        WHEN 'TEACHER' THEN SET v_prefix = 'TCH';
        WHEN 'HRM' THEN SET v_prefix = 'HRM';
        WHEN 'BRANCH_MANAGER' THEN SET v_prefix = 'BMG';
        WHEN 'ACCOUNTANT' THEN SET v_prefix = 'ACC';
        WHEN 'LIBRARIAN' THEN SET v_prefix = 'LIB';
        WHEN 'CRM_MANAGER' THEN SET v_prefix = 'CRM';
        WHEN 'COURSE_MANAGER' THEN SET v_prefix = 'CSM';
        WHEN 'SCHOOL_ADMIN' THEN SET v_prefix = 'ADM';
        ELSE SET v_prefix = 'EMP';
    END CASE;
    
    -- Get next sequence number for this role and school
    SELECT COALESCE(MAX(CAST(SUBSTRING(employeeId, -4) AS UNSIGNED)), 0) + 1
    INTO v_sequence
    FROM users
    WHERE role = p_role 
    AND schoolId = p_school_id 
    AND employeeId LIKE CONCAT(v_prefix, '%');
    
    -- Generate employee ID
    SET p_employee_id = CONCAT(v_prefix, '-', p_school_code, '-', v_year, '-', LPAD(v_sequence, 4, '0'));
END//
DELIMITER ;

-- Create a function to validate Afghanistan phone numbers
DELIMITER //
CREATE FUNCTION validate_afghanistan_phone(phone_number VARCHAR(20)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_valid BOOLEAN DEFAULT FALSE;
    
    -- Afghanistan phone format: +937XXXXXXXX or 07XXXXXXXX
    IF phone_number REGEXP '^(\+93)?[0-9]{10}$' THEN
        SET is_valid = TRUE;
    END IF;
    
    RETURN is_valid;
END//
DELIMITER ;

-- Create a function to validate email format
DELIMITER //
CREATE FUNCTION validate_email_format(email_address VARCHAR(255)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_valid BOOLEAN DEFAULT FALSE;
    
    -- Basic email validation
    IF email_address REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SET is_valid = TRUE;
    END IF;
    
    RETURN is_valid;
END//
DELIMITER ;

-- Insert sample HR data for testing (optional)
-- Uncomment the following lines if you want to insert sample data

/*
INSERT INTO users (
    username, firstName, lastName, fatherName, email, phone, role, 
    designation, employeeId, totalExperience, relevantExperience, 
    shift, workTime, subjectsCanTeach, qualification, specialization, 
    isClassTeacher, contractStartDate, contractEndDate, salaryType, 
    salaryAmount, salaryCurrency, schoolId, branchId, createdByOwnerId
) VALUES (
    'john_teacher', 'John', 'Doe', 'Michael Doe', 'john.doe@school.com', '+937123456789', 'TEACHER',
    'Mathematics Teacher', 'TCH-SCH001-2024-0001', 5, '5 years teaching mathematics and physics',
    'morning', 'FullTime', JSON_ARRAY('Mathematics', 'Physics'), 'Masters in Mathematics', 'Mathematics Education',
    TRUE, '2024-01-15', '2024-12-31', 'percentage', 45000.00, 'AFN', 1, 1, 1
);
*/

-- Migration completion log
INSERT INTO migration_logs (migration_name, status, executed_at, details) 
VALUES ('001_add_hr_fields_to_users', 'COMPLETED', NOW(), 'Added comprehensive HR fields to users table with indexes, triggers, and stored procedures');

-- Show migration summary
SELECT 
    'HR Fields Migration Completed' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN fatherName IS NOT NULL THEN 1 END) as users_with_father_name,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN employeeId IS NOT NULL THEN 1 END) as users_with_employee_id,
    COUNT(CASE WHEN subjectsCanTeach IS NOT NULL THEN 1 END) as teachers_with_subjects
FROM users
WHERE deletedAt IS NULL;
