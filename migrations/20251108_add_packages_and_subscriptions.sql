-- Migration: Add packages and school subscriptions for multi-tenant architecture
-- Date: 2025-11-08

-- 1. Extend enums for users.role and schools.status
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM(
    'SUPER_ADMIN',
    'SUPER_DUPER_ADMIN',
    'SCHOOL_ADMIN',
    'TEACHER',
    'STUDENT',
    'STAFF',
    'PARENT',
    'ACCOUNTANT',
    'LIBRARIAN',
    'CRM_MANAGER'
  ) NOT NULL;

ALTER TABLE `schools`
  MODIFY COLUMN `status` ENUM(
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'SUSPENDED',
    'DEACTIVATED'
  ) NOT NULL DEFAULT 'ACTIVE';

-- 2. Add new columns to schools for subscriptions and tenant metadata
ALTER TABLE `schools`
  ADD COLUMN `subscriptionId` BIGINT NULL AFTER `ownerId`,
  ADD COLUMN `superAdminUserId` BIGINT NULL AFTER `subscriptionId`,
  ADD COLUMN `settings` JSON NULL AFTER `deletedAt`,
  ADD COLUMN `tenantId` VARCHAR(64) NULL AFTER `settings`;

-- 3. Create packages table
CREATE TABLE `packages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `priceMonthly` DECIMAL(10,2) NOT NULL,
  `priceYearly` DECIMAL(10,2) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `features` JSON NOT NULL,
  `supportLevel` VARCHAR(50) NULL,
  `createdBy` BIGINT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `packages_uuid_key` (`uuid`),
  UNIQUE KEY `packages_name_key` (`name`),
  KEY `idx_packages_isActive` (`isActive`),
  KEY `idx_packages_supportLevel` (`supportLevel`),
  CONSTRAINT `fk_packages_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create school_subscriptions table
CREATE TABLE `school_subscriptions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `schoolId` BIGINT NOT NULL,
  `packageId` BIGINT NOT NULL,
  `status` ENUM('ACTIVE','SUSPENDED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `startedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `autoRenew` TINYINT(1) NOT NULL DEFAULT 0,
  `currentUsage` JSON NULL,
  `paymentStatus` VARCHAR(30) NULL,
  `lastPaymentDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `school_subscriptions_uuid_key` (`uuid`),
  KEY `idx_school_subscriptions_schoolId` (`schoolId`),
  KEY `idx_school_subscriptions_packageId` (`packageId`),
  KEY `idx_school_subscriptions_status` (`status`),
  KEY `idx_school_subscriptions_expiresAt` (`expiresAt`),
  CONSTRAINT `fk_school_subscriptions_school` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_school_subscriptions_package` FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Add foreign keys & indexes for new school columns
ALTER TABLE `schools`
  ADD CONSTRAINT `fk_schools_subscriptionId` FOREIGN KEY (`subscriptionId`) REFERENCES `school_subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_schools_superAdminUserId` FOREIGN KEY (`superAdminUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `schools_subscriptionId_idx` ON `schools`(`subscriptionId`);
CREATE INDEX `schools_superAdminUserId_idx` ON `schools`(`superAdminUserId`);
CREATE UNIQUE INDEX `schools_tenantId_key` ON `schools`(`tenantId`);

