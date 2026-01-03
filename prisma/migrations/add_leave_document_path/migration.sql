-- Add leaveDocumentPath column to attendances table
-- This stores the path to leave documents when status is EXCUSED

ALTER TABLE `attendances` ADD COLUMN `leaveDocumentPath` VARCHAR(500) NULL AFTER `remarks`;























