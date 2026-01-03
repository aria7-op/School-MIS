-- Migration: Add shift and gender fields to classes table
-- Created: 2025-11-03
-- Description: Adds shift (morning/afternoon) and gender (boys/girls/mixed) categorization to classes

-- Add shift column
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS shift VARCHAR(20) DEFAULT 'morning';

-- Add gender column  
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'boys';

-- Add comment explaining the columns
COMMENT ON COLUMN classes.shift IS 'Class shift timing: morning or afternoon';
COMMENT ON COLUMN classes.gender IS 'Class gender category: boys, girls, or mixed';

-- Create index for shift and gender for faster filtering
CREATE INDEX IF NOT EXISTS idx_classes_shift ON classes(shift);
CREATE INDEX IF NOT EXISTS idx_classes_gender ON classes(gender);
CREATE INDEX IF NOT EXISTS idx_classes_shift_gender ON classes(shift, gender);

-- Update existing classes to have default values if NULL
UPDATE classes SET shift = 'morning' WHERE shift IS NULL;
UPDATE classes SET gender = 'boys' WHERE gender IS NULL;

