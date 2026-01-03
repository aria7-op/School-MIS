-- Migration: Add supervisorId to Class model
-- Date: 2025-01-XX
-- Purpose: Allow assigning one supervisor (نگران صنف) per class from teachers

-- Add supervisorId column to classes table
ALTER TABLE `classes` 
  ADD COLUMN `supervisorId` BIGINT NULL COMMENT 'نگران صنف (Class Supervisor) - Only 1 supervisor per class' AFTER `classTeacherId`;

-- Add foreign key constraint
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_supervisorId_fkey` 
  FOREIGN KEY (`supervisorId`) 
  REFERENCES `teachers`(`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Add index for faster lookups
ALTER TABLE `classes` 
  ADD INDEX `idx_classes_supervisorId` (`supervisorId`);

-- Verification query
SELECT 
  'Classes with supervisor assigned' as description,
  COUNT(*) as count 
FROM `classes` 
WHERE `supervisorId` IS NOT NULL 
  AND `deletedAt` IS NULL;

-- Display sample data
SELECT 
  c.id as classId,
  c.name as className,
  c.code as classCode,
  t.id as supervisorId,
  u.firstName as supervisorFirstName,
  u.lastName as supervisorLastName
FROM `classes` c
LEFT JOIN `teachers` t ON c.supervisorId = t.id
LEFT JOIN `users` u ON t.userId = u.id
WHERE c.deletedAt IS NULL
  AND c.supervisorId IS NOT NULL
ORDER BY c.createdAt DESC
LIMIT 10;

-- Success message
SELECT 'Migration completed successfully! Supervisor assignment feature added.' as message;

