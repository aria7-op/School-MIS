-- Migration: Add Excel Grade Headers Table
-- Date: 2025-11-15
-- Purpose: Persist Student List tab inputs (آمر مکتب، مدیر تدریسی، سرمعلم، هیئت) per class & exam type

CREATE TABLE IF NOT EXISTS `excel_grade_headers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `classId` BIGINT NOT NULL,
  `examId` BIGINT NULL,
  `examType` ENUM('MIDTERM','FINAL','QUIZ','ASSIGNMENT','PROJECT','PRACTICAL') NOT NULL,
  `schoolId` BIGINT NOT NULL,
  `data` JSON NOT NULL DEFAULT (JSON_OBJECT()),
  `createdBy` BIGINT NULL,
  `updatedBy` BIGINT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `excel_grade_headers_classId_examType_schoolId_key` (`classId`, `examType`, `schoolId`),
  KEY `excel_grade_headers_examId_idx` (`examId`),
  KEY `excel_grade_headers_schoolId_idx` (`schoolId`),
  CONSTRAINT `excel_grade_headers_class_fk` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `excel_grade_headers_exam_fk` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `excel_grade_headers_school_fk` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification
SELECT 'excel_grade_headers table created' AS status, COUNT(*) AS existing_rows FROM `excel_grade_headers`;

