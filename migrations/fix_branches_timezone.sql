-- Fix missing timezone column in branches table
-- Migration: Add missing timezone column to branches

-- Add timezone column if it doesn't exist
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NULL DEFAULT 'UTC';

-- Add index for timezone for better performance
ALTER TABLE branches 
ADD INDEX IF NOT EXISTS idx_branches_timezone (timezone);

SELECT 'Timezone column added to branches table successfully!' as status;
