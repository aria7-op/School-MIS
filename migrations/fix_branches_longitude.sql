-- Fix missing longitude column in branches table
-- Migration: Add missing longitude column to branches

-- Check if longitude column exists and add it if it doesn't
ALTER TABLE branches 
ADD COLUMN IF NOT EXISTS longitude DOUBLE NULL 
AFTER latitude;

-- Add index for longitude for better performance
ALTER TABLE branches 
ADD INDEX IF NOT EXISTS idx_branches_longitude (longitude);

SELECT 'Longitude column added to branches table successfully!' as status;
