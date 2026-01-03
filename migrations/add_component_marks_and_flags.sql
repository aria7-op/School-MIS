-- Migration: Add Component Marks and Special Flags to Grades Table
-- Date: 2025-11-04
-- Purpose: Support Excel شقه sheet component mark breakdown and special status flags

-- Add component mark columns to grades table
ALTER TABLE `grades` 
  ADD COLUMN `marksWritten` DECIMAL(5, 2) NULL COMMENT 'تحریری (Written exam marks)',
  ADD COLUMN `marksPractical` DECIMAL(5, 2) NULL COMMENT 'تقریری/عملی (Oral/Practical marks)',
  ADD COLUMN `marksActivity` DECIMAL(5, 2) NULL COMMENT 'فعالیت صنفی (Class activity marks)',
  ADD COLUMN `marksHomework` DECIMAL(5, 2) NULL COMMENT 'کار خانگی (Homework marks)',
  ADD COLUMN `specialFlag` INT NULL DEFAULT 0 COMMENT '0=none, 1=معذرتی midterm, 2=معذرتی annual, 3=سه پارچه';

-- Add index on specialFlag for fast filtering
ALTER TABLE `grades` ADD INDEX `idx_grades_specialFlag` (`specialFlag`);

-- Add attendanceThreshold to exams table
ALTER TABLE `exams`
  ADD COLUMN `attendanceThreshold` INT NULL DEFAULT 99 COMMENT 'ایام محرومی (Attendance deprivation threshold in days)';

-- Update existing grades to have default specialFlag value
UPDATE `grades` SET `specialFlag` = 0 WHERE `specialFlag` IS NULL;

-- Migrate existing remarks JSON to component columns (if JSON format exists)
UPDATE `grades` 
SET 
  `marksWritten` = JSON_UNQUOTE(JSON_EXTRACT(`remarks`, '$.written')),
  `marksPractical` = JSON_UNQUOTE(JSON_EXTRACT(`remarks`, '$.practical')),
  `marksActivity` = JSON_UNQUOTE(JSON_EXTRACT(`remarks`, '$.activity')),
  `marksHomework` = JSON_UNQUOTE(JSON_EXTRACT(`remarks`, '$.homework'))
WHERE 
  `remarks` IS NOT NULL 
  AND `remarks` LIKE '%"written"%'
  AND JSON_VALID(`remarks`);

-- Verification queries
SELECT 
  'Total grades with component marks' as description,
  COUNT(*) as count 
FROM `grades` 
WHERE `marksWritten` IS NOT NULL OR `marksPractical` IS NOT NULL;

SELECT 
  'Exams with attendance threshold set' as description,
  COUNT(*) as count 
FROM `exams` 
WHERE `attendanceThreshold` IS NOT NULL;

-- Display sample data
SELECT 
  g.id,
  s.firstName,
  subj.name as subject,
  g.marks as total,
  g.marksWritten,
  g.marksPractical,
  g.marksActivity,
  g.marksHomework,
  g.specialFlag
FROM `grades` g
LEFT JOIN `students` st ON g.studentId = st.id
LEFT JOIN `users` s ON st.userId = s.id
LEFT JOIN `subjects` subj ON g.subjectId = subj.id
WHERE g.deletedAt IS NULL
ORDER BY g.createdAt DESC
LIMIT 10;

-- Success message
SELECT 'Migration completed successfully! Component marks columns and special flags added.' as message;





