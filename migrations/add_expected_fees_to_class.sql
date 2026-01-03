-- Add expectedFees column to classes table
ALTER TABLE classes ADD COLUMN expectedFees DECIMAL(10, 2) DEFAULT NULL AFTER classTeacherId;

-- Optional: Update existing classes with fees from fee structures
UPDATE classes c
LEFT JOIN fee_structures fs ON fs.classId = c.id AND fs.deletedAt IS NULL
LEFT JOIN (
    SELECT feeStructureId, SUM(amount) as total
    FROM fee_items
    WHERE deletedAt IS NULL AND isOptional = 0
    GROUP BY feeStructureId
) fi ON fi.feeStructureId = fs.id
SET c.expectedFees = fi.total
WHERE c.deletedAt IS NULL;

