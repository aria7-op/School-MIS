-- Migration: Extend user roles with branch and course managers
-- Date: 2025-11-09

-- 0. Core tables for branches, courses, and class bindings
CREATE TABLE IF NOT EXISTS `branches` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `shortName` VARCHAR(50) NULL,
  `type` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `email` VARCHAR(150) NULL,
  `phone` VARCHAR(20) NULL,
  `alternatePhone` VARCHAR(20) NULL,
  `addressLine1` VARCHAR(255) NULL,
  `addressLine2` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `postalCode` VARCHAR(20) NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `isMain` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `openedDate` DATETIME NULL,
  `metadata` JSON NULL,
  `schoolId` BIGINT NOT NULL,
  `createdBy` BIGINT NOT NULL,
  `updatedBy` BIGINT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_uuid_key` (`uuid`),
  UNIQUE KEY `branches_schoolId_code_key` (`schoolId`, `code`),
  KEY `idx_branches_schoolId` (`schoolId`),
  KEY `idx_branches_status` (`status`),
  CONSTRAINT `branches_schoolId_fkey`
    FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `type` ENUM('CORE','ELECTIVE','ENRICHMENT','REMEDIAL','EXTRACURRICULAR','ONLINE') NOT NULL,
  `description` TEXT NULL,
  `summary` TEXT NULL,
  `objectives` JSON NULL,
  `creditHours` INT NULL,
  `level` INT NULL,
  `durationWeeks` INT NULL,
  `deliveryMode` VARCHAR(30) NULL,
  `language` VARCHAR(20) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `isPublished` TINYINT(1) NOT NULL DEFAULT 0,
  `enrollmentCap` INT NULL,
  `schoolId` BIGINT NOT NULL,
  `departmentId` BIGINT NULL,
  `metadata` JSON NULL,
  `createdBy` BIGINT NOT NULL,
  `updatedBy` BIGINT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_uuid_key` (`uuid`),
  UNIQUE KEY `courses_schoolId_code_key` (`schoolId`, `code`),
  KEY `idx_courses_schoolId` (`schoolId`),
  KEY `idx_courses_departmentId` (`departmentId`),
  KEY `idx_courses_type` (`type`),
  CONSTRAINT `courses_schoolId_fkey`
    FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `courses_departmentId_fkey`
    FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `classes`
  ADD COLUMN IF NOT EXISTS `courseId` BIGINT NULL AFTER `schoolId`;

ALTER TABLE `classes`
  ADD KEY IF NOT EXISTS `classes_courseId_idx` (`courseId`);

ALTER TABLE `classes`
  ADD CONSTRAINT `classes_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 1. Extend users.role enum to include new manager roles
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
    'CRM_MANAGER',
    'BRANCH_MANAGER',
    'COURSE_MANAGER'
  ) NOT NULL;

-- 2. Seed system roles for new manager types if they do not already exist
INSERT INTO `roles` (
  `uuid`, `name`, `description`, `type`, `isActive`, `isSystem`, `isDefault`,
  `priority`, `createdAt`, `updatedAt`
)
SELECT
  UUID(),
  'Branch Manager',
  'Manages day-to-day operations for an individual branch.',
  'BRANCH_MANAGER',
  1, 1, 0,
  60,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `type` = 'BRANCH_MANAGER'
    AND `isSystem` = 1
    AND `schoolId` IS NULL
    AND `ownerId` IS NULL
);

-- 3. Create manager assignment tables (only if they do not already exist)
CREATE TABLE IF NOT EXISTS `branch_manager_assignments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `schoolId` BIGINT NOT NULL,
  `branchId` BIGINT NOT NULL,
  `userId` BIGINT NOT NULL,
  `assignedBy` BIGINT NULL,
  `assignedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revokedAt` DATETIME NULL,
  `metadata` JSON NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_manager_assignments_uuid_key` (`uuid`),
  UNIQUE KEY `branch_manager_unique_assignment` (`branchId`, `userId`),
  KEY `idx_branch_manager_schoolId` (`schoolId`),
  KEY `idx_branch_manager_branchId` (`branchId`),
  KEY `idx_branch_manager_userId` (`userId`),
  CONSTRAINT `branch_manager_assignments_school_fkey`
    FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `branch_manager_assignments_branch_fkey`
    FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `branch_manager_assignments_user_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `branch_manager_assignments_assignedBy_fkey`
    FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_manager_assignments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `schoolId` BIGINT NOT NULL,
  `courseId` BIGINT NOT NULL,
  `userId` BIGINT NOT NULL,
  `assignedBy` BIGINT NULL,
  `assignedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revokedAt` DATETIME NULL,
  `metadata` JSON NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_manager_assignments_uuid_key` (`uuid`),
  UNIQUE KEY `course_manager_unique_assignment` (`courseId`, `userId`),
  KEY `idx_course_manager_schoolId` (`schoolId`),
  KEY `idx_course_manager_courseId` (`courseId`),
  KEY `idx_course_manager_userId` (`userId`),
  CONSTRAINT `course_manager_assignments_school_fkey`
    FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_manager_assignments_course_fkey`
    FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_manager_assignments_user_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_manager_assignments_assignedBy_fkey`
    FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (
  `uuid`, `name`, `description`, `type`, `isActive`, `isSystem`, `isDefault`,
  `priority`, `createdAt`, `updatedAt`
)
SELECT
  UUID(),
  'Course Manager',
  'Oversees course catalog, sections, and curriculum planning.',
  'COURSE_MANAGER',
  1, 1, 0,
  65,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `roles`
  WHERE `type` = 'COURSE_MANAGER'
    AND `isSystem` = 1
    AND `schoolId` IS NULL
    AND `ownerId` IS NULL
);

