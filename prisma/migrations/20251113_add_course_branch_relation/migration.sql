-- Add optional branch reference to courses and backfill from existing classes

ALTER TABLE `courses`
  ADD COLUMN `branch_id` BIGINT NULL AFTER `schoolId`;

CREATE INDEX `courses_branch_id_idx` ON `courses`(`branch_id`);

ALTER TABLE `courses`
  ADD CONSTRAINT `courses_branch_id_fkey`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Backfill course branch assignments using the first class branch when available
UPDATE `courses` c
LEFT JOIN (
  SELECT `courseId`, MIN(`branchId`) AS `branch_id`
  FROM `classes`
  WHERE `branchId` IS NOT NULL
  GROUP BY `courseId`
) cb ON cb.`courseId` = c.`id`
SET c.`branch_id` = cb.`branch_id`
WHERE c.`branch_id` IS NULL AND cb.`branch_id` IS NOT NULL;

