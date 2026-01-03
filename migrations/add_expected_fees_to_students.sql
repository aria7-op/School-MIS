-- Add expectedFees column to students table
ALTER TABLE students ADD COLUMN expectedFees DECIMAL(10, 2) DEFAULT NULL AFTER currentPostalCode;

-- Optional: Copy expected fees from class to all students in that class
UPDATE students s
INNER JOIN classes c ON s.classId = c.id
SET s.expectedFees = c.expectedFees
WHERE s.deletedAt IS NULL 
  AND c.deletedAt IS NULL 
  AND c.expectedFees IS NOT NULL;

