-- =====================================================
-- Add level column to schools and branches tables
-- Migration Date: 2026-01-10
-- =====================================================

-- Add level column to schools table
ALTER TABLE schools 
ADD COLUMN level VARCHAR(50) NULL AFTER status,
ADD INDEX idx_level (level);

-- Add level column to branches table
ALTER TABLE branches 
ADD COLUMN level VARCHAR(50) NULL AFTER status,
ADD INDEX idx_level_branches (level);

-- Optional: Add comments to document the column purpose
ALTER TABLE schools 
MODIFY COLUMN level VARCHAR(50) NULL COMMENT 'Educational level (e.g., Primary, Secondary, High School, University)';

ALTER TABLE branches 
MODIFY COLUMN level VARCHAR(50) NULL COMMENT 'Educational level for this branch (e.g., Primary, Secondary, High School, University)';

-- =====================================================
-- Sample data update (optional - uncomment if needed)
-- =====================================================

-- Update existing schools with default level if needed
-- UPDATE schools SET level = 'Secondary' WHERE level IS NULL;

-- Update existing branches with default level if needed
-- UPDATE branches SET level = 'Secondary' WHERE level IS NULL;

-- =====================================================
-- Rollback script (if needed)
-- =====================================================

-- To rollback this migration, run:
-- ALTER TABLE schools DROP COLUMN level;
-- ALTER TABLE branches DROP COLUMN level;
