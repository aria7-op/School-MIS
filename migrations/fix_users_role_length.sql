-- Fix role column length in users table
-- Migration: Extend role column to accommodate longer enum values

-- Check current role column length and extend if needed
ALTER TABLE users 
MODIFY COLUMN role VARCHAR(50) NOT NULL;

-- Add index for role for better performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_users_role (role);

SELECT 'Role column in users table extended to VARCHAR(50) successfully!' as status;
