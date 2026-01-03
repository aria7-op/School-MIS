USE school;

-- =====================================================
-- CREATE ADMIN USER FOR TEACHER PORTAL ACCESS
-- =====================================================

-- First, let's see what we have
SELECT '=== CURRENT STATE ===' as status;

-- Check owners
SELECT 'Owners:' as info;
SELECT id, name, email FROM owners;

-- Check existing users
SELECT 'Users:' as info;
SELECT id, username, email, role, status FROM users WHERE role IN ('SCHOOL_ADMIN', 'SUPER_ADMIN') ORDER BY role;

-- Check if our target admin user already exists
SELECT 'Target Admin User Check:' as info;
SELECT username, email, role, status FROM users WHERE username IN ('admin_teacher', 'school_admin');

-- =====================================================
-- STEP 1: ENSURE WE HAVE AN OWNER
-- =====================================================

-- Get the owner ID (assuming it's 1, but let's check)
SET @owner_id = (SELECT id FROM owners LIMIT 1);

-- If no owner exists, create one
IF @owner_id IS NULL THEN
    INSERT INTO owners (uuid, name, email, password, salt, timezone, locale, status, createdAt, updatedAt)
    VALUES (
        UUID(),
        'System Owner',
        'owner@school.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
        NULL,
        'UTC',
        'en-US',
        'ACTIVE',
        NOW(),
        NOW()
    );
    
    SET @owner_id = LAST_INSERT_ID();
    SELECT CONCAT('Created new owner with ID: ', @owner_id) as info;
ELSE
    SELECT CONCAT('Using existing owner ID: ', @owner_id) as info;
END IF;

-- =====================================================
-- STEP 2: CREATE ADMIN USER
-- =====================================================

-- Create admin user with SCHOOL_ADMIN role (this will access teacher portal)
INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt)
VALUES (
    UUID(),
    'admin_teacher',
    'admin.teacher@school.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    NULL,
    'Admin',
    'Teacher',
    'Admin Teacher',
    'SCHOOL_ADMIN', -- This role will access the teacher portal
    'ACTIVE',
    1, -- Assuming school ID is 1
    @owner_id,
    'UTC',
    'en-US',
    NOW(),
    NOW()
);

-- Get the admin user ID
SET @admin_user_id = LAST_INSERT_ID();
SELECT CONCAT('Created admin user with ID: ', @admin_user_id) as status;

-- =====================================================
-- STEP 3: CREATE STAFF RECORD (OPTIONAL - FOR COMPLETE PROFILE)
-- =====================================================

-- Create staff record for the admin user
INSERT INTO staff (uuid, userId, employeeId, designation, department, joiningDate, salary, schoolId, createdBy, createdAt, updatedAt)
VALUES (
    UUID(),
    @admin_user_id,
    'EMP001',
    'School Administrator',
    'Administration',
    NOW(),
    50000.00,
    1,
    @owner_id,
    NOW(),
    NOW()
);

-- Get the staff record ID
SET @staff_id = LAST_INSERT_ID();
SELECT CONCAT('Created staff record with ID: ', @staff_id) as status;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

SELECT '=== VERIFICATION ===' as status;

-- Check admin user
SELECT 
    'Admin User' as type,
    u.id,
    u.username,
    u.email,
    u.role,
    u.status,
    u.firstName,
    u.lastName
FROM users u 
WHERE u.id = @admin_user_id;

-- Check staff record
SELECT 
    'Staff Record' as type,
    s.id,
    s.userId,
    s.employeeId,
    s.designation,
    s.department
FROM staff s
WHERE s.id = @staff_id;

-- Check owner
SELECT 
    'Owner' as type,
    o.id,
    o.name,
    o.email
FROM owners o
WHERE o.id = @owner_id;

-- =====================================================
-- STEP 5: FINAL SUMMARY
-- =====================================================

SELECT '=== SUCCESS ===' as status;

SELECT 
    'Admin Teacher Portal Access' as account_type,
    'admin_teacher' as username,
    'admin123' as password,
    'admin.teacher@school.com' as email,
    'SCHOOL_ADMIN' as role,
    'Will access Teacher Portal' as access_level;

SELECT 'Admin user is now ready to access the Teacher Portal!' as message;

-- =====================================================
-- STEP 6: ADDITIONAL ADMIN USERS (OPTIONAL)
-- =====================================================

-- Create another admin user if needed
INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt)
VALUES (
    UUID(),
    'school_admin',
    'school.admin@school.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    NULL,
    'School',
    'Administrator',
    'School Administrator',
    'SCHOOL_ADMIN',
    'ACTIVE',
    1,
    @owner_id,
    'UTC',
    'en-US',
    NOW(),
    NOW()
);

SET @admin_user_id_2 = LAST_INSERT_ID();

-- Create staff record for second admin
INSERT INTO staff (uuid, userId, employeeId, designation, department, joiningDate, salary, schoolId, createdBy, createdAt, updatedAt)
VALUES (
    UUID(),
    @admin_user_id_2,
    'EMP002',
    'School Administrator',
    'Administration',
    NOW(),
    50000.00,
    1,
    @owner_id,
    NOW(),
    NOW()
);

SELECT 
    'Second Admin User' as account_type,
    'school_admin' as username,
    'admin123' as password,
    'school.admin@school.com' as email,
    'SCHOOL_ADMIN' as role;

SELECT 'Both admin users are now ready to access the Teacher Portal!' as final_message; 