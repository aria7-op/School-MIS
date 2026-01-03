-- Create assignment_parent_notes table for storing parent notes and teacher responses
CREATE TABLE IF NOT EXISTS `assignment_parent_notes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `assignmentId` BIGINT NOT NULL,
  `parentId` BIGINT NOT NULL,
  `studentId` BIGINT NULL,
  `note` TEXT NOT NULL,
  `teacherResponse` TEXT NULL,
  `teacherResponseAt` DATETIME NULL,
  `teacherResponderId` BIGINT NULL,
  `acknowledgedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `schoolId` BIGINT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_parent_notes_uuid_key` (`uuid`),
  INDEX `assignment_parent_notes_assignmentId_idx` (`assignmentId`),
  INDEX `assignment_parent_notes_parentId_idx` (`parentId`),
  INDEX `assignment_parent_notes_studentId_idx` (`studentId`),
  INDEX `assignment_parent_notes_schoolId_idx` (`schoolId`),
  INDEX `assignment_parent_notes_teacherResponderId_idx` (`teacherResponderId`),
  CONSTRAINT `assignment_parent_notes_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignment_parent_notes_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignment_parent_notes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `assignment_parent_notes_teacherResponderId_fkey` FOREIGN KEY (`teacherResponderId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `assignment_parent_notes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



