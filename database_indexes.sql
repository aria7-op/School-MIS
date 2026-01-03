-- Database Indexes for Parent Dashboard Performance
-- Run this script on your database to improve query performance

-- Index for payment queries by parent and school
CREATE INDEX IF NOT EXISTS idx_payment_parent_school ON payment(parentId, schoolId);

-- Index for payment queries by parent, school, and date
CREATE INDEX IF NOT EXISTS idx_payment_parent_school_date ON payment(parentId, schoolId, paymentDate);

-- Index for student queries by parent and school
CREATE INDEX IF NOT EXISTS idx_student_parent_school ON student(parentId, schoolId);

-- Index for user queries by ID and school (for getParentRecordIdByUserId)
CREATE INDEX IF NOT EXISTS idx_user_school ON user(id, schoolId);

-- Index for parent queries by user ID and school
CREATE INDEX IF NOT EXISTS idx_parent_user_school ON parent(userId, schoolId);

-- Index for grades queries by student (for performance calculations)
CREATE INDEX IF NOT EXISTS idx_grade_student ON grade(studentId);

-- Index for attendance queries by student (if used in dashboard)
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(studentId);

-- Composite index for parent queries with school and deletion status
CREATE INDEX IF NOT EXISTS idx_parent_school_deleted ON parent(schoolId, deletedAt);

-- Composite index for student queries with parent, school and deletion status
CREATE INDEX IF NOT EXISTS idx_student_parent_school_deleted ON student(parentId, schoolId, deletedAt);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('payment', 'student', 'user', 'parent', 'grade', 'attendance')
ORDER BY tablename, indexname; 