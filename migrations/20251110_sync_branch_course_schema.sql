-- Migration: Align courses and course manager tables with branch-aware schema
-- Date: 2025-11-10

-- 1. Add branchId column to courses (if missing) and create supporting index/FK
ALTER TABLE `courses`
  ADD COLUMN IF NOT EXISTS `branchId` BIGINT NULL AFTER `schoolId`;

ALTER TABLE `courses`
  ADD KEY IF NOT EXISTS `idx_courses_branchId` (`branchId`);

ALTER TABLE `courses`
  ADD CONSTRAINT `courses_branchId_fkey`
  FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Ensure course_manager_assignments has optional branch linkage
ALTER TABLE `course_manager_assignments`
  ADD COLUMN IF NOT EXISTS `branchId` BIGINT NULL AFTER `schoolId`;

ALTER TABLE `course_manager_assignments`
  ADD KEY IF NOT EXISTS `idx_course_manager_branchId` (`branchId`);

ALTER TABLE `course_manager_assignments`
  ADD CONSTRAINT `course_manager_assignments_branch_fkey`
  FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

