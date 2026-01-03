ALTER TABLE `notifications`
  ADD COLUMN `category` VARCHAR(50) NULL AFTER `type`,
  ADD COLUMN `subType` VARCHAR(100) NULL AFTER `category`,
  ADD COLUMN `audienceRoles` LONGTEXT NULL AFTER `ownerId`,
  ADD COLUMN `contextScope` VARCHAR(100) NULL AFTER `audienceRoles`,
  ADD COLUMN `source` VARCHAR(100) NULL AFTER `contextScope`;

ALTER TABLE `notification_recipients`
  ADD COLUMN `firstViewedAt` DATETIME NULL AFTER `readAt`,
  ADD COLUMN `acknowledgedAt` DATETIME NULL AFTER `firstViewedAt`,
  ADD COLUMN `dismissedAt` DATETIME NULL AFTER `acknowledgedAt`,
  ADD COLUMN `actionRequired` TINYINT(1) NOT NULL DEFAULT 0 AFTER `dismissedAt`,
  ADD COLUMN `followUpAt` DATETIME NULL AFTER `actionRequired`,
  ADD COLUMN `notes` LONGTEXT NULL AFTER `followUpAt`;

ALTER TABLE `notification_recipients`
  ADD INDEX `idx_notification_recipients_action` (`actionRequired`),
  ADD INDEX `idx_notification_recipients_follow_up` (`followUpAt`);

ALTER TABLE `notification_deliveries`
  ADD COLUMN `lastErrorAt` DATETIME NULL AFTER `errorMessage`;

-- Backfill existing rows with default metadata to avoid null handling edge-cases
UPDATE `notifications`
SET
  `category` = IFNULL(`category`, 'SYSTEM'),
  `subType` = IFNULL(`subType`, `type`),
  `audienceRoles` = IFNULL(`audienceRoles`, '[]'),
  `contextScope` = IFNULL(`contextScope`, 'school'),
  `source` = IFNULL(`source`, 'legacy')
WHERE `deletedAt` IS NULL;

UPDATE `notification_recipients`
SET
  `notes` = IFNULL(`notes`, '')
WHERE `notes` IS NULL;

-- Ensure indexes exist for new notification categorisation fields
ALTER TABLE `notifications`
  ADD INDEX `idx_notifications_category` (`category`),
  ADD INDEX `idx_notifications_subType` (`subType`),
  ADD INDEX `idx_notifications_context` (`contextScope`),
  ADD INDEX `idx_notifications_source` (`source`);















