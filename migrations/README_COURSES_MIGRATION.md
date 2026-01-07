# Courses Table Migration Guide

## Overview
This migration converts the `courses` table to support the new Education Center schema as defined in `course_center_schema.md`.

## Files
- `alter_courses_to_center_schema.sql` - Main migration SQL script

## What This Migration Does

### Adds New Fields:
1. `focusArea` (VARCHAR 100) - Primary educational focus
2. `centerType` (VARCHAR 50) - Type of center (ACADEMIC, VOCATIONAL, LANGUAGE, etc.)
3. `targetAudience` (VARCHAR 50) - Target group (PRIMARY, SECONDARY, ADULT, ALL_AGES)
4. `isAccredited` (TINYINT) - Accreditation status
5. `enrollmentOpen` (TINYINT) - Whether accepting enrollments
6. `centerManagerId` (BIGINT) - Manager user ID
7. `operatingHours` (VARCHAR 100) - Operating hours string
8. `scheduleType` (VARCHAR 30) - Schedule pattern
9. `budget` (DECIMAL 12,2) - Annual budget
10. `resources` (JSON) - Facilities and equipment
11. `policies` (JSON) - Rules and policies

### Adds Indexes:
- `idx_courses_centerType`
- `idx_courses_targetAudience`
- `idx_courses_scheduleType`
- `idx_courses_isAccredited`
- `idx_courses_enrollmentOpen`
- `idx_courses_centerManagerId`

### Adds Foreign Key:
- `fk_courses_centerManagerId` → `users(id)`

## Before Running Migration

### 1. Backup Your Database
```bash
# MySQL
mysqldump -u username -p database_name courses > courses_backup.sql

# Or backup entire database
mysqldump -u username -p database_name > full_backup.sql
```

### 2. Check Current Table Structure
```sql
DESCRIBE courses;
SHOW CREATE TABLE courses;
```

### 3. Check for Existing Data
```sql
SELECT COUNT(*) as total_courses FROM courses;
SELECT * FROM courses LIMIT 5;
```

## Running the Migration

### Option 1: Run the entire script
```bash
mysql -u username -p database_name < alter_courses_to_center_schema.sql
```

### Option 2: Run step by step (Recommended)
1. Open MySQL client or phpMyAdmin
2. Copy and paste each section from the SQL file
3. Run one section at a time
4. Verify results after each section

### Option 3: Using a migration tool
```bash
# If using a Node.js migration tool
npm run migrate up alter_courses_to_center_schema
```

## Post-Migration Steps

### 1. Verify Table Structure
```sql
DESCRIBE courses;
```

Expected output should include all new fields.

### 2. Check Indexes
```sql
SHOW INDEX FROM courses;
```

### 3. Verify Foreign Keys
```sql
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'courses' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 4. Test Inserting Data
```sql
INSERT INTO courses (
    uuid,
    name,
    code,
    focusArea,
    centerType,
    targetAudience,
    isActive,
    isAccredited,
    enrollmentOpen,
    operatingHours,
    scheduleType,
    budget,
    schoolId,
    createdBy
) VALUES (
    UUID(),
    'English Language Learning Center',
    'LANG-ENG-01',
    'Language Studies - English',
    'LANGUAGE',
    'ALL_AGES',
    1,
    1,
    1,
    '9AM-9PM Daily (6 days/week)',
    'FLEXIBLE',
    150000.00,
    1,
    1
);
```

### 5. Update Existing Records (if needed)
```sql
-- Set default values for existing records
UPDATE courses 
SET 
    isAccredited = 0,
    enrollmentOpen = 1,
    centerType = 'ACADEMIC'
WHERE centerType IS NULL;
```

## Handling Old Fields

The migration script **does not automatically drop old fields**. This is intentional for safety.

### To Remove Old Fields (Optional):
If you're ready to remove old fields, uncomment the DROP COLUMN statements in **STEP 5** of the SQL file.

**Old fields that may exist:**
- `type` (enum)
- `objectives`
- `creditHours`
- `level`
- `durationWeeks`
- `deliveryMode`
- `language`
- `isPublished`
- `enrollmentCap`
- `departmentId`

### Before Dropping:
1. Export data from old fields if needed
2. Verify frontend no longer uses these fields
3. Check if any reports or queries depend on them

## Rollback Procedure

If something goes wrong, you can rollback:

### 1. Using the rollback script
The rollback SQL is commented at the bottom of the migration file.

### 2. Restore from backup
```bash
mysql -u username -p database_name < courses_backup.sql
```

## Troubleshooting

### Error: Column already exists
If you see "Duplicate column name" errors:
- Some columns may already exist in your table
- Comment out those specific ALTER statements
- Or use `ADD COLUMN IF NOT EXISTS` (MySQL 8.0+)

### Error: Cannot add foreign key constraint
If the foreign key fails:
- Check that the `users` table exists
- Verify `centerManagerId` values reference valid user IDs
- Ensure no orphaned data exists

### Error: Table doesn't support JSON
If JSON type fails (older MySQL versions):
- Change JSON to TEXT
- Store JSON as text strings
- Parse in application code

## Testing Checklist

After migration, test these operations:

- [ ] Insert new course center with all fields
- [ ] Update existing course center
- [ ] Query by centerType
- [ ] Query by targetAudience
- [ ] Filter by isAccredited
- [ ] Filter by enrollmentOpen
- [ ] Join with users table via centerManagerId
- [ ] Store and retrieve JSON in resources field
- [ ] Store and retrieve JSON in policies field
- [ ] Test budget calculations
- [ ] Verify all indexes are being used

## Database Compatibility

### MySQL/MariaDB (Recommended)
- Tested on MySQL 5.7+ and MariaDB 10.2+
- JSON type requires MySQL 5.7.8+ or MariaDB 10.2.7+

### PostgreSQL
Changes needed:
- `TINYINT(1)` → `BOOLEAN`
- `VARCHAR(n)` → `VARCHAR(n)` (same)
- `DECIMAL(12,2)` → `NUMERIC(12,2)`
- `JSON` → `JSONB` (recommended for PostgreSQL)
- `IF NOT EXISTS` syntax may differ

### SQLite
Changes needed:
- No ALTER COLUMN support (need to recreate table)
- TINYINT → INTEGER
- JSON stored as TEXT

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify database version compatibility
3. Ensure you have proper permissions (ALTER, CREATE INDEX, etc.)
4. Review the backup before restoring

## Additional Resources

- Schema Documentation: `course_center_schema.md`
- Integration Guide: `COURSE_CENTER_INTEGRATION_COMPLETE.md`
- Backend Controller: `controllers/superadminController.js`
- Frontend Component: `copy/src/features/superadmin/components/CourseFormFields.tsx`
