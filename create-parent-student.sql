-- Create Parent User with Student - SQL Script
-- Run this in your MySQL database: school

USE school;

-- First, let's check if we have an owner for the school
SELECT 'Checking existing owner...' as status;
SELECT id, name, email FROM owners WHERE id IN (
    SELECT ownerId FROM schools WHERE id = 1
) LIMIT 1;

-- Create a default owner if none exists (uncomment if needed)
-- INSERT INTO owners (uuid, name, email, password, salt, status, timezone, locale, createdAt, updatedAt)
-- VALUES (UUID(), 'Default Owner', 'owner@kawish.edu.pk', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'ACTIVE', 'UTC', 'en-US', NOW(), NOW());

-- Get the owner ID (use the result from the first SELECT)
SET @owner_id = (SELECT id FROM owners WHERE id IN (SELECT ownerId FROM schools WHERE id = 1) LIMIT 1);

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
        1, -- school ID
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
        1, -- school ID
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
        1, -- school ID
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
        1, -- school ID
        @owner_id,
        NOW(),
        NOW()
    );

    -- Get the student record ID
    SET @student_id = LAST_INSERT_ID();
    SELECT CONCAT('Created student record with ID: ', @student_id) as status;

    -- Verify the relationships
    SELECT 'Verifying relationships...' as status;

    SELECT 
        'Parent' as type,
        u.username,
        u.email,
        u.role,
        u.status
    FROM users u 
    WHERE u.id = @parent_user_id;

    SELECT 
        'Student' as type,
        u.username,
        u.email,
        u.role,
        u.status
    FROM users u 
    WHERE u.id = @student_user_id;

    SELECT 
        'Parent-Student Link' as relationship,
        p.id as parent_id,
        s.id as student_id,
        s.admissionNo,
        s.rollNo
    FROM parents p
    JOIN students s ON p.id = s.parentId
    WHERE p.id = @parent_id;

    -- Final summary
    SELECT '=== CREATION COMPLETE ===' as status;
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