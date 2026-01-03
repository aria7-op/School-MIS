-- =====================================================
-- Fix Invalid DateTime Values in Users Table
-- =====================================================
-- This script fixes datetime fields with day or month = 0
-- which are invalid and cause Prisma errors

-- First, let's see what we're dealing with
SELECT 'Records with invalid createdAt:' as info, COUNT(*) as count
FROM users 
WHERE DAY(createdAt) = 0 OR MONTH(createdAt) = 0;

SELECT 'Records with invalid updatedAt:' as info, COUNT(*) as count
FROM users 
WHERE DAY(updatedAt) = 0 OR MONTH(updatedAt) = 0;

SELECT 'Records with invalid lastLogin:' as info, COUNT(*) as count
FROM users 
WHERE lastLogin IS NOT NULL AND (DAY(lastLogin) = 0 OR MONTH(lastLogin) = 0);

-- Show some examples of invalid records
SELECT id, username, createdAt, updatedAt, lastLogin
FROM users 
WHERE DAY(createdAt) = 0 OR MONTH(createdAt) = 0 
   OR DAY(updatedAt) = 0 OR MONTH(updatedAt) = 0
   OR (lastLogin IS NOT NULL AND (DAY(lastLogin) = 0 OR MONTH(lastLogin) = 0))
LIMIT 10;

-- =====================================================
-- FIX INVALID createdAt VALUES
-- =====================================================
UPDATE users 
SET createdAt = '2024-01-01 00:00:00'
WHERE DAY(createdAt) = 0 OR MONTH(createdAt) = 0;

-- =====================================================
-- FIX INVALID updatedAt VALUES
-- =====================================================
UPDATE users 
SET updatedAt = COALESCE(createdAt, '2024-01-01 00:00:00')
WHERE DAY(updatedAt) = 0 OR MONTH(updatedAt) = 0;

-- =====================================================
-- FIX INVALID lastLogin VALUES
-- =====================================================
UPDATE users 
SET lastLogin = NULL
WHERE lastLogin IS NOT NULL 
  AND (DAY(lastLogin) = 0 OR MONTH(lastLogin) = 0);

-- =====================================================
-- Verify the fix
-- =====================================================
SELECT 'After fix - Records with invalid createdAt:' as info, COUNT(*) as count
FROM users 
WHERE DAY(createdAt) = 0 OR MONTH(createdAt) = 0;

SELECT 'After fix - Records with invalid updatedAt:' as info, COUNT(*) as count
FROM users 
WHERE DAY(updatedAt) = 0 OR MONTH(updatedAt) = 0;

SELECT 'After fix - Records with invalid lastLogin:' as info, COUNT(*) as count
FROM users 
WHERE lastLogin IS NOT NULL AND (DAY(lastLogin) = 0 OR MONTH(lastLogin) = 0);

-- Show sample of fixed records
SELECT id, username, createdAt, updatedAt, lastLogin
FROM users 
ORDER BY id
LIMIT 10;

