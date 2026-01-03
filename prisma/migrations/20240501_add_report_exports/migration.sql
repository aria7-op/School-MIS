CREATE TABLE IF NOT EXISTS `report_export_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reportKey` VARCHAR(100) NOT NULL,
  `filters` JSON NOT NULL,
  `format` ENUM('CSV','PDF') NOT NULL DEFAULT 'CSV',
  `status` ENUM('QUEUED','PROCESSING','COMPLETED','FAILED','EXPIRED') NOT NULL DEFAULT 'QUEUED',
  `resultUrl` VARCHAR(500) NULL,
  `errorMessage` VARCHAR(500) NULL,
  `createdBy` BIGINT NULL,
  `schoolId` BIGINT NULL,
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_report_export_status` (`status`),
  KEY `idx_report_export_school` (`schoolId`),
  CONSTRAINT `report_export_jobs_school_fk` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report_schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reportKey` VARCHAR(100) NOT NULL,
  `filters` JSON NOT NULL,
  `format` ENUM('CSV','PDF') NOT NULL DEFAULT 'CSV',
  `frequency` ENUM('DAILY','WEEKLY','MONTHLY') NOT NULL DEFAULT 'DAILY',
  `cronExpression` VARCHAR(50) NULL,
  `recipients` JSON NOT NULL,
  `status` ENUM('ACTIVE','PAUSED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `lastRunAt` DATETIME(3) NULL,
  `nextRunAt` DATETIME(3) NULL,
  `createdBy` BIGINT NULL,
  `schoolId` BIGINT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_report_schedule_status` (`status`),
  KEY `idx_report_schedule_school` (`schoolId`),
  CONSTRAINT `report_schedules_school_fk` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `custom_reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(255) NULL,
  `reportKey` VARCHAR(100) NOT NULL,
  `metrics` JSON NOT NULL,
  `dimensions` JSON NOT NULL,
  `filters` JSON NOT NULL,
  `visualization` JSON NOT NULL,
  `isShared` TINYINT(1) NOT NULL DEFAULT 0,
  `createdBy` BIGINT NULL,
  `schoolId` BIGINT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `custom_reports_uuid_key` (`uuid`),
  KEY `idx_custom_reports_school` (`schoolId`),
  KEY `idx_custom_reports_owner` (`createdBy`),
  CONSTRAINT `custom_reports_school_fk` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `custom_reports_owner_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

