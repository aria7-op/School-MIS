CREATE TABLE IF NOT EXISTS `log_daily_rollups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `schoolId` BIGINT NOT NULL,
  `totalEvents` INT NOT NULL DEFAULT 0,
  `successEvents` INT NOT NULL DEFAULT 0,
  `warningEvents` INT NOT NULL DEFAULT 0,
  `errorEvents` INT NOT NULL DEFAULT 0,
  `averageLatencyMs` DOUBLE NULL,
  `topActions` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `log_daily_rollups_schoolId_date_key` (`schoolId`, `date`),
  KEY `log_daily_rollups_date_idx` (`date`),
  KEY `log_daily_rollups_schoolId_idx` (`schoolId`),
  CONSTRAINT `log_daily_rollups_school_fk`
    FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

