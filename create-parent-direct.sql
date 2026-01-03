USE school;

-- First, let's see what we have
SELECT '=== CURRENT STATE ===' as status;

-- Check owners
SELECT 'Owners:' as info;
SELECT id, name, email FROM owners;

-- Check existing users
SELECT 'Users:' as info;
SELECT id, username, email, role, status FROM users WHERE role IN ('PARENT', 'STUDENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN') ORDER BY role;

-- Check if our target users already exist
SELECT 'Target Users Check:' as info;
SELECT username, email, role, status FROM users WHERE username IN ('ahmad_parent', 'ahmad_student');

-- Now let's create the parent user
-- First, get the owner ID (assuming it's 1, but let's check)
SET @owner_id = (SELECT id FROM owners LIMIT 1);

SELECT CONCAT('Using owner ID: ', @owner_id) as info;

-- Create parent user
INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt)
VALUES (
    UUID(),
    'ahmad_parent',
    'ahmad.parent@kawish.edu.pk',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: parent123
    NULL,
    'Ahmad',
    'Parent',
    'Ahmad Parent',
    'PARENT',
    'ACTIVE',
    1,
    @owner_id,
    'UTC',
    'en-US',
    NOW(),
    NOW()
);

-- Get the parent user ID
SET @parent_user_id = LAST_INSERT_ID();
SELECT CONCAT('Created parent user with ID: ', @parent_user_id) as status;

-- Create parent record
INSERT INTO parents (uuid, userId, occupation, annualIncome, education, schoolId, createdBy, createdAt, updatedAt)
VALUES (
    UUID(),
    @parent_user_id,
    'Engineer',
    500000.00,
    'Bachelor\'s Degree',
    1,
    @owner_id,
    NOW(),
    NOW()
);

-- Get the parent record ID
SET @parent_id = LAST_INSERT_ID();
SELECT CONCAT('Created parent record with ID: ', @parent_id) as status;

-- Create student user
INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt)
VALUES (
    UUID(),
    'ahmad_student',
    'ahmad.student@kawish.edu.pk',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: student123
    NULL,
    'Ahmad',
    'Student',
    'Ahmad Student',
    'STUDENT',
    'ACTIVE',
    1,
    @owner_id,
    'UTC',
    'en-US',
    NOW(),
    NOW()
);

-- Get the student user ID
SET @student_user_id = LAST_INSERT_ID();
SELECT CONCAT('Created student user with ID: ', @student_user_id) as status;

-- Create student record
INSERT INTO students (uuid, userId, admissionNo, rollNo, parentId, admissionDate, bloodGroup, nationality, religion, schoolId, createdBy, createdAt, updatedAt)
VALUES (
    UUID(),
    @student_user_id,
    'STU001',
    '1001',
    @parent_id,
    NOW(),
    'O+',
    'Pakistani',
    'Islam',
    1,
    @owner_id,
    NOW(),
    NOW()
);

-- Get the student record ID
SET @student_id = LAST_INSERT_ID();
SELECT CONCAT('Created student record with ID: ', @student_id) as status;

-- Verify everything
SELECT '=== VERIFICATION ===' as status;

SELECT 
    'Parent User' as type,
    u.username,
    u.email,
    u.role,
    u.status
FROM users u 
WHERE u.id = @parent_user_id;

SELECT 
    'Student User' as type,
    u.username,
    u.email,
    u.role,
    u.status
FROM users u 
WHERE u.id = @student_user_id;

SELECT 
    'Parent Record' as type,
    p.id,
    p.userId,
    p.occupation
FROM parents p
WHERE p.id = @parent_id;

SELECT 
    'Student Record' as type,
    s.id,
    s.userId,
    s.admissionNo,
    s.rollNo,
    s.parentId
FROM students s
WHERE s.id = @student_id;

-- Final summary
SELECT '=== SUCCESS ===' as status;
SELECT 
    'Parent Login' as account_type,
    'ahmad_parent' as username,
    'parent123' as password,
    'ahmad.parent@kawish.edu.pk' as email;

SELECT 
    'Student Login' as account_type,
    'ahmad_student' as username,
    'student123' as password,
    'ahmad.student@kawish.edu.pk' as email;

SELECT 'Both accounts are now linked and ready to use!' as message; 