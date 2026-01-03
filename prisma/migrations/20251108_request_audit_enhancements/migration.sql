-- Enhance audit_logs table with request/response level metadata

ALTER TABLE `audit_logs`
  ADD COLUMN `requestMethod` VARCHAR(10) NULL AFTER `userAgent`,
  ADD COLUMN `requestPath` VARCHAR(255) NULL AFTER `requestMethod`,
  ADD COLUMN `requestUrl` VARCHAR(512) NULL AFTER `requestPath`,
  ADD COLUMN `requestHeaders` JSON NULL AFTER `requestUrl`,
  ADD COLUMN `requestQuery` JSON NULL AFTER `requestHeaders`,
  ADD COLUMN `requestBody` JSON NULL AFTER `requestQuery`,
  ADD COLUMN `responseStatus` INTEGER NULL AFTER `requestBody`,
  ADD COLUMN `responseTimeMs` INTEGER NULL AFTER `responseStatus`,
  ADD COLUMN `isSuccess` BOOLEAN NULL DEFAULT TRUE AFTER `responseTimeMs`,
  ADD COLUMN `errorMessage` LONGTEXT NULL AFTER `isSuccess`,
  ADD COLUMN `correlationId` VARCHAR(64) NULL AFTER `errorMessage`,
  ADD COLUMN `traceId` VARCHAR(64) NULL AFTER `correlationId`;

CREATE INDEX `AuditLog_requestMethod_idx` ON `audit_logs`(`requestMethod`);
CREATE INDEX `AuditLog_responseStatus_idx` ON `audit_logs`(`responseStatus`);
CREATE INDEX `AuditLog_isSuccess_idx` ON `audit_logs`(`isSuccess`);

