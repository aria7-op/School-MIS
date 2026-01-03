-- Migration: Add Suggestion/Complaint System
-- Description: Creates tables and enums for the suggestion/complaint system
-- Date: 2024-01-20

-- Add new enums
ALTER TABLE suggestion_complaints ADD COLUMN IF NOT EXISTS recipient_type ENUM('TEACHER', 'ADMIN') NOT NULL;
ALTER TABLE suggestion_complaints ADD COLUMN IF NOT EXISTS type ENUM('SUGGESTION', 'COMPLAINT') NOT NULL;
ALTER TABLE suggestion_complaints ADD COLUMN IF NOT EXISTS priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM';
ALTER TABLE suggestion_complaints ADD COLUMN IF NOT EXISTS status ENUM('SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'RESOLVED', 'CLOSED') DEFAULT 'SUBMITTED';

-- Create the suggestion_complaints table
CREATE TABLE IF NOT EXISTS suggestion_complaints (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE DEFAULT (UUID()),
  parent_id BIGINT NOT NULL,
  student_id BIGINT NULL,
  recipient_id BIGINT NOT NULL,
  recipient_type ENUM('TEACHER', 'ADMIN') NOT NULL,
  type ENUM('SUGGESTION', 'COMPLAINT') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NULL,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
  status ENUM('SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'RESOLVED', 'CLOSED') DEFAULT 'SUBMITTED',
  response TEXT NULL,
  responded_at DATETIME NULL,
  responder_id BIGINT NULL,
  school_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  -- Foreign key constraints
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_parent_id (parent_id),
  INDEX idx_student_id (student_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_recipient_type (recipient_type),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_school_id (school_id),
  INDEX idx_created_at (created_at)
);

-- Add relations to existing tables
-- Note: These relations are handled by Prisma, but we can add them here for reference
-- ALTER TABLE parents ADD COLUMN suggestions_complaints_count INT DEFAULT 0;
-- ALTER TABLE students ADD COLUMN suggestions_complaints_count INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN suggestions_complaints_received_count INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN suggestions_complaints_responded_count INT DEFAULT 0;
-- ALTER TABLE schools ADD COLUMN suggestions_complaints_count INT DEFAULT 0;

-- Insert sample data (optional - for testing)
-- INSERT INTO suggestion_complaints (
--   parent_id, student_id, recipient_id, recipient_type, type, title, description, 
--   category, priority, status, school_id
-- ) VALUES (
--   1, 1, 1, 'TEACHER', 'SUGGESTION', 'Test Suggestion', 'This is a test suggestion', 
--   'academic', 'MEDIUM', 'SUBMITTED', 1
-- );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suggestion_complaints_parent_status ON suggestion_complaints(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_suggestion_complaints_recipient_status ON suggestion_complaints(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_suggestion_complaints_type_status ON suggestion_complaints(type, status);
CREATE INDEX IF NOT EXISTS idx_suggestion_complaints_priority ON suggestion_complaints(priority);
CREATE INDEX IF NOT EXISTS idx_suggestion_complaints_created_at_desc ON suggestion_complaints(created_at DESC);

-- Add comments for documentation
ALTER TABLE suggestion_complaints COMMENT = 'Stores suggestions and complaints from parents to teachers/admins';
ALTER TABLE suggestion_complaints MODIFY COLUMN recipient_type ENUM('TEACHER', 'ADMIN') NOT NULL COMMENT 'Type of recipient (TEACHER = SCHOOL_ADMIN role, ADMIN = TEACHER role)';
ALTER TABLE suggestion_complaints MODIFY COLUMN type ENUM('SUGGESTION', 'COMPLAINT') NOT NULL COMMENT 'Type of message';
ALTER TABLE suggestion_complaints MODIFY COLUMN priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM' COMMENT 'Priority level';
ALTER TABLE suggestion_complaints MODIFY COLUMN status ENUM('SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'RESOLVED', 'CLOSED') DEFAULT 'SUBMITTED' COMMENT 'Current status of the suggestion/complaint';


