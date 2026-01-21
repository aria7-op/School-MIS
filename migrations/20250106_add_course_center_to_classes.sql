-- Migration: Add courseCenterId to classes table
-- Date: 2025-01-06

-- Add courseCenterId column to classes table
ALTER TABLE `classes`
  ADD COLUMN IF NOT EXISTS `courseCenterId` BIGINT NULL AFTER `courseId`;

-- Add index for courseCenterId
ALTER TABLE `classes`
  ADD KEY IF NOT EXISTS `idx_classes_courseCenterId` (`courseCenterId`);

-- Add foreign key constraint
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_courseCenterId_fkey`
    FOREIGN KEY (`courseCenterId`) REFERENCES `course_centers`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
