-- Fixed SQL commands to create demo tenant with Intermediate Plan
-- Run these commands in order

-- Step 1: Create or get demo owner (no email column)
INSERT INTO owners (uuid, name, password, salt, status, timezone, locale, createdAt, updatedAt)
SELECT 
    UUID() as uuid,
    'Demo Owner' as name,
    '$2a$12$placeholder' as password,
    'salt' as salt,
    'ACTIVE' as status,
    'UTC' as timezone,
    'en-US' as locale,
    NOW() as createdAt,
    NOW() as updatedAt
WHERE NOT EXISTS (SELECT 1 FROM owners WHERE name = 'Demo Owner')
LIMIT 1;

SET @owner_id = (SELECT id FROM owners WHERE name = 'Demo Owner' LIMIT 1);

-- Step 2: Get a user for createdBy (or use owner if no users exist)
SET @created_by_user = (SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN') AND deletedAt IS NULL LIMIT 1);

-- If no admin user exists, check if we can use owner ID (may need adjustment)
-- For now, let's try to get any user or create a minimal one
SET @created_by_user = COALESCE(
    @created_by_user,
    (SELECT id FROM users WHERE deletedAt IS NULL LIMIT 1),
    @owner_id
);

-- Step 3: Create the demo school
INSERT INTO schools (
    uuid, name, shortName, code, motto, about,
    phone, website, country, state, city, address, postalCode,
    timezone, locale, currency, status, ownerId, tenantId,
    createdAt, updatedAt
)
VALUES (
    UUID(),
    'Demo School',
    'Demo',
    'DEMO001',
    'Excellence in Education',
    'This is a demo tenant for testing purposes',
    '+1234567890',
    'https://demo.example.com',
    'United States',
    'California',
    'San Francisco',
    '123 Demo Street',
    '94102',
    'America/Los_Angeles',
    'en-US',
    'USD',
    'ACTIVE',
    @owner_id,
    'demo-tenant',
    NOW(),
    NOW()
);

SET @school_id = LAST_INSERT_ID();

-- Step 4: Create subscription with Intermediate Plan (id = 4)
INSERT INTO school_subscriptions (
    uuid, schoolId, packageId, status, startedAt, expiresAt, 
    autoRenew, paymentStatus, lastPaymentDate, createdAt, updatedAt
)
VALUES (
    UUID(),
    @school_id,
    4,  -- Intermediate Plan
    'ACTIVE',
    NOW(),
    DATE_ADD(NOW(), INTERVAL 1 YEAR),
    0,
    'PAID',
    NOW(),
    NOW(),
    NOW()
);

SET @subscription_id = LAST_INSERT_ID();

-- Step 5: Link subscription to school
UPDATE schools 
SET subscriptionId = @subscription_id 
WHERE id = @school_id;

-- Step 6: Create 1 branch
INSERT INTO branches (
    uuid, name, code, shortName, type, description,
    email, phone, addressLine1, city, state, country, postalCode,
    timezone, isMain, status, schoolId, createdBy,
    createdAt, updatedAt
)
VALUES (
    UUID(),
    'Main Campus',
    'BRANCH001',
    'Main',
    'MAIN',
    'Main campus branch',
    'main@demo.example.com',
    '+1234567891',
    '123 Demo Street',
    'San Francisco',
    'California',
    'United States',
    '94102',
    'America/Los_Angeles',
    1,  -- isMain = true
    'ACTIVE',
    @school_id,
    @created_by_user,
    NOW(),
    NOW()
);

SET @branch_id = LAST_INSERT_ID();

-- Step 7: Create 1 course (using branch_id, not branchId)
INSERT INTO courses (
    uuid, name, code, type, description, summary,
    creditHours, level, durationWeeks, deliveryMode, language,
    isActive, isPublished, schoolId, branch_id, createdBy,
    createdAt, updatedAt
)
VALUES (
    UUID(),
    'Introduction to Computer Science',
    'CS101',
    'CORE',
    'Basic computer science course',
    'Introduction to programming and computer fundamentals',
    3,
    1,
    16,
    'IN_PERSON',
    'en',
    1,  -- isActive
    1,  -- isPublished
    @school_id,
    @branch_id,
    @created_by_user,
    NOW(),
    NOW()
);

SET @course_id = LAST_INSERT_ID();

-- Step 8: Verify everything was created
SELECT 
    'School' as type,
    s.id,
    s.name,
    s.tenantId,
    s.code
FROM schools s
WHERE s.id = @school_id

UNION ALL

SELECT 
    'Branch' as type,
    b.id,
    b.name,
    NULL as tenantId,
    b.code
FROM branches b
WHERE b.id = @branch_id

UNION ALL

SELECT 
    'Course' as type,
    c.id,
    c.name,
    NULL as tenantId,
    c.code
FROM courses c
WHERE c.id = @course_id;

-- Step 9: Show complete details
SELECT 
    s.name as school_name,
    s.tenantId,
    p.name as package_name,
    sub.status as subscription_status,
    sub.expiresAt,
    b.name as branch_name,
    c.name as course_name
FROM schools s
JOIN school_subscriptions sub ON s.subscriptionId = sub.id
JOIN packages p ON sub.packageId = p.id
LEFT JOIN branches b ON b.schoolId = s.id
LEFT JOIN courses c ON c.schoolId = s.id
WHERE s.id = @school_id;

