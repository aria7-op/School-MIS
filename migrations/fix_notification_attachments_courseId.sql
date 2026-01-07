-- Fix missing courseId column in notification_attachments table
-- Migration: Add missing courseId column to notification_attachments

-- Check if courseId column exists and add it if it doesn't
ALTER TABLE notification_attachments 
ADD COLUMN IF NOT EXISTS courseId BIGINT NULL 
AFTER schoolId;

-- Add foreign key constraint for courseId
ALTER TABLE notification_attachments 
ADD CONSTRAINT fk_notification_attachments_course 
FOREIGN KEY (courseId) REFERENCES courses(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for courseId for better performance
ALTER TABLE notification_attachments 
ADD INDEX IF NOT EXISTS idx_notification_attachments_courseId (courseId);

SELECT 'CourseId column added to notification_attachments table successfully!' as status;
