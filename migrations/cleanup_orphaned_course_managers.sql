-- Fix orphaned CourseManagerAssignment records
-- Migration: Clean up course manager assignments with null managers

-- Delete orphaned CourseManagerAssignment records where the user (manager) no longer exists
DELETE cma FROM course_manager_assignments cma
LEFT JOIN users u ON cma.userId = u.id
WHERE cma.revokedAt IS NULL 
AND u.id IS NULL;

-- Also clean up any revoked assignments with null managers for consistency
DELETE cma FROM course_manager_assignments cma
LEFT JOIN users u ON cma.userId = u.id
WHERE cma.revokedAt IS NOT NULL 
AND u.id IS NULL;

SELECT 'Orphaned course manager assignments cleaned up successfully!' as status;
