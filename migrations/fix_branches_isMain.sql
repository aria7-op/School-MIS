-- Fix missing isMain column in branches table
-- Migration: Add missing isMain column to branches

-- Add isMain column if it doesn't exist
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS isMain BOOLEAN NULL DEFAULT FALSE;

-- Add index for isMain for better performance
ALTER TABLE branches 
ADD INDEX IF NOT EXISTS idx_branches_isMain (isMain);

SELECT 'isMain column added to branches table successfully!' as status;
