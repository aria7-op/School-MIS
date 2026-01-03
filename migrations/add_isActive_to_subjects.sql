-- Migration: Add isActive column to subjects table
-- Date: 2025-11-06
-- Description: Add isActive field to enable/disable subjects

-- Add isActive column with default value of true (1)
ALTER TABLE subjects 
ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1 
AFTER isElective;

-- Add index for better query performance
CREATE INDEX idx_subjects_isActive ON subjects(isActive);

-- Update all existing subjects to be active by default
UPDATE subjects SET isActive = 1 WHERE isActive IS NULL;

-- Verify the changes
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_subjects, 
       SUM(isActive) as active_subjects,
       SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive_subjects
FROM subjects WHERE deletedAt IS NULL;






