-- Step 1: Check existing owner
USE school;
SELECT id, name, email FROM owners WHERE id IN (SELECT ownerId FROM schools WHERE id = 1);

-- Step 2: Create parent user (copy this line after you get the owner ID)
-- INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt) VALUES (UUID(), 'ahmad_parent', 'ahmad.parent@kawish.edu.pk', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Ahmad', 'Parent', 'Ahmad Parent', 'PARENT', 'ACTIVE', 1, 1, 'UTC', 'en-US', NOW(), NOW());

-- Step 3: Get parent user ID
-- SELECT LAST_INSERT_ID() as parent_user_id;

-- Step 4: Create parent record (replace X with the parent user ID from step 3)
-- INSERT INTO parents (uuid, userId, occupation, annualIncome, education, schoolId, createdBy, createdAt, updatedAt) VALUES (UUID(), X, 'Engineer', 500000.00, 'Bachelor\'s Degree', 1, 1, NOW(), NOW());

-- Step 5: Get parent record ID
-- SELECT LAST_INSERT_ID() as parent_id;

-- Step 6: Create student user (replace X with the parent user ID from step 3)
-- INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt) VALUES (UUID(), 'ahmad_student', 'ahmad.student@kawish.edu.pk', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'Ahmad', 'Student', 'Ahmad Student', 'STUDENT', 'ACTIVE', 1, 1, 'UTC', 'en-US', NOW(), NOW());

-- Step 7: Get student user ID
-- SELECT LAST_INSERT_ID() as student_user_id;

-- Step 8: Create student record (replace X with student user ID, Y with parent record ID)
-- INSERT INTO students (uuid, userId, admissionNo, rollNo, parentId, admissionDate, bloodGroup, nationality, religion, schoolId, createdBy, createdAt, updatedAt) VALUES (UUID(), X, 'STU001', '1001', Y, NOW(), 'O+', 'Pakistani', 'Islam', 1, 1, NOW(), NOW());

-- Step 9: Verify everything
-- SELECT 'Parent' as type, u.username, u.email, u.role FROM users u WHERE u.username = 'ahmad_parent';
-- SELECT 'Student' as type, u.username, u.email, u.role FROM users u WHERE u.username = 'ahmad_student'; 