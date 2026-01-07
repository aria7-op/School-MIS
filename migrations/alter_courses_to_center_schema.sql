-- =====================================================
-- Migration: Convert courses table to Education Center Schema
-- Based on: course_center_schema.md
-- Date: 2026-01-06
-- Description: Adds new fields for education centers and removes old course fields
-- =====================================================

-- Note: This migration assumes you're using MySQL/MariaDB
-- For PostgreSQL or other databases, adjust data types accordingly

USE school_mis; -- Change to your database name

-- =====================================================
-- STEP 1: Add new education center fields
-- =====================================================

-- Add focusArea field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS focusArea VARCHAR(100) NULL 
COMMENT 'Primary educational focus (e.g., Language Studies - English)';

-- Add centerType field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS centerType VARCHAR(50) NULL 
COMMENT 'Type of center: ACADEMIC, VOCATIONAL, LANGUAGE, RELIGIOUS, TECHNOLOGY, MIXED';

-- Add targetAudience field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS targetAudience VARCHAR(50) NULL 
COMMENT 'Target student group: PRIMARY, SECONDARY, ADULT, ALL_AGES';

-- Add isAccredited field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS isAccredited TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Whether the center is officially accredited';

-- Add enrollmentOpen field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS enrollmentOpen TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Whether the center is accepting new student enrollments';

-- Add centerManagerId field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS centerManagerId BIGINT NULL 
COMMENT 'Center director/manager responsible for operations';

-- Add operatingHours field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS operatingHours VARCHAR(100) NULL 
COMMENT 'Center operating hours (e.g., 9AM-9PM Daily)';

-- Add scheduleType field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS scheduleType VARCHAR(30) NULL 
COMMENT 'Primary schedule pattern: WEEKDAY, WEEKEND, FLEXIBLE, EVENING';

-- Add budget field
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2) NULL 
COMMENT 'Annual operational budget allocated to the center';

-- Add resources field (JSON for facilities, equipment, etc.)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS resources JSON NULL 
COMMENT 'Available physical resources, equipment, and facilities';

-- Add policies field (JSON for rules, policies, procedures)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS policies JSON NULL 
COMMENT 'Center-specific rules, policies, and procedures';

-- =====================================================
-- STEP 2: Add indexes for new fields
-- =====================================================

-- Index on centerType for filtering
CREATE INDEX IF NOT EXISTS idx_courses_centerType ON courses(centerType);

-- Index on targetAudience for filtering
CREATE INDEX IF NOT EXISTS idx_courses_targetAudience ON courses(targetAudience);

-- Index on scheduleType for filtering
CREATE INDEX IF NOT EXISTS idx_courses_scheduleType ON courses(scheduleType);

-- Index on isAccredited for filtering
CREATE INDEX IF NOT EXISTS idx_courses_isAccredited ON courses(isAccredited);

-- Index on enrollmentOpen for filtering
CREATE INDEX IF NOT EXISTS idx_courses_enrollmentOpen ON courses(enrollmentOpen);

-- Index on centerManagerId for lookups
CREATE INDEX IF NOT EXISTS idx_courses_centerManagerId ON courses(centerManagerId);

-- =====================================================
-- STEP 3: Add foreign key constraint for centerManagerId
-- =====================================================

-- Add foreign key constraint
ALTER TABLE courses 
ADD CONSTRAINT IF NOT EXISTS fk_courses_centerManagerId 
FOREIGN KEY (centerManagerId) REFERENCES users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- STEP 4: Modify existing fields (optional - only if needed)
-- =====================================================

-- Increase name length to match schema (150 chars)
ALTER TABLE courses 
MODIFY COLUMN name VARCHAR(150) NOT NULL;

-- Ensure description allows larger text
ALTER TABLE courses 
MODIFY COLUMN description TEXT NULL;

-- Ensure summary field exists and has proper size
ALTER TABLE courses 
MODIFY COLUMN summary TEXT NULL;

-- =====================================================
-- STEP 5: Drop old fields (OPTIONAL - UNCOMMENT IF NEEDED)
-- =====================================================
-- WARNING: Only run these if you're sure you want to remove old fields
-- Make sure to backup your data first!

-- DROP old type enum field if it exists
-- ALTER TABLE courses DROP COLUMN IF EXISTS type;

-- DROP old objectives field
-- ALTER TABLE courses DROP COLUMN IF EXISTS objectives;

-- DROP old creditHours field
-- ALTER TABLE courses DROP COLUMN IF EXISTS creditHours;

-- DROP old level field
-- ALTER TABLE courses DROP COLUMN IF EXISTS level;

-- DROP old durationWeeks field
-- ALTER TABLE courses DROP COLUMN IF EXISTS durationWeeks;

-- DROP old deliveryMode field
-- ALTER TABLE courses DROP COLUMN IF EXISTS deliveryMode;

-- DROP old language field
-- ALTER TABLE courses DROP COLUMN IF EXISTS language;

-- DROP old isPublished field
-- ALTER TABLE courses DROP COLUMN IF EXISTS isPublished;

-- DROP old enrollmentCap field
-- ALTER TABLE courses DROP COLUMN IF EXISTS enrollmentCap;

-- DROP old departmentId field
-- ALTER TABLE courses DROP COLUMN IF EXISTS departmentId;

-- =====================================================
-- STEP 6: Data migration examples (optional)
-- =====================================================

-- Example: Set default values for existing records
-- UPDATE courses SET isAccredited = 0 WHERE isAccredited IS NULL;
-- UPDATE courses SET enrollmentOpen = 1 WHERE enrollmentOpen IS NULL;
-- UPDATE courses SET centerType = 'ACADEMIC' WHERE centerType IS NULL;

-- Example: Migrate old type field to centerType (if applicable)
-- UPDATE courses SET centerType = 'ACADEMIC' WHERE type = 'CORE';
-- UPDATE courses SET centerType = 'VOCATIONAL' WHERE type = 'VOCATIONAL';
-- UPDATE courses SET centerType = 'LANGUAGE' WHERE type LIKE '%LANGUAGE%';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure
DESCRIBE courses;

-- Check indexes
SHOW INDEX FROM courses;

-- Check foreign keys
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'courses' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Count records by centerType
SELECT centerType, COUNT(*) as count 
FROM courses 
GROUP BY centerType;

-- =====================================================
-- ROLLBACK SCRIPT (Save this for emergency rollback)
-- =====================================================
/*
-- Drop foreign key constraint
ALTER TABLE courses DROP FOREIGN KEY IF EXISTS fk_courses_centerManagerId;

-- Drop indexes
DROP INDEX IF EXISTS idx_courses_centerType ON courses;
DROP INDEX IF EXISTS idx_courses_targetAudience ON courses;
DROP INDEX IF EXISTS idx_courses_scheduleType ON courses;
DROP INDEX IF EXISTS idx_courses_isAccredited ON courses;
DROP INDEX IF EXISTS idx_courses_enrollmentOpen ON courses;
DROP INDEX IF EXISTS idx_courses_centerManagerId ON courses;

-- Drop columns
ALTER TABLE courses DROP COLUMN IF EXISTS focusArea;
ALTER TABLE courses DROP COLUMN IF EXISTS centerType;
ALTER TABLE courses DROP COLUMN IF EXISTS targetAudience;
ALTER TABLE courses DROP COLUMN IF EXISTS isAccredited;
ALTER TABLE courses DROP COLUMN IF EXISTS enrollmentOpen;
ALTER TABLE courses DROP COLUMN IF EXISTS centerManagerId;
ALTER TABLE courses DROP COLUMN IF EXISTS operatingHours;
ALTER TABLE courses DROP COLUMN IF EXISTS scheduleType;
ALTER TABLE courses DROP COLUMN IF EXISTS budget;
ALTER TABLE courses DROP COLUMN IF EXISTS resources;
ALTER TABLE courses DROP COLUMN IF EXISTS policies;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================

SELECT 'Migration completed successfully!' as status;
