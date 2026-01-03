USE school;

-- Check existing users with admin roles
SELECT '=== ADMIN USERS ===' as status;
SELECT 
    id,
    username,
    email,
    role,
    status,
    schoolId,
    createdByOwnerId
FROM users 
WHERE role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'OWNER')
ORDER BY role, id;

-- Check existing owners
SELECT '=== OWNERS ===' as status;
SELECT 
    id,
    name,
    email,
    status
FROM owners;

-- Check user roles and permissions
SELECT '=== USER ROLES ===' as status;
SELECT DISTINCT role FROM users ORDER BY role;

-- Check which users can create other users
SELECT '=== USERS WHO CAN CREATE OTHERS ===' as status;
SELECT 
    id,
    username,
    email,
    role,
    status
FROM users 
WHERE role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'OWNER')
   OR id IN (SELECT createdByOwnerId FROM users WHERE createdByOwnerId IS NOT NULL)
ORDER BY role, id; 