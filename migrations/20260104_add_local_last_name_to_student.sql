-- Migration: Add localLastName field to Student table
-- Date: 2026-01-04
-- Description: Adds a localLastName field to store student's last name in local language

-- Add localLastName column to students table
ALTER TABLE students 
ADD COLUMN localLastName VARCHAR(50) NULL AFTER parentId;

-- Add index for better search performance (optional)
CREATE INDEX idx_students_local_last_name ON students(localLastName);

-- Migration completed successfully
