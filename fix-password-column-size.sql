-- Fix password column size to accommodate bcrypt hashes
-- Bcrypt hashes are 60 characters long
-- This script increases the password column to VARCHAR(255) for safety

USE school_mis;

-- Check current column size
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'password';

-- Increase password column size to VARCHAR(255)
ALTER TABLE users 
MODIFY COLUMN password VARCHAR(255) NOT NULL;

-- Verify the change
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'password';

-- Show success message
SELECT '✅ Password column size increased to VARCHAR(255)' AS Status;
