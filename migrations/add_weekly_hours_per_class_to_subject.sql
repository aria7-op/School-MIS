-- Migration: Add weeklyHoursPerClass field to Subject model
-- This field stores metadata about how many hours per week each subject should be taught for each class
-- Format: JSON object with classId as key and hours as value
-- Example: {"1": 5, "2": 3, "5": 4} means class 1 gets 5 hours/week, class 2 gets 3 hours/week, etc.

-- Add the weeklyHoursPerClass column to subjects table
ALTER TABLE subjects 
ADD COLUMN weeklyHoursPerClass JSON NULL;

-- Add a comment to document the field
ALTER TABLE subjects 
MODIFY COLUMN weeklyHoursPerClass JSON NULL 
COMMENT 'JSON object mapping classId to weekly hours: {"classId": hours}';

-- Note: This is a nullable field, so existing records will have NULL by default
-- The format is a JSON object where:
--   - Keys are class IDs (as strings)
--   - Values are integers representing hours per week (0-40)
-- Example: {"1": 5, "2": 4, "3": 6}


