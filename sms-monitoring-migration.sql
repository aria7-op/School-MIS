-- ============================================
-- SMS Monitoring Enhancement Migration
-- Adds source tracking and user tracking for SMS
-- ============================================

-- Step 1: Add smsInSource and smsInSentBy columns
ALTER TABLE `attendances` 
  ADD COLUMN `smsInSource` ENUM('AUTO', 'MANUAL') DEFAULT 'AUTO' AFTER `smsInRequestId`,
  ADD COLUMN `smsInSentBy` BIGINT NULL AFTER `smsInSource`;

-- Step 2: Add smsOutSource and smsOutSentBy columns
ALTER TABLE `attendances` 
  ADD COLUMN `smsOutSource` ENUM('AUTO', 'MANUAL') DEFAULT 'AUTO' AFTER `smsOutRequestId`,
  ADD COLUMN `smsOutSentBy` BIGINT NULL AFTER `smsOutSource`;

-- Step 3: Create indexes for better performance
CREATE INDEX `idx_attendances_smsInSource` ON `attendances`(`smsInSource`);
CREATE INDEX `idx_attendances_smsOutSource` ON `attendances`(`smsOutSource`);
CREATE INDEX `idx_attendances_smsInSentAt` ON `attendances`(`smsInSentAt`);
CREATE INDEX `idx_attendances_smsOutSentAt` ON `attendances`(`smsOutSentAt`);

-- Step 4: Verify the changes
DESCRIBE `attendances`;

-- Step 5: Check counts
SELECT 
  smsInStatus, 
  smsInSource,
  COUNT(*) as count 
FROM `attendances` 
WHERE date >= CURDATE() - INTERVAL 7 DAY
GROUP BY smsInStatus, smsInSource
ORDER BY smsInStatus, smsInSource;

-- Step 6: Show recent SMS activity
SELECT 
  id,
  studentId,
  date,
  smsInStatus,
  smsInSource,
  smsInSentAt,
  smsInError,
  smsOutStatus,
  smsOutSource,
  smsOutSentAt,
  smsOutError
FROM `attendances`
WHERE date >= CURDATE()
ORDER BY id DESC
LIMIT 10;

