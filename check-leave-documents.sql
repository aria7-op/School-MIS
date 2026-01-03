-- Check if this student has leave documents
SELECT 
    a.id as attendance_id,
    a.studentId,
    a.date,
    a.status,
    a.remarks,
    a.leaveDocumentPath,
    CONCAT(u.firstName, ' ', u.lastName) as studentName
FROM attendances a
JOIN students s ON a.studentId = s.id
JOIN users u ON s.userId = u.id
WHERE a.studentId = 9
  AND a.status = 'EXCUSED'
ORDER BY a.date DESC
LIMIT 5;

-- Check all EXCUSED attendances with documents
SELECT 
    COUNT(*) as total_excused,
    SUM(CASE WHEN leaveDocumentPath IS NOT NULL THEN 1 ELSE 0 END) as with_documents
FROM attendances
WHERE status = 'EXCUSED'
  AND deletedAt IS NULL;























