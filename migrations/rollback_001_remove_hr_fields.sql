-- ======================
-- HR Fields Migration Rollback
-- ======================
-- Rollback script to remove HR fields from users table
-- This will revert all changes made in migration 001_add_hr_fields_to_users.sql

-- Drop triggers
DROP TRIGGER IF EXISTS check_email_uniqueness_per_school;
DROP TRIGGER IF EXISTS validate_hr_fields_on_insert;
DROP TRIGGER IF EXISTS validate_hr_fields_on_update;

-- Drop stored procedures
DROP PROCEDURE IF EXISTS generate_employee_id;

-- Drop functions
DROP FUNCTION IF EXISTS validate_afghanistan_phone;
DROP FUNCTION IF EXISTS validate_email_format;

-- Drop view
DROP VIEW IF EXISTS hr_users_view;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_email ON users;
DROP INDEX IF EXISTS idx_users_courseId ON users;
DROP INDEX IF EXISTS idx_users_employeeId ON users;
DROP INDEX IF EXISTS idx_users_contract_dates ON users;
DROP INDEX IF EXISTS idx_users_salaryType ON users;
DROP INDEX IF EXISTS idx_users_totalExperience ON users;

-- Drop unique constraint
ALTER TABLE users DROP INDEX IF EXISTS uk_users_email_school;

-- Drop foreign key constraint (if it was created)
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @constraintname = 'fk_users_courseId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_NAME = @constraintname
  ) > 0,
  'ALTER TABLE users DROP FOREIGN KEY fk_users_courseId;',
  'SELECT "Foreign key constraint does not exist, skipping" AS message;'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop HR columns from users table (excluding middleName as it was not added)
ALTER TABLE users 
DROP COLUMN IF EXISTS fatherName,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS designation,
DROP COLUMN IF EXISTS employeeId,
DROP COLUMN IF EXISTS totalExperience,
DROP COLUMN IF EXISTS relevantExperience,
DROP COLUMN IF EXISTS shift,
DROP COLUMN IF EXISTS workTime,
DROP COLUMN IF EXISTS subjectsCanTeach,
DROP COLUMN IF EXISTS qualification,
DROP COLUMN IF EXISTS specialization,
DROP COLUMN IF EXISTS isClassTeacher,
DROP COLUMN IF EXISTS contractStartDate,
DROP COLUMN IF EXISTS contractEndDate,
DROP COLUMN IF EXISTS salaryType,
DROP COLUMN IF EXISTS salaryAmount,
DROP COLUMN IF EXISTS salaryCurrency,
DROP COLUMN IF EXISTS courseId;

-- Log rollback completion
INSERT INTO migration_logs (migration_name, status, executed_at, details) 
VALUES ('001_add_hr_fields_to_users', 'ROLLED_BACK', NOW(), 'Removed all HR fields from users table and related objects');

-- Show rollback summary
SELECT 
    'HR Fields Rollback Completed' as status,
    COUNT(*) as total_users,
    'All HR fields have been removed from the users table' as details
FROM users
WHERE deletedAt IS NULL;
