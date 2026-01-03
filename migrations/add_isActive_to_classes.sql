-- Migration: Add isActive column to classes table
-- Date: 2025-11-06
-- Description: Add isActive field to enable/disable classes

-- Add isActive column with default value of true (1)
ALTER TABLE classes 
ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1 
AFTER gender;

-- Add index for better query performance
CREATE INDEX idx_classes_isActive ON classes(isActive);

-- Update all existing classes to be active by default
UPDATE classes SET isActive = 1 WHERE isActive IS NULL;

-- Verify the changes
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_classes, 
       SUM(isActive) as active_classes,
       SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive_classes
FROM classes WHERE deletedAt IS NULL;






