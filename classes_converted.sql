-- Converted Classes SQL for Current Prisma Schema
-- This script creates classes and fee structures based on the original classes.sql
-- Adapted to match the current database schema structure

-- First, let's create the classes
-- Note: We need to get a valid schoolId and createdBy userId first

-- Assuming school ID is 1 and we have a user with ID 1 for createdBy
-- You may need to adjust these values based on your actual data

-- Create Classes
INSERT INTO classes (uuid, name, code, level, section, roomNumber, capacity, classTeacherId, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
-- High School Classes
(UUID(), 'Class 10', '10A', 10, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 9', '9A', 9, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 8', '8A', 8, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 8', '8B', 8, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 7', '7A', 7, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 7', '7B', 7, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),

-- Middle School Classes
(UUID(), 'Class 6', '6A', 6, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 6', '6B', 6, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 6', '6C', 6, 'C', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 5', '5A', 5, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 5', '5B', 5, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 5', '5C', 5, 'C', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 4', '4A', 4, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 4', '4B', 4, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 4', '4C', 4, 'C', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),

-- Primary School Classes
(UUID(), 'Class 3', '3A', 3, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 3', '3B', 3, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 2', '2A', 2, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 2', '2B', 2, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 1', '1A', 1, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 1', '1B', 1, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 1', '1C', 1, 'C', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),

-- Early Years
(UUID(), 'Prep', 'PREP-A', 0, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Prep', 'PREP-B', 0, 'B', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'KG', 'KG-A', -1, 'A', '', 12, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Now create fee structures for each class
-- We'll create a fee structure for each class with the appropriate fees

-- Get the class IDs we just created
SET @class10a_id = (SELECT id FROM classes WHERE code = '10A' AND schoolId = 1 LIMIT 1);
SET @class9a_id = (SELECT id FROM classes WHERE code = '9A' AND schoolId = 1 LIMIT 1);
SET @class8a_id = (SELECT id FROM classes WHERE code = '8A' AND schoolId = 1 LIMIT 1);
SET @class8b_id = (SELECT id FROM classes WHERE code = '8B' AND schoolId = 1 LIMIT 1);
SET @class7a_id = (SELECT id FROM classes WHERE code = '7A' AND schoolId = 1 LIMIT 1);
SET @class7b_id = (SELECT id FROM classes WHERE code = '7B' AND schoolId = 1 LIMIT 1);
SET @class6a_id = (SELECT id FROM classes WHERE code = '6A' AND schoolId = 1 LIMIT 1);
SET @class6b_id = (SELECT id FROM classes WHERE code = '6B' AND schoolId = 1 LIMIT 1);
SET @class6c_id = (SELECT id FROM classes WHERE code = '6C' AND schoolId = 1 LIMIT 1);
SET @class5a_id = (SELECT id FROM classes WHERE code = '5A' AND schoolId = 1 LIMIT 1);
SET @class5b_id = (SELECT id FROM classes WHERE code = '5B' AND schoolId = 1 LIMIT 1);
SET @class5c_id = (SELECT id FROM classes WHERE code = '5C' AND schoolId = 1 LIMIT 1);
SET @class4a_id = (SELECT id FROM classes WHERE code = '4A' AND schoolId = 1 LIMIT 1);
SET @class4b_id = (SELECT id FROM classes WHERE code = '4B' AND schoolId = 1 LIMIT 1);
SET @class4c_id = (SELECT id FROM classes WHERE code = '4C' AND schoolId = 1 LIMIT 1);
SET @class3a_id = (SELECT id FROM classes WHERE code = '3A' AND schoolId = 1 LIMIT 1);
SET @class3b_id = (SELECT id FROM classes WHERE code = '3B' AND schoolId = 1 LIMIT 1);
SET @class2a_id = (SELECT id FROM classes WHERE code = '2A' AND schoolId = 1 LIMIT 1);
SET @class2b_id = (SELECT id FROM classes WHERE code = '2B' AND schoolId = 1 LIMIT 1);
SET @class1a_id = (SELECT id FROM classes WHERE code = '1A' AND schoolId = 1 LIMIT 1);
SET @class1b_id = (SELECT id FROM classes WHERE code = '1B' AND schoolId = 1 LIMIT 1);
SET @class1c_id = (SELECT id FROM classes WHERE code = '1C' AND schoolId = 1 LIMIT 1);
SET @prepa_id = (SELECT id FROM classes WHERE code = 'PREP-A' AND schoolId = 1 LIMIT 1);
SET @prepb_id = (SELECT id FROM classes WHERE code = 'PREP-B' AND schoolId = 1 LIMIT 1);
SET @kga_id = (SELECT id FROM classes WHERE code = 'KG-A' AND schoolId = 1 LIMIT 1);

-- Create Fee Structures for Classes 10, 9, 8, 7 (1800 fee)
INSERT INTO fee_structures (uuid, name, description, classId, isDefault, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), 'Class 10A Fee Structure', 'Standard fee structure for Class 10A', @class10a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 9A Fee Structure', 'Standard fee structure for Class 9A', @class9a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 8A Fee Structure', 'Standard fee structure for Class 8A', @class8a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 8B Fee Structure', 'Standard fee structure for Class 8B', @class8b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 7A Fee Structure', 'Standard fee structure for Class 7A', @class7a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 7B Fee Structure', 'Standard fee structure for Class 7B', @class7b_id, true, 1, 1, NULL, NOW(), NOW(), NULL);

-- Create Fee Structures for Classes 6, 5, 4 (1500 fee)
INSERT INTO fee_structures (uuid, name, description, classId, isDefault, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), 'Class 6A Fee Structure', 'Standard fee structure for Class 6A', @class6a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 6B Fee Structure', 'Standard fee structure for Class 6B', @class6b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 6C Fee Structure', 'Standard fee structure for Class 6C', @class6c_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 5A Fee Structure', 'Standard fee structure for Class 5A', @class5a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 5B Fee Structure', 'Standard fee structure for Class 5B', @class5b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 5C Fee Structure', 'Standard fee structure for Class 5C', @class5c_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 4A Fee Structure', 'Standard fee structure for Class 4A', @class4a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 4B Fee Structure', 'Standard fee structure for Class 4B', @class4b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 4C Fee Structure', 'Standard fee structure for Class 4C', @class4c_id, true, 1, 1, NULL, NOW(), NOW(), NULL);

-- Create Fee Structures for Classes 3, 2, 1 (1200 fee)
INSERT INTO fee_structures (uuid, name, description, classId, isDefault, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), 'Class 3A Fee Structure', 'Standard fee structure for Class 3A', @class3a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 3B Fee Structure', 'Standard fee structure for Class 3B', @class3b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 2A Fee Structure', 'Standard fee structure for Class 2A', @class2a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 2B Fee Structure', 'Standard fee structure for Class 2B', @class2b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 1A Fee Structure', 'Standard fee structure for Class 1A', @class1a_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 1B Fee Structure', 'Standard fee structure for Class 1B', @class1b_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Class 1C Fee Structure', 'Standard fee structure for Class 1C', @class1c_id, true, 1, 1, NULL, NOW(), NOW(), NULL);

-- Create Fee Structures for Prep and KG (1200 and 1000 fees)
INSERT INTO fee_structures (uuid, name, description, classId, isDefault, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), 'Prep A Fee Structure', 'Standard fee structure for Prep A', @prepa_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'Prep B Fee Structure', 'Standard fee structure for Prep B', @prepb_id, true, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), 'KG A Fee Structure', 'Standard fee structure for KG A', @kga_id, true, 1, 1, NULL, NOW(), NOW(), NULL);

-- Now create fee items for each fee structure
-- Get the fee structure IDs
SET @fs_10a_id = (SELECT id FROM fee_structures WHERE classId = @class10a_id AND schoolId = 1 LIMIT 1);
SET @fs_9a_id = (SELECT id FROM fee_structures WHERE classId = @class9a_id AND schoolId = 1 LIMIT 1);
SET @fs_8a_id = (SELECT id FROM fee_structures WHERE classId = @class8a_id AND schoolId = 1 LIMIT 1);
SET @fs_8b_id = (SELECT id FROM fee_structures WHERE classId = @class8b_id AND schoolId = 1 LIMIT 1);
SET @fs_7a_id = (SELECT id FROM fee_structures WHERE classId = @class7a_id AND schoolId = 1 LIMIT 1);
SET @fs_7b_id = (SELECT id FROM fee_structures WHERE classId = @class7b_id AND schoolId = 1 LIMIT 1);
SET @fs_6a_id = (SELECT id FROM fee_structures WHERE classId = @class6a_id AND schoolId = 1 LIMIT 1);
SET @fs_6b_id = (SELECT id FROM fee_structures WHERE classId = @class6b_id AND schoolId = 1 LIMIT 1);
SET @fs_6c_id = (SELECT id FROM fee_structures WHERE classId = @class6c_id AND schoolId = 1 LIMIT 1);
SET @fs_5a_id = (SELECT id FROM fee_structures WHERE classId = @class5a_id AND schoolId = 1 LIMIT 1);
SET @fs_5b_id = (SELECT id FROM fee_structures WHERE classId = @class5b_id AND schoolId = 1 LIMIT 1);
SET @fs_5c_id = (SELECT id FROM fee_structures WHERE classId = @class5c_id AND schoolId = 1 LIMIT 1);
SET @fs_4a_id = (SELECT id FROM fee_structures WHERE classId = @class4a_id AND schoolId = 1 LIMIT 1);
SET @fs_4b_id = (SELECT id FROM fee_structures WHERE classId = @class4b_id AND schoolId = 1 LIMIT 1);
SET @fs_4c_id = (SELECT id FROM fee_structures WHERE classId = @class4c_id AND schoolId = 1 LIMIT 1);
SET @fs_3a_id = (SELECT id FROM fee_structures WHERE classId = @class3a_id AND schoolId = 1 LIMIT 1);
SET @fs_3b_id = (SELECT id FROM fee_structures WHERE classId = @class3b_id AND schoolId = 1 LIMIT 1);
SET @fs_2a_id = (SELECT id FROM fee_structures WHERE classId = @class2a_id AND schoolId = 1 LIMIT 1);
SET @fs_2b_id = (SELECT id FROM fee_structures WHERE classId = @class2b_id AND schoolId = 1 LIMIT 1);
SET @fs_1a_id = (SELECT id FROM fee_structures WHERE classId = @class1a_id AND schoolId = 1 LIMIT 1);
SET @fs_1b_id = (SELECT id FROM fee_structures WHERE classId = @class1b_id AND schoolId = 1 LIMIT 1);
SET @fs_1c_id = (SELECT id FROM fee_structures WHERE classId = @class1c_id AND schoolId = 1 LIMIT 1);
SET @fs_prepa_id = (SELECT id FROM fee_structures WHERE classId = @prepa_id AND schoolId = 1 LIMIT 1);
SET @fs_prepb_id = (SELECT id FROM fee_structures WHERE classId = @prepb_id AND schoolId = 1 LIMIT 1);
SET @fs_kga_id = (SELECT id FROM fee_structures WHERE classId = @kga_id AND schoolId = 1 LIMIT 1);

-- Create fee items for Classes 10, 9, 8, 7 (1800 + uniform 500 + book 1500 + transport 1000)
-- Class 10A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_10a_id, 'Tuition Fee', 1800.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_10a_id, 'Uniform Fee', 500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_10a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_10a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 9A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_9a_id, 'Tuition Fee', 1800.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_9a_id, 'Uniform Fee', 500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_9a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_9a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 8A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_8a_id, 'Tuition Fee', 1800.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_8a_id, 'Uniform Fee', 500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_8a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_8a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 8B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_8b_id, 'Tuition Fee', 1800.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_8b_id, 'Uniform Fee', 500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_8b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_8b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 7A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_7a_id, 'Tuition Fee', 1800.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_7a_id, 'Uniform Fee', 500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_7a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_7a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 7B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_7b_id, 'Tuition Fee', 1800.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_7b_id, 'Uniform Fee', 500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_7b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_7b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Create fee items for Classes 6, 5, 4 (1500 + uniform 0 + book 1500 + transport 1000)
-- Class 6A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_6a_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6a_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 6B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_6b_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6b_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 6C
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_6c_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6c_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6c_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_6c_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 5A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_5a_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5a_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 5B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_5b_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5b_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 5C
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_5c_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5c_id, 'Uniform Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5c_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5c_id, 'Transportation Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 4A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_4a_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4a_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 4B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_4b_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4b_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 4C
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_4c_id, 'Tuition Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4c_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4c_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_4c_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Create fee items for Classes 3, 2, 1 (1200 + uniform 0 + book 1500 + transport 1000)
-- Class 3A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_3a_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_3a_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_3a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_3a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 3B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_5b_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5b_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_5b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 2A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_2a_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_2a_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_2a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_2a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 2B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_2b_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_2b_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_2b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_2b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 1A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_1a_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1a_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1a_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1a_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 1B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_1b_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1b_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1b_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1b_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Class 1C
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_1c_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1c_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1c_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_1c_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Create fee items for Prep and KG
-- Prep A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_prepa_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_prepa_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_prepa_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_prepa_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Prep B
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_prepb_id, 'Tuition Fee', 1200.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_prepb_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_prepb_id, 'Book Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_prepb_id, 'Transportation Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- KG A
INSERT INTO fee_items (uuid, feeStructureId, name, amount, isOptional, dueDate, schoolId, createdBy, updatedBy, createdAt, updatedAt, deletedAt) VALUES
(UUID(), @fs_kga_id, 'Tuition Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_kga_id, 'Uniform Fee', 0.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_kga_id, 'Book Fee', 1500.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL),
(UUID(), @fs_kga_id, 'Transportation Fee', 1000.00, false, NULL, 1, 1, NULL, NOW(), NOW(), NULL);

-- Summary of what was created:
-- 1. 25 classes (10A, 9A, 8A, 8B, 7A, 7B, 6A, 6B, 6C, 5A, 5B, 5C, 4A, 4B, 4C, 3A, 3B, 2A, 2B, 1A, 1B, 1C, Prep-A, Prep-B, KG-A)
-- 2. 25 fee structures (one for each class)
-- 3. 100 fee items (4 for each class: Tuition, Uniform, Book, Transportation)

-- Fee Structure:
-- Classes 10, 9, 8, 7: Tuition 1800 + Uniform 500 + Book 1500 + Transport 1000 = Total 4800
-- Classes 6, 5, 4: Tuition 1500 + Uniform 0 + Book 1500 + Transport 1000 = Total 4000  
-- Classes 3, 2, 1: Tuition 1200 + Uniform 0 + Book 1500 + Transport 1000 = Total 3700
-- Prep A: Tuition 1200 + Uniform 0 + Book 1500 + Transport 1000 = Total 3700
-- Prep B: Tuition 1200 + Uniform 0 + Book 0 + Transport 0 = Total 1200
-- KG A: Tuition 1000 + Uniform 0 + Book 1500 + Transport 1000 = Total 3500

-- Note: You may need to adjust the schoolId and createdBy values based on your actual data
-- Also, some classes have special fee arrangements (like Class 5C with uniform 1000 and transport 1500) 