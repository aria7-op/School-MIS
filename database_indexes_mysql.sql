-- Database Indexes for Parent Dashboard Performance (MySQL Version)
-- Run this script on your MySQL database to improve query performance

-- Use the school database
USE school;

-- First, let's check existing indexes
SHOW INDEX FROM payments;
SHOW INDEX FROM students;
SHOW INDEX FROM users;
SHOW INDEX FROM parents;
SHOW INDEX FROM grades;
SHOW INDEX FROM attendances;

-- Index for payment queries by parent and school
CREATE INDEX idx_payments_parent_school ON payments(parentId, schoolId);

-- Index for payment queries by parent, school, and date
CREATE INDEX idx_payments_parent_school_date ON payments(parentId, schoolId, paymentDate);

-- Index for student queries by parent and school
CREATE INDEX idx_students_parent_school ON students(parentId, schoolId);

-- Index for user queries by ID and school (for getParentRecordIdByUserId)
CREATE INDEX idx_users_school ON users(id, schoolId);

-- Index for parent queries by user ID and school
CREATE INDEX idx_parents_user_school ON parents(userId, schoolId);

-- Index for grades queries by student (for performance calculations)
CREATE INDEX idx_grades_student ON grades(studentId);

-- Index for attendance queries by student (if used in dashboard)
CREATE INDEX idx_attendances_student ON attendances(studentId);

-- Composite index for parent queries with school and deletion status
CREATE INDEX idx_parents_school_deleted ON parents(schoolId, deletedAt);

-- Composite index for student queries with parent, school and deletion status
CREATE INDEX idx_students_parent_school_deleted ON students(parentId, schoolId, deletedAt);

-- Verify indexes were created
SHOW INDEX FROM payments;
SHOW INDEX FROM students;
SHOW INDEX FROM users;
SHOW INDEX FROM parents;
SHOW INDEX FROM grades;
SHOW INDEX FROM attendances; 