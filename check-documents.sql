-- Check if any documents exist in the database
SELECT 
    d.id,
    d.title,
    d.type,
    d.path,
    d.studentId,
    d.deletedAt,
    s.admissionNo,
    CONCAT(u.firstName, ' ', u.lastName) as studentName
FROM documents d
LEFT JOIN students s ON d.studentId = s.id
LEFT JOIN users u ON s.userId = u.id
WHERE d.studentId = 1027
ORDER BY d.createdAt DESC;

-- Count total documents per student
SELECT 
    studentId,
    COUNT(*) as documentCount
FROM documents
WHERE deletedAt IS NULL
GROUP BY studentId
ORDER BY documentCount DESC
LIMIT 10;

-- Check all document types in database
SELECT 
    type,
    COUNT(*) as count
FROM documents
WHERE deletedAt IS NULL
GROUP BY type;































