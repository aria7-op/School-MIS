USE school;

-- Fix the parent-student relationship
-- Update the student to link to the parent USER ID instead of parent RECORD ID

-- First, let's see the current state
SELECT '=== CURRENT STATE ===' as status;

SELECT 
    'Parent User' as type,
    u.id as user_id,
    u.username,
    u.role,
    u.status
FROM users u 
WHERE u.username = 'ahmad_parent';

SELECT 
    'Parent Record' as type,
    p.id as parent_record_id,
    p.userId as parent_user_id,
    p.occupation
FROM parents p
WHERE p.userId = 493;

SELECT 
    'Student User' as type,
    u.id as user_id,
    u.username,
    u.role,
    u.status
FROM users u 
WHERE u.username = 'ahmad_student';

SELECT 
    'Student Record' as type,
    s.id as student_record_id,
    s.userId as student_user_id,
    s.parentId as current_parent_id,
    s.admissionNo,
    s.rollNo
FROM students s
WHERE s.userId = 494;

-- Now fix the relationship
-- Update the student to link to the parent USER ID (493) instead of parent RECORD ID (2)
UPDATE students 
SET parentId = 493  -- This is the parent user ID
WHERE id = 959;     -- This is the student record ID

-- Verify the fix
SELECT '=== AFTER FIX ===' as status;

SELECT 
    'Student Record Updated' as type,
    s.id as student_record_id,
    s.userId as student_user_id,
    s.parentId as new_parent_id,
    s.admissionNo,
    s.rollNo
FROM students s
WHERE s.id = 959;

-- Test the relationship
SELECT 
    'Parent-Student Relationship' as type,
    p.id as parent_record_id,
    p.userId as parent_user_id,
    s.id as student_record_id,
    s.userId as student_user_id,
    u_parent.username as parent_username,
    u_student.username as student_username,
    s.admissionNo,
    s.rollNo
FROM parents p
JOIN students s ON s.parentId = p.userId
JOIN users u_parent ON p.userId = u_parent.id
JOIN users u_student ON s.userId = u_student.id
WHERE p.userId = 493;

-- Final verification
SELECT '=== FINAL VERIFICATION ===' as status;

SELECT 
    'All Users' as type,
    u.id,
    u.username,
    u.role,
    u.status
FROM users u 
WHERE u.username IN ('ahmad_parent', 'ahmad_student')
ORDER BY u.role;

SELECT 
    'All Relationships' as type,
    'Parent Record ID: ' || p.id as parent_info,
    'Parent User ID: ' || p.userId as parent_user_info,
    'Student Record ID: ' || s.id as student_info,
    'Student User ID: ' || s.userId as student_user_info,
    'Student Parent ID: ' || s.parentId as student_parent_link
FROM parents p
JOIN students s ON s.parentId = p.userId
WHERE p.userId = 493; 