-- Migration: Create Suggestion and Complaint System
-- Date: 2025-01-23
-- Description: Creates the suggestion_complaints table with all necessary relationships

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
  CONSTRAINT fk_suggestion_complaint_parent FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  CONSTRAINT fk_suggestion_complaint_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_suggestion_complaint_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_suggestion_complaint_responder FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_suggestion_complaint_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX idx_parent_id (parent_id),
  INDEX idx_student_id (student_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_recipient_type (recipient_type),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_school_id (school_id),
  INDEX idx_created_at (created_at),
  INDEX idx_suggestion_complaints_parent_status (parent_id, status),
  INDEX idx_suggestion_complaints_recipient_status (recipient_id, status),
  INDEX idx_suggestion_complaints_type_status (type, status),
  INDEX idx_suggestion_complaints_priority (priority),
  INDEX idx_suggestion_complaints_created_at_desc (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Stores suggestions and complaints from parents to teachers/admins';

-- Verify the table was created
SELECT 'Table suggestion_complaints created successfully!' as message;

-- Show table structure
DESCRIBE suggestion_complaints;



