-- Add Google Drive Integration table
-- This migration adds support for persistent Google Drive OAuth integration per user

CREATE TABLE IF NOT EXISTS `google_drive_integrations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `userId` BIGINT NOT NULL,
  `accessToken` TEXT NOT NULL,
  `refreshToken` TEXT,
  `tokenExpiry` DATETIME(3),
  `email` VARCHAR(255),
  `name` VARCHAR(255),
  `picture` VARCHAR(500),
  `scope` TEXT,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `lastSyncedAt` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_drive_integrations_uuid_key` (`uuid`),
  UNIQUE KEY `google_drive_integrations_userId_key` (`userId`),
  KEY `google_drive_integrations_userId_idx` (`userId`),
  KEY `google_drive_integrations_isActive_idx` (`isActive`),
  CONSTRAINT `google_drive_integrations_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

