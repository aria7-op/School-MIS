-- Add school_id column to message_attachments if it does not already exist
ALTER TABLE `message_attachments`
  ADD COLUMN IF NOT EXISTS `school_id` BIGINT NULL AFTER `metadata`;

-- Create index for the new column to align with Prisma schema expectations
CREATE INDEX IF NOT EXISTS `message_attachments_school_id_idx`
  ON `message_attachments` (`school_id`);

-- Add the foreign key constraint referencing schools table (cascade updates, restrict deletes)
ALTER TABLE `message_attachments`
  ADD CONSTRAINT `message_attachments_school_id_fkey`
    FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

