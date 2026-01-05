# HR Database Schema Documentation

## 📋 Overview

This document provides comprehensive documentation for the HR user creation database schema implementation. The implementation adds extensive HR capabilities to the existing School Management Information System (MIS) while maintaining backward compatibility.

## 🗄️ Database Changes Summary

### **User Table Enhancements**

The `users` table has been significantly enhanced with HR-specific fields to support comprehensive user management across different roles.

#### **New Fields Added:**

| Field Name | Type | Description | HR Purpose |
|------------|------|-------------|------------|
| `fatherName` | VARCHAR(100) | Father's name | Required for some roles (cultural requirement) |
| `email` | VARCHAR(255) | Email address | Professional contact and communication |
| `address` | VARCHAR(255) | Physical address | Contact information |
| `designation` | VARCHAR(100) | Job title/designation | Professional role specification |
| `employeeId` | VARCHAR(50) | Employee identification | HR tracking and payroll |
| `totalExperience` | INT | Total years of experience | Experience validation |
| `relevantExperience` | TEXT | Relevant experience details | Role-specific experience |
| `shift` | VARCHAR(50) | Work shift (morning/evening/night) | Scheduling |
| `workTime` | VARCHAR(50) | Work time (FullTime/PartTime) | Employment type |
| `subjectsCanTeach` | JSON | Array of subjects teacher can teach | Teaching assignments |
| `qualification` | TEXT | Educational qualification | Academic credentials |
| `specialization` | VARCHAR(255) | Specialization area | Expertise tracking |
| `isClassTeacher` | BOOLEAN | Whether teacher is class teacher | Class responsibility |
| `contractStartDate` | DATETIME | Contract start date | Contract management |
| `contractEndDate` | DATETIME | Contract end date | Contract management |
| `salaryType` | VARCHAR(50) | Salary type (fixed/percentage/hourly) | Compensation structure |
| `salaryAmount` | DECIMAL(10,2) | Salary amount | Compensation tracking |
| `salaryCurrency` | VARCHAR(3) | Salary currency | Multi-currency support |
| `courseId` | BIGINT | Course ID for course-specific users | Course assignment |

## 🔍 Database Indexes

### **Performance Optimization Indexes:**

```sql
-- Core HR indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_courseId ON users(courseId);
CREATE INDEX idx_users_employeeId ON users(employeeId);
CREATE INDEX idx_users_contract_dates ON users(contractStartDate, contractEndDate);
CREATE INDEX idx_users_salaryType ON users(salaryType);
CREATE INDEX idx_users_totalExperience ON users(totalExperience);
```

### **Uniqueness Constraints:**

```sql
-- Email uniqueness per school
ALTER TABLE users ADD UNIQUE KEY uk_users_email_school (email, schoolId);
```

## 🔧 Database Triggers

### **1. Email Uniqueness Validation**

```sql
CREATE TRIGGER check_email_uniqueness_per_school
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE email_count INT;
    IF NEW.email IS NOT NULL AND NEW.schoolId IS NOT NULL THEN
        SELECT COUNT(*) INTO email_count
        FROM users
        WHERE email = NEW.email AND schoolId = NEW.schoolId AND deletedAt IS NULL;
        
        IF email_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email already exists for this school';
        END IF;
    END IF;
END;
```

### **2. Role-Specific Field Validation**

```sql
CREATE TRIGGER validate_hr_fields_on_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    -- Teacher role validation
    IF NEW.role = 'TEACHER' THEN
        IF NEW.subjectsCanTeach IS NULL OR JSON_LENGTH(NEW.subjectsCanTeach) = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Subjects can teach is required for teacher role';
        END IF;
    END IF;
    
    -- HRM role validation
    IF NEW.role = 'HRM' THEN
        IF NEW.totalExperience IS NULL OR NEW.totalExperience < 2 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'HRM role requires at least 2 years of experience';
        END IF;
    END IF;
    
    -- Additional role validations...
END;
```

## 📊 Database Views

### **HR Users Enhanced View**

```sql
CREATE OR REPLACE VIEW hr_users_view AS
SELECT 
    u.id,
    u.uuid,
    u.username,
    u.firstName,
    u.lastName,
    u.fatherName,
    u.email,
    u.phone,
    u.address,
    u.role,
    u.designation,
    u.employeeId,
    u.totalExperience,
    u.relevantExperience,
    u.shift,
    u.workTime,
    u.subjectsCanTeach,
    u.qualification,
    u.specialization,
    u.isClassTeacher,
    u.contractStartDate,
    u.contractEndDate,
    u.salaryType,
    u.salaryAmount,
    u.salaryCurrency,
    u.schoolId,
    u.branchId,
    u.courseId,
    u.status,
    u.metadata,
    u.createdAt,
    u.updatedAt,
    s.name as schoolName,
    b.name as branchName,
    c.name as courseName
FROM users u
LEFT JOIN schools s ON u.schoolId = s.id
LEFT JOIN branches b ON u.branchId = b.id
LEFT JOIN courses c ON u.courseId = c.id
WHERE u.deletedAt IS NULL
AND u.role IN ('TEACHER', 'HRM', 'BRANCH_MANAGER', 'ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'COURSE_MANAGER', 'SCHOOL_ADMIN');
```

## 🔧 Stored Procedures

### **Employee ID Generation**

```sql
CREATE PROCEDURE generate_employee_id(
    IN p_role VARCHAR(50),
    IN p_school_id BIGINT,
    IN p_school_code VARCHAR(20),
    OUT p_employee_id VARCHAR(50)
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_sequence INT;
    DECLARE v_year VARCHAR(4);
    
    SET v_year = YEAR(NOW());
    
    -- Set prefix based on role
    CASE p_role
        WHEN 'TEACHER' THEN SET v_prefix = 'TCH';
        WHEN 'HRM' THEN SET v_prefix = 'HRM';
        WHEN 'BRANCH_MANAGER' THEN SET v_prefix = 'BMG';
        WHEN 'ACCOUNTANT' THEN SET v_prefix = 'ACC';
        WHEN 'LIBRARIAN' THEN SET v_prefix = 'LIB';
        WHEN 'CRM_MANAGER' THEN SET v_prefix = 'CRM';
        WHEN 'COURSE_MANAGER' THEN SET v_prefix = 'CSM';
        WHEN 'SCHOOL_ADMIN' THEN SET v_prefix = 'ADM';
        ELSE SET v_prefix = 'EMP';
    END CASE;
    
    -- Get next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(employeeId, -4) AS UNSIGNED)), 0) + 1
    INTO v_sequence
    FROM users
    WHERE role = p_role 
    AND schoolId = p_school_id 
    AND employeeId LIKE CONCAT(v_prefix, '%');
    
    -- Generate employee ID
    SET p_employee_id = CONCAT(v_prefix, '-', p_school_code, '-', v_year, '-', LPAD(v_sequence, 4, '0'));
END;
```

## 📋 Database Functions

### **1. Afghanistan Phone Validation**

```sql
CREATE FUNCTION validate_afghanistan_phone(phone_number VARCHAR(20)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_valid BOOLEAN DEFAULT FALSE;
    
    -- Afghanistan phone format: +937XXXXXXXX or 07XXXXXXXX
    IF phone_number REGEXP '^(\+93)?[0-9]{10}$' THEN
        SET is_valid = TRUE;
    END IF;
    
    RETURN is_valid;
END;
```

### **2. Email Format Validation**

```sql
CREATE FUNCTION validate_email_format(email_address VARCHAR(255)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE is_valid BOOLEAN DEFAULT FALSE;
    
    -- Basic email validation
    IF email_address REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SET is_valid = TRUE;
    END IF;
    
    RETURN is_valid;
END;
```

## 🎭 Role-Specific Database Constraints

### **Teacher Role Requirements:**
- `subjectsCanTeach` must be a valid JSON array with at least one subject
- `relevantExperience` must be provided and not empty
- `qualification` should be provided for academic positions

### **HRM Role Requirements:**
- `totalExperience` must be at least 2 years
- `designation` should reflect HR management position

### **Branch Manager Role Requirements:**
- `branchId` is mandatory
- `totalExperience` must be at least 2 years
- `designation` should reflect management position

### **Staff Roles (Accountant, Librarian, CRM Manager, Course Manager):**
- `designation` is mandatory
- Appropriate `specialization` should be provided

## 📊 Metadata Storage Strategy

### **JSON Metadata Structure:**

```json
{
  "branchId": 1,
  "courseId": 2,
  "subjectsCanTeach": ["Mathematics", "Physics"],
  "contractDates": {
    "startDate": "2024-01-15",
    "endDate": "2024-12-31"
  },
  "salaryStructure": {
    "type": "percentage",
    "amount": 20,
    "currency": "AFN"
  },
  "totalExperience": 8,
  "relevantExperience": "8 years teaching experience",
  "shift": "morning",
  "workTime": "FullTime",
  "relativesInfo": [
    {
      "name": "Ali Rahimi",
      "phone": "+937123456787",
      "relation": "Brother"
    }
  ],
  "coursePreferences": {
    "preferredShifts": ["morning", "evening"],
    "maxCoursesPerTerm": 3,
    "preferredSubjects": ["English", "Dari", "Literature"]
  },
  "courseAssignments": [
    {
      "courseId": 1,
      "courseName": "English Language - Level 1",
      "role": "teacher",
      "salary": {
        "type": "percentage",
        "percentage": 20
      },
      "schedule": {
        "shift": "morning",
        "days": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
        "startTime": "08:00",
        "endTime": "12:00",
        "roomNumber": "A101"
      }
    }
  ],
  "documents": {
    "profilePicture": "profile.jpg",
    "cvFile": "cv.pdf",
    "tazkiraFile": "tazkira.pdf",
    "lastDegreeFile": "degree.pdf",
    "experienceFile": "experience.pdf",
    "contractFile": "contract.pdf",
    "bankAccountFile": "bank.pdf"
  },
  "roleSpecific": {
    "teaching": {
      "qualification": "Masters in English",
      "specialization": "English Language Teaching",
      "experience": 8,
      "isClassTeacher": true
    },
    "salaryHistory": [
      {
        "effectiveDate": "2024-01-15",
        "salaryType": "percentage",
        "amount": 20,
        "courseId": 1,
        "reason": "Initial assignment"
      }
    ],
    "performanceMetrics": {
      "targetStudentRetention": 85,
      "targetAverageScore": 75,
      "targetCompletionRate": 90,
      "currentMetrics": {
        "studentRetentionRate": 85,
        "averageStudentScore": 78,
        "courseCompletionRate": 92
      }
    }
  }
}
```

## 🔍 Database Queries Examples

### **1. Find Teachers by Subject**

```sql
SELECT u.id, u.firstName, u.lastName, u.email, u.employeeId
FROM users u
WHERE u.role = 'TEACHER'
AND u.deletedAt IS NULL
AND JSON_CONTAINS(u.subjectsCanTeach, '"Mathematics"')
ORDER BY u.lastName, u.firstName;
```

### **2. Get Users with Expiring Contracts**

```sql
SELECT u.id, u.firstName, u.lastName, u.email, u.contractEndDate
FROM users u
WHERE u.contractEndDate IS NOT NULL
AND u.contractEndDate BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
AND u.deletedAt IS NULL
ORDER BY u.contractEndDate;
```

### **3. Calculate Average Salary by Role**

```sql
SELECT 
    u.role,
    COUNT(*) as user_count,
    AVG(u.salaryAmount) as average_salary,
    u.salaryCurrency
FROM users u
WHERE u.salaryAmount IS NOT NULL
AND u.deletedAt IS NULL
GROUP BY u.role, u.salaryCurrency
ORDER BY u.role;
```

### **4. Find Users by Experience Range**

```sql
SELECT u.id, u.firstName, u.lastName, u.role, u.totalExperience, u.designation
FROM users u
WHERE u.totalExperience BETWEEN 5 AND 10
AND u.deletedAt IS NULL
ORDER BY u.totalExperience DESC, u.lastName;
```

### **5. Get Course Assignments for Teachers**

```sql
SELECT 
    u.id as user_id,
    u.firstName,
    u.lastName,
    u.employeeId,
    c.id as course_id,
    c.name as course_name,
    c.code as course_code
FROM users u
JOIN courses c ON u.courseId = c.id
WHERE u.role = 'TEACHER'
AND u.courseId IS NOT NULL
AND u.deletedAt IS NULL
AND c.deletedAt IS NULL
ORDER BY u.lastName, c.name;
```

## 📈 Performance Considerations

### **Index Strategy:**
- Email index for uniqueness and search operations
- Course ID index for course-specific queries
- Employee ID index for HR operations
- Contract date composite index for contract management
- Experience index for experience-based filtering

### **Query Optimization:**
- Use the `hr_users_view` for common HR queries
- Leverage JSON functions for metadata queries
- Implement proper WHERE clauses for deletedAt filtering
- Use appropriate JOIN strategies for related data

## 🔄 Migration Process

### **Applying the Migration:**

1. **Backup Database:**
   ```sql
   mysqldump -u username -p database_name > backup_before_hr_migration.sql
   ```

2. **Run Migration:**
   ```sql
   mysql -u username -p database_name < migrations/001_add_hr_fields_to_users.sql
   ```

3. **Verify Migration:**
   ```sql
   SELECT COUNT(*) as total_users FROM users WHERE deletedAt IS NULL;
   DESCRIBE users;
   SHOW INDEX FROM users;
   ```

### **Rollback Process:**

1. **Run Rollback:**
   ```sql
   mysql -u username -p database_name < migrations/rollback_001_remove_hr_fields.sql
   ```

2. **Verify Rollback:**
   ```sql
   DESCRIBE users;
   SELECT COUNT(*) as total_users FROM users WHERE deletedAt IS NULL;
   ```

## 🛡️ Security Considerations

### **Data Protection:**
- Sensitive fields (tazkiraNo, phone) should be encrypted at application level
- Email uniqueness enforced per school
- Role-based field validation prevents invalid data entry

### **Access Control:**
- HR fields should be accessible only to authorized roles
- Audit logging for all HR data modifications
- Proper data masking for sensitive information in reports

## 📚 Integration Points

### **Application Layer Integration:**
- Prisma schema updates for ORM support
- Validation utilities for field validation
- Service layer enhancements for HR operations
- API layer modifications for HR endpoints

### **External System Integration:**
- Payroll system integration via employeeId
- Email system integration for notifications
- Document management system for file uploads
- Reporting system for HR analytics

---

## 🎯 Summary

The HR database schema implementation provides:

✅ **Comprehensive HR field support** for all user roles
✅ **Performance optimization** through strategic indexing
✅ **Data integrity** through triggers and constraints
✅ **Flexibility** through JSON metadata storage
✅ **Backward compatibility** with existing systems
✅ **Security** through validation and access controls
✅ **Maintainability** through proper documentation and migration scripts

The implementation is production-ready and supports all HR user creation scenarios as documented in the HR_USER_CREATION_FIELDS.md specification.
