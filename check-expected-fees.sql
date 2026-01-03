-- Check if expectedFees column exists in students table
SHOW COLUMNS FROM students LIKE 'expectedFees';

-- Check if any students have expectedFees set
SELECT id, admissionNo, expectedFees, classId 
FROM students 
WHERE deletedAt IS NULL 
LIMIT 10;

-- Check if classes have expectedFees
SELECT id, name, code, expectedFees 
FROM classes 
WHERE deletedAt IS NULL 
LIMIT 10;

