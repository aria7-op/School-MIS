-- =====================================================
-- SIMPLE ADMIN USER CREATION FOR TEACHER PORTAL
-- =====================================================

-- First, remove the existing user if it exists
DELETE FROM users WHERE username = 'teacher';

-- Create admin user with SCHOOL_ADMIN role
-- Owner ID and School ID both set to 1
-- Password hash and salt are already generated and included below
INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt)
VALUES (
    UUID(),
    'teacher',
    'teacher@school.com',
    '$2a$10$lGKQXKB0R9b5OHCbnt/A1eZiBcKErySJEsmVZ1IYnp7NJhYgUQ5Ve',
    '$2a$10$lGKQXKB0R9b5OHCbnt/A1e',
    'Admin',
    'Teacher',
    'Admin Teacher',
    'SCHOOL_ADMIN',
    'ACTIVE',
    1, -- School ID = 1
    1, -- Owner ID = 1
    'UTC',
    'en-US',
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT 
    'Admin User Created Successfully!' as status,
    id,
    username,
    email,
    role,
    status,
    schoolId,
    createdByOwnerId
FROM users 
WHERE username = 'teacher';

-- Show login credentials
SELECT 
    'Login Credentials' as info,
    'teacher' as username,
    'admin123' as password,
    'teacher@school.com' as email,
    'SCHOOL_ADMIN' as role,
    'Will access Teacher Portal' as access_level; 