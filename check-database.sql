USE school;

-- Check existing owners
SELECT '=== EXISTING OWNERS ===' as status;
SELECT id, name, email FROM owners;

-- Check existing users
SELECT '=== EXISTING USERS ===' as status;
SELECT id, username, email, role, status FROM users LIMIT 10;

-- Check existing schools
SELECT '=== EXISTING SCHOOLS ===' as status;
SELECT id, name, code, ownerId FROM schools;

-- Check table structure
SELECT '=== TABLE STRUCTURE ===' as status;
DESCRIBE users;
DESCRIBE parents;
DESCRIBE students; 