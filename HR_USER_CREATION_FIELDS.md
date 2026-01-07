# HR User Creation Fields

## Overview
This document outlines all the fields available when creating a new HR user (staff member) in the School Management Information System (MIS). Fields are categorized by their purpose and implementation status.

## Field Categories

### Personal Information
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| First Name | String | ✅ Yes | - | Staff member's first name |
| Last Name | String | ✅ Yes | - | Staff member's last name |
| Father Name | String | ✅ Yes | - | Father's name (required) |
| Email | String | ✅ Yes | - | Unique email address for login |
| Phone | String | ❌ No | - | Contact phone number |
| Gender | Enum | ❌ No | - | MALE, FEMALE, OTHER |
| Birth Date | Date | ❌ No | - | Date of birth |
| Current Address | Text | ❌ No | - | Current residential address |
| Origin Address | Text | ❌ No | - | Permanent/origin address |
| National ID Card No | String | ❌ No | - | National identification number |
| Avatar | String | ❌ No | - | Profile picture URL |
| Bio | Text | ❌ No | - | Short biography or description |

### Professional Information
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| Employee ID | String | ❌ No | Auto-generated | Unique staff identifier |
| Designation | String | ✅ Yes | - | Job title or position |
| Joining Date | Date | ❌ No | - | Date of employment start |
| Salary | Decimal | ❌ No | - | Base salary (numeric) |
| Contract Start Date | Date | ❌ No | - | Contract beginning date |
| Contract End Date | Date | ❌ No | - | Contract expiration date |
| Total Experience | Number | ❌ No | - | Years of total experience |
| Relevant Experience | Text | ❌ No | - | Relevant work experience details |
| Shift | Enum | ❌ No | - | morning, evening |
| Work Time | Enum | ❌ No | - | FullTime, partTime |
| Subjects Can Teach | Array | ❌ No | - | [Dari, Pashto, English] - Only for teaching roles |

#### **Role-Based Field Applicability**
| Role | Subjects Can Teach | Contract Dates | Salary | Special Requirements |
|------|-------------------|---------------|--------|-------------------|
| TEACHER | ✅ Required | ✅ Required | ✅ Required | Teaching certification |
| HRM | ❌ Not Applicable | ✅ Required | ✅ Required | HR management experience |
| STAFF | ❌ Not Applicable | ✅ Required | ✅ Required | Administrative skills |
| LIBRARIAN | ❌ Not Applicable | ✅ Required | ✅ Required | Library management |
| ACCOUNTANT | ❌ Not Applicable | ✅ Required | ✅ Required | Accounting certification |
| BRANCH_MANAGER | ❌ Not Applicable | ✅ Required | ✅ Required | Management experience |
| COURSE_MANAGER | ✅ Required | ✅ Required | ✅ Required | Course coordination |
| CRM_MANAGER | ❌ Not Applicable | ✅ Required | ✅ Required | CRM experience |
| SUPER_ADMIN | ❌ Not Applicable | ❌ Not Required | ❌ Not Required | System administration |
| SCHOOL_ADMIN | ❌ Not Applicable | ❌ Not Required | ❌ Not Required | School administration |
| PARENT | ❌ Not Applicable | ❌ Not Required | ❌ Not Required | Parent information |
| STUDENT | ❌ Not Applicable | ❌ Not Required | ❌ Not Required | Student information |

#### **Field Applicability by Role Type**
| Field Type | Teaching Roles | Management Roles | Administrative Roles | System Roles |
|------------|----------------|------------------|---------------------|--------------|
| **Personal Info** | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Professional Info** | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Subjects Can Teach** | ✅ Required | ❌ Not Applicable | ❌ Not Applicable | ❌ Not Applicable |
| **Contract Dates** | ✅ Required | ✅ Required | ✅ Required | ❌ Not Required |
| **Salary** | ✅ Required | ✅ Required | ✅ Required | ❌ Not Required |
| **Documents** | ✅ Required | ✅ Required | ✅ Required | ❌ Not Required |
| **Relatives Info** | ✅ Optional | ✅ Optional | ✅ Optional | ❌ Not Required |
| **System Fields** | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

### Account Information
| Field | Type | Required | Default | Auto-Generated | Description |
|-------|------|----------|---------|----------------|-------------|
| Username | String | ❌ No | Auto-derived | ✅ Yes | Derived from email if not provided |
| Password | String | ❌ No | "Hr@12345" | ✅ Yes | Default password for new staff |
| Role | Enum | ❌ No | "STAFF" | ✅ Yes | From role enum: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, STAFF, HRM, PARENT, ACCOUNTANT, LIBRARIAN, CRM_MANAGER, BRANCH_MANAGER, COURSE_MANAGER |
| Status | Enum | ❌ No | "ACTIVE" | ✅ Yes | Automatically set to ACTIVE |

### Document Management
| Field | Type | Required | Role Applicability | Description |
|-------|------|----------|-------------------|-------------|
| CV | File | ✅ Required | Teaching, Management, Administrative | Curriculum vitae file upload |
| Degree Document | File | ✅ Required | Teaching, Management, Administrative | Educational degree certificate |
| Experience Document | File | ✅ Required | Teaching, Management, Administrative | Experience verification document |
| National ID Card | File | ✅ Required | Teaching, Management, Administrative | National identification card scan |
| Contract Document | File | ✅ Required | Teaching, Management, Administrative | Employment contract document |
| Other Certificates | File | ❌ Optional | All roles | Additional professional certificates |

#### **Document Requirements by Role**
| Role | CV | Degree | Experience | National ID | Contract | Other Certificates |
|------|----|-------|------------|------------|----------|-------------------|
| TEACHER | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| HRM | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| STAFF | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| LIBRARIAN | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| ACCOUNTANT | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| BRANCH_MANAGER | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| COURSE_MANAGER | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| CRM_MANAGER | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ❌ Optional |
| SUPER_ADMIN | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Optional |
| SCHOOL_ADMIN | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Optional |
| PARENT | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Optional |
| STUDENT | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Not Required | ❌ Optional |

### Relatives Information
| Field | Type | Required | Role Applicability | Description |
|-------|------|----------|-------------------|-------------|
| Relatives Info | Array | ✅ Required | Teaching, Management, Administrative | Array of relative objects with: |
| - Name | String | - | - | Relative's name |
| - Phone | String | - | - | Relative's phone number |
| - Relation | String | - | - | Relationship to staff member |

#### **Relatives Info Requirements by Role**
| Role | Relatives Info Required | Reason |
|------|----------------------|--------|
| TEACHER | ✅ Required | Emergency contact for students |
| HRM | ✅ Required | Emergency contact for HR operations |
| STAFF | ✅ Required | Emergency contact for administrative tasks |
| LIBRARIAN | ✅ Required | Emergency contact for library operations |
| ACCOUNTANT | ✅ Required | Emergency contact for financial operations |
| BRANCH_MANAGER | ✅ Required | Emergency contact for branch management |
| COURSE_MANAGER | ✅ Required | Emergency contact for course coordination |
| CRM_MANAGER | ✅ Required | Emergency contact for CRM operations |
| SUPER_ADMIN | ❌ Not Required | System administrator - different contact methods |
| SCHOOL_ADMIN | ❌ Not Required | School admin - different contact methods |
| PARENT | ❌ Not Required | Parent is the contact person |
| STUDENT | ❌ Not Required | Student - parent is primary contact |

### System Fields
| Field | Type | Required | Role Applicability | Auto-Generated | Description |
|-------|------|----------|-------------------|----------------|-------------|
| School ID | Number | ✅ Yes | All roles | ✅ Yes | Automatically assigned from context |
| Branch ID | Number | ✅ Required | Management Roles | - | Branch assignment for managers |
| Timezone | String | ✅ Required | Teaching, Management, Administrative | "UTC" | User timezone preference |
| Locale | String | ✅ Required | Teaching, Management, Administrative | "en-US" | User locale preference |
| UUID | String | ✅ Yes | All roles | ✅ Yes | Unique identifier |
| Created By | Number | ✅ Yes | All roles | ✅ Yes | User ID of creator |
| Created At | DateTime | ✅ Yes | All roles | ✅ Yes | Creation timestamp |
| Updated At | DateTime | ✅ Yes | All roles | ✅ Yes | Last update timestamp |

#### **System Field Requirements by Role**
| Role | Branch ID | Timezone | Locale | Reason |
|------|----------|----------|--------|--------|
| TEACHER | ❌ Not Required | ✅ Required | ✅ Required | Teaching schedule needs timezone |
| HRM | ✅ Required | ✅ Required | ✅ Required | HR operations by branch |
| STAFF | ❌ Not Required | ✅ Required | ✅ Required | Administrative tasks |
| LIBRARIAN | ❌ Not Required | ✅ Required | ✅ Required | Library operations |
| ACCOUNTANT | ❌ Not Required | ✅ Required | ✅ Required | Financial operations |
| BRANCH_MANAGER | ✅ Required | ✅ Required | ✅ Required | Branch management |
| COURSE_MANAGER | ❌ Not Required | ✅ Required | ✅ Required | Course coordination |
| CRM_MANAGER | ❌ Not Required | ✅ Required | ✅ Required | CRM operations |
| SUPER_ADMIN | ❌ Not Required | ✅ Required | ✅ Required | System administration |
| SCHOOL_ADMIN | ✅ Required | ✅ Required | ✅ Required | School administration |
| PARENT | ❌ Not Required | ✅ Required | ✅ Required | Communication preferences |
| STUDENT | ❌ Not Required | ✅ Required | ✅ Required | Communication preferences |

## Required Fields Summary

### Role-Specific Required Fields
The following fields are **mandatory** to create an HR user based on their role:

#### **Teaching Roles (TEACHER, COURSE_MANAGER)**
1. **First Name** - Staff member's first name
2. **Last Name** - Staff member's last name  
3. **Father Name** - Staff member's father name (required)
4. **Email** - Unique email address for system access
5. **Designation** - Job title or position
6. **School ID** - Automatically assigned from current context
7. **Subjects Can Teach** - Required for teaching roles
8. **Contract Start Date** - Required for employment
9. **Contract End Date** - Required for employment
10. **Salary** - Required for compensation
11. **Timezone** - Required for scheduling
12. **Locale** - Required for communication
13. **Relatives Info** - Required for emergency contact
14. **Documents** - CV, Degree, Experience, National ID, Contract (all required)

#### **Management Roles (HRM, BRANCH_MANAGER, CRM_MANAGER)**
1. **First Name** - Staff member's first name
2. **Last Name** - Staff member's last name  
3. **Father Name** - Staff member's father name (required)
4. **Email** - Unique email address for system access
5. **Designation** - Job title or position
6. **School ID** - Automatically assigned from current context
7. **Contract Start Date** - Required for employment
8. **Contract End Date** - Required for employment
9. **Salary** - Required for compensation
10. **Branch ID** - Required for BRANCH_MANAGER and SCHOOL_ADMIN
11. **Timezone** - Required for operations
12. **Locale** - Required for communication
13. **Relatives Info** - Required for emergency contact
14. **Documents** - CV, Degree, Experience, National ID, Contract (all required)

#### **Administrative Roles (STAFF, LIBRARIAN, ACCOUNTANT)**
1. **First Name** - Staff member's first name
2. **Last Name** - Staff member's last name  
3. **Father Name** - Staff member's father name (required)
4. **Email** - Unique email address for system access
5. **Designation** - Job title or position
6. **School ID** - Automatically assigned from current context
7. **Contract Start Date** - Required for employment
8. **Contract End Date** - Required for employment
9. **Salary** - Required for compensation
10. **Timezone** - Required for operations
11. **Locale** - Required for communication
12. **Relatives Info** - Required for emergency contact
13. **Documents** - CV, Degree, Experience, National ID, Contract (all required)

#### **System Roles (SUPER_ADMIN, SCHOOL_ADMIN)**
1. **First Name** - Staff member's first name
2. **Last Name** - Staff member's last name  
3. **Father Name** - Staff member's father name (required)
4. **Email** - Unique email address for system access
5. **Designation** - Job title or position
6. **School ID** - Automatically assigned from current context
7. **Branch ID** - Required for SCHOOL_ADMIN (not for SUPER_ADMIN)
8. **Timezone** - Required for operations
9. **Locale** - Required for communication
10. **Documents** - Not required (optional certificates only)

#### **Non-Staff Roles (PARENT, STUDENT)**
1. **First Name** - Person's first name
2. **Last Name** - Person's last name  
3. **Father Name** - Person's father name (required)
4. **Email** - Unique email address for system access
5. **School ID** - Automatically assigned from current context
6. **Timezone** - Required for communication
7. **Locale** - Required for communication
8. **Documents** - Not required (optional certificates only)

## Database Schema Integration

### **User Creation Based on Role**
The system creates users in the main `User` table and then creates role-specific records in related tables:

#### **User Table (Base Record)**
All HR users are first created in the `User` table with these fields:
- `id` (BigInt, auto-generated)
- `uuid` (String, auto-generated)
- `username` (String, unique)
- `password` (String, with salt)
- `salt` (String, auto-generated)
- `firstName` (String)
- `lastName` (String)
- `fatherName` (String, required)
- `email` (String, unique)
- `phone` (String, optional)
- `gender` (Gender enum)
- `birthDate` (DateTime, optional)
- `avatar` (String, optional)
- `bio` (String, optional)
- `role` (UserRole enum)
- `status` (UserStatus, default: ACTIVE)
- `timezone` (String, default: "UTC")
- `locale` (String, default: "en-US")
- `metadata` (String, JSON for role-specific data)
- `schoolId` (BigInt, from context)
- `branchId` (BigInt, optional)
- `createdByOwnerId` (BigInt, from current user)
- `createdBy` (BigInt, from current user)
- `createdAt` (DateTime, auto-generated)
- `updatedAt` (DateTime, auto-generated)

#### **Role-Specific Table Creation**
Based on the user role, additional records are created:
- **Last Name**: 2-50 characters, letters and spaces only
- **Father Name**: 2-50 characters, letters and spaces only (required)
- **Email**: Valid email format, unique across system
- **Phone**: Valid phone number format (if provided)
- **Gender**: Must be one of: MALE, FEMALE, OTHER
- **Birth Date**: Valid date format
- **National ID**: Valid ID format (if provided)

### Professional Information Validation
- **Employee ID**: 3-50 characters, uppercase letters, numbers, underscores, hyphens
- **Designation**: 2-100 characters, required
- **Subjects Can Teach**: Required for TEACHER and COURSE_MANAGER roles only
- **Total Experience**: Numeric value, 0-50 years
- **Relevant Experience**: Text description, max 1000 characters
- **Shift**: Must be one of: morning, evening
- **Work Time**: Must be one of: FullTime, partTime
- **Salary**: Positive numeric value (if provided)
- **Joining Date**: Valid date format (if provided)

### Account Information Validation
- **Username**: 3-50 characters, alphanumeric and underscores only, unique
- **Password**: Minimum 8 characters (if custom provided)
- **Email**: Must be unique across all users

## Default Values

### System Defaults
- **Password**: "Hr@12345" (for new accounts)
- **Status**: "ACTIVE"
- **Timezone**: "UTC"
- **Locale**: "en-US"

### Business Logic Defaults
- **Username**: Generated from email (first part before @)
- **Employee ID**: Generated based on designation if not provided
- **School ID**: Inherited from current user context
- **Created By**: Current authenticated user ID
- **Role**: Must be explicitly specified from enum (no default)

## File Upload Specifications

### Supported Document Types
- **CV**: PDF, DOC, DOCX (Max 5MB)
- **Degree Document**: PDF, JPG, PNG (Max 5MB)
- **Experience Document**: PDF, DOC, DOCX (Max 5MB)
- **National ID Card**: PDF, JPG, PNG (Max 5MB)
- **Contract Document**: PDF, DOC, DOCX (Max 5MB)
- **Other Certificates**: PDF, JPG, PNG (Max 5MB)

### Upload Storage Path
- **CV**: `uploads/hr/cv/{staffId}/`
- **Degree Document**: `uploads/hr/degrees/{staffId}/`
- **Experience Document**: `uploads/hr/experience/{staffId}/`
- **National ID Card**: `uploads/hr/national-id/{staffId}/`
- **Contract Document**: `uploads/hr/contracts/{staffId}/`
- **Other Certificates**: `uploads/hr/certificates/{staffId}/`

## API Integration

### Create HR User Endpoint
```
POST /api/staff
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

### Request Body Structure
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "phone": "+937123456789",
  "gender": "MALE",
  "birthDate": "1990-01-01",
  "currentAddress": "Kabul, Afghanistan",
  "originAddress": "Herat, Afghanistan",
  "nationalIdCardNo": "1234567890",
  "designation": "Teacher",
  "departmentId": 1,
  "joiningDate": "2024-01-01",
  "salary": 50000,
  "contractStartDate": "2024-01-01",
  "contractEndDate": "2025-01-01",
  "totalExperience": 5,
  "relevantExperience": "5 years of teaching experience",
  "shift": "morning",
  "workTime": "FullTime",
  "subjectsCanTeach": ["Dari", "Pashto", "English"],
  "bio": "Experienced teacher with expertise in multiple languages",
  "relativesInfo": [
    {
      "name": "Jane Doe",
      "phone": "+937123456788",
      "relation": "Spouse"
    }
  ]
}
```

### File Upload Fields
```
cv: File (PDF, DOC, DOCX, Max 5MB)
degreeDocument: File (PDF, JPG, PNG, Max 5MB)
experienceDocument: File (PDF, DOC, DOCX, Max 5MB)
nationalIdCard: File (PDF, JPG, PNG, Max 5MB)
contractDocument: File (PDF, DOC, DOCX, Max 5MB)
otherCertificates: File (PDF, JPG, PNG, Max 5MB)
```

## Error Handling

### Common Validation Errors
- **Duplicate Email**: Email already exists in system
- **Invalid Phone**: Phone number format is invalid
- **Invalid Department**: Department ID does not exist
- **Salary Invalid**: Salary must be a positive number
- **Date Format**: Invalid date format provided
- **File Size Exceeded**: Document files exceed 5MB limit
- **Invalid File Type**: Unsupported file format for document upload
- **Missing Required Document**: Some documents may be required based on role

### System Errors
- **Subscription Limit**: Maximum staff limit reached for school
- **Permission Denied**: User lacks permission to create staff
- **Context Missing**: School context not available

## Security Considerations

### Password Security
- Default passwords should be changed on first login
- Passwords are hashed using bcrypt with salt
- Password complexity requirements enforced for custom passwords

### Data Privacy
- National ID and personal information are encrypted at rest
- Access to sensitive data requires appropriate permissions
- Audit trail maintained for all data changes

### File Upload Security
- File type validation prevents malicious uploads
- File size limits prevent storage abuse
- Virus scanning implemented for all uploads
- Document files are stored in secure, organized directory structure
- Access to uploaded documents requires appropriate permissions
- All file uploads are logged for audit purposes

## Usage Examples

### Complete HR User Creation (All Fields)
```json
{
  "firstName": "Fatima",
  "lastName": "Rahimi",
  "fatherName": "Mohammad Rahimi",
  "email": "fatima.rahimi@school.com",
  "phone": "+937123456789",
  "gender": "FEMALE",
  "birthDate": "1985-05-15",
  "currentAddress": "Kabul, District 5, Afghanistan",
  "originAddress": "Mazar-i-Sharif, Afghanistan",
  "nationalIdCardNo": "9876543210",
  "contractStartDate": "2024-01-15",
  "contractEndDate": "2024-12-31",
  "subjectsCanTeach": ["English", "Dari", "Pashto"], // Only for TEACHER/COURSE_MANAGER roles
  "totalExperience": 8,
  "relevantExperience": "8 years teaching English in various schools including international schools",
  "shift": "morning",
  "workTime": "FullTime",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Dedicated English teacher with international experience",
  "relativesInfo": [
    {
      "name": "Ali Rahimi",
      "phone": "+937123456787",
      "relation": "Brother"
    },
    {
      "name": "Mariam Rahimi",
      "phone": "+937123456786",
      "relation": "Sister"
    },
    {
      "name": "Abdul Rahimi",
      "phone": "+937123456785",
      "relation": "Father"
    }
  ],
  "employeeId": "ENG001",
  "designation": "English Teacher",
  "joiningDate": "2024-01-15",
  "salary": 45000,
  "schoolId": 1,
  "branchId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US",
  "username": "fatima.rahimi",
  "password": "Hr@12345",
  "role": "TEACHER", // Role determines required fields
  "status": "ACTIVE",
  "documents": {
    "cv": {
      "fileName": "fatima_cv.pdf",
      "fileType": "application/pdf",
      "fileSize": "2.5MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "degreeDocument": {
      "fileName": "bachelor_degree.pdf",
      "fileType": "application/pdf",
      "fileSize": "1.8MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "experienceDocument": {
      "fileName": "experience_letter.pdf",
      "fileType": "application/pdf",
      "fileSize": "1.2MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "nationalIdCard": {
      "fileName": "national_id.jpg",
      "fileType": "image/jpeg",
      "fileSize": "800KB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "contractDocument": {
      "fileName": "employment_contract.pdf",
      "fileType": "application/pdf",
      "fileSize": "3.1MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "otherCertificates": {
      "fileName": "teaching_certificate.jpg",
      "fileType": "image/jpeg",
      "fileSize": "1.5MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    }
  }
}
```

### Role-Specific HR User Examples

#### **TEACHER Role Example**
```json
{
  "firstName": "Ahmad",
  "lastName": "Khan",
  "fatherName": "Mohammad Khan",
  "email": "ahmad.khan@school.com",
  "designation": "Mathematics Teacher",
  "role": "TEACHER",
  "subjectsCanTeach": ["Mathematics", "Physics", "Statistics"], // Required for TEACHER
  "totalExperience": 5,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: departmentId removed - not required
}
```

#### **HRM Role Example**
```json
{
  "firstName": "Sara",
  "lastName": "Ahmadi",
  "fatherName": "Abdul Ahmadi",
  "email": "sara.ahmadi@school.com",
  "designation": "HR Manager",
  "role": "HRM",
  "totalExperience": 8,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: subjectsCanTeach not applicable for HRM, departmentId removed
}
```

#### **LIBRARIAN Role Example**
```json
{
  "firstName": "Mariam",
  "lastName": "Karimi",
  "fatherName": "Nabi Karimi",
  "email": "mariam.karimi@school.com",
  "designation": "Head Librarian",
  "role": "LIBRARIAN",
  "totalExperience": 6,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: subjectsCanTeach not applicable for LIBRARIAN, departmentId removed
}
```

#### **ACCOUNTANT Role Example**
```json
{
  "firstName": "Abdul",
  "lastName": "Safi",
  "fatherName": "Qadir Safi",
  "email": "abdul.safi@school.com",
  "designation": "Senior Accountant",
  "role": "ACCOUNTANT",
  "totalExperience": 10,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: subjectsCanTeach not applicable for ACCOUNTANT, departmentId removed
}
```

#### **COURSE_MANAGER Role Example**
```json
{
  "firstName": "Zahra",
  "lastName": "Hussaini",
  "fatherName": "Ali Hussaini",
  "email": "zahra.hussaini@school.com",
  "designation": "Course Coordinator",
  "role": "COURSE_MANAGER",
  "subjectsCanTeach": ["English", "Literature", "Writing"], // Required for COURSE_MANAGER
  "totalExperience": 7,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: departmentId removed - not required
}
```

#### **STAFF Role Example**
```json
{
  "firstName": "Ahmad",
  "lastName": "Nazar",
  "fatherName": "Mohammad Nazar",
  "email": "ahmad.nazar@school.com",
  "designation": "Administrative Assistant",
  "role": "STAFF",
  "totalExperience": 3,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: subjectsCanTeach not applicable for STAFF, departmentId removed
}
```

#### **CRM_MANAGER Role Example**
```json
{
  "firstName": "Fatima",
  "lastName": "Yousufi",
  "fatherName": "Abdul Yousufi",
  "email": "fatima.yousufi@school.com",
  "designation": "CRM Manager",
  "role": "CRM_MANAGER",
  "totalExperience": 6,
  "schoolId": 1,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: subjectsCanTeach not applicable for CRM_MANAGER, departmentId removed
}
```

#### **BRANCH_MANAGER Role Example**
```json
{
  "firstName": "Mohammad",
  "lastName": "Rahimi",
  "fatherName": "Ghulam Rahimi",
  "email": "mohammad.rahimi@school.com",
  "designation": "Branch Manager",
  "role": "BRANCH_MANAGER",
  "totalExperience": 12,
  "schoolId": 1,
  "branchId": 2,
  "shift": "morning",
  "workTime": "FullTime"
  // Note: subjectsCanTeach not applicable for BRANCH_MANAGER, departmentId removed
}
```

#### **SUPER_ADMIN Role Example**
```json
{
  "firstName": "System",
  "lastName": "Administrator",
  "fatherName": "IT Department",
  "email": "admin@school.com",
  "designation": "Super Administrator",
  "role": "SUPER_ADMIN",
  "totalExperience": 15,
  "schoolId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US"
  // Note: departmentId, subjectsCanTeach, contract dates, salary, relatives info, and documents not required
}
```

#### **SCHOOL_ADMIN Role Example**
```json
{
  "firstName": "Principal",
  "lastName": "Admin",
  "fatherName": "Education Department",
  "email": "principal@school.com",
  "designation": "School Principal",
  "role": "SCHOOL_ADMIN",
  "totalExperience": 20,
  "schoolId": 1,
  "branchId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US"
  // Note: departmentId, subjectsCanTeach, contract dates, salary, relatives info, and documents not required
}
```

#### **PARENT Role Example**
```json
{
  "firstName": "Mohammad",
  "lastName": "Jan",
  "fatherName": "Ghulam Jan",
  "email": "mohammad.jan@school.com",
  "designation": "Parent",
  "role": "PARENT",
  "schoolId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US"
  // Note: departmentId, subjectsCanTeach, contract dates, salary, relatives info, and documents not required
}
```

#### **STUDENT Role Example**
```json
{
  "firstName": "Ahmad",
  "lastName": "Karimi",
  "fatherName": "Abdul Karimi",
  "email": "ahmad.karimi@school.com",
  "designation": "Student",
  "role": "STUDENT",
  "schoolId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US"
  // Note: departmentId, subjectsCanTeach, contract dates, salary, relatives info, and documents not required
}
```

### Basic HR User Creation (Required Fields Only)
```json
{
  "firstName": "Ahmad",
  "lastName": "Khan",
  "fatherName": "Mohammad Khan",
  "email": "ahmad.khan@school.com",
  "designation": "Mathematics Teacher",
  "role": "TEACHER", // Role determines required fields
  "schoolId": 1
}
```

### HR User Creation with Documents (Multipart Form Data)
When creating HR users with document uploads, use `multipart/form-data`:

**JSON Data:**
```json
{
  "firstName": "Fatima",
  "lastName": "Rahimi",
  "fatherName": "Mohammad Rahimi",
  "email": "fatima.rahimi@school.com",
  "phone": "+937123456789",
  "gender": "FEMALE",
  "birthDate": "1985-05-15",
  "currentAddress": "Kabul, District 5, Afghanistan",
  "originAddress": "Mazar-i-Sharif, Afghanistan",
  "nationalIdCardNo": "9876543210",
  "contractStartDate": "2024-01-15",
  "contractEndDate": "2024-12-31",
  "subjectsCanTeach": ["English", "Dari", "Pashto"],
  "totalExperience": 8,
  "relevantExperience": "8 years teaching English in various schools including international schools",
  "shift": "morning",
  "workTime": "FullTime",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Dedicated English teacher with international experience",
  "relativesInfo": [
    {
      "name": "Ali Rahimi",
      "phone": "+937123456787",
      "relation": "Brother"
    },
    {
      "name": "Mariam Rahimi",
      "phone": "+937123456786",
      "relation": "Sister"
    },
    {
      "name": "Abdul Rahimi",
      "phone": "+937123456785",
      "relation": "Father"
    }
  ],
  "employeeId": "ENG001",
  "designation": "English Teacher",
  "departmentId": 2,
  "joiningDate": "2024-01-15",
  "salary": 45000,
  "schoolId": 1,
  "branchId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US"
}
```

**File Upload Fields:**
```
cv: File (PDF, DOC, DOCX, Max 5MB)
degreeDocument: File (PDF, JPG, PNG, Max 5MB)
experienceDocument: File (PDF, DOC, DOCX, Max 5MB)
nationalIdCard: File (PDF, JPG, PNG, Max 5MB)
contractDocument: File (PDF, DOC, DOCX, Max 5MB)
otherCertificates: File (PDF, JPG, PNG, Max 5MB)
```

## Course-Based HR User Creation

### Course-Specific Metadata
When creating HR users for specific courses, additional metadata can be included to handle course-based salary calculations and assignments:

#### **Salary Configuration Options**
```json
{
  "salaryType": "fixed", // Options: "fixed", "percentage", "perStudent"
  "salaryAmount": 5000, // Fixed monthly salary
  "salaryPercentage": 20, // Percentage of course fees (if percentage type)
  "salaryPerStudent": 2000, // Amount per student (if perStudent type)
  "maxStudents": 30, // Maximum students for perStudent calculation
  "currency": "AFN" // Currency code
}
```

#### **Course Assignment Metadata**
```json
{
  "courseId": 1, // Course ID for assignment
  "courseName": "English Language - Level 1", // Course name
  "courseShift": "morning", // Course-specific shift: morning, evening
  "courseSchedule": {
    "days": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
    "startTime": "08:00",
    "endTime": "12:00",
    "roomNumber": "A101"
  },
  "courseDuration": {
    "startDate": "2024-01-15",
    "endDate": "2024-12-31",
    "totalHours": 120
  }
}
```

#### **Existing User Course Assignment**
When creating HR user for existing user in school, the system will:
1. **Check for existing user** by email or national ID
2. **Merge existing data** with new course assignments
3. **Update user role** to include HR/Staff permissions
4. **Preserve existing metadata** and add course-specific information

### Complete Course-Based HR User Creation
```json
{
  "firstName": "Fatima",
  "lastName": "Rahimi",
  "fatherName": "Mohammad Rahimi",
  "email": "fatima.rahimi@school.com",
  "phone": "+937123456789",
  "gender": "FEMALE",
  "birthDate": "1985-05-15",
  "currentAddress": "Kabul, District 5, Afghanistan",
  "originAddress": "Mazar-i-Sharif, Afghanistan",
  "nationalIdCardNo": "9876543210",
  "employeeId": "ENG001",
  "designation": "English Teacher",
  "departmentId": 2,
  "joiningDate": "2024-01-15",
  "schoolId": 1,
  "branchId": 1,
  "timezone": "Asia/Kabul",
  "locale": "en-US",
  "username": "fatima.rahimi",
  "password": "Hr@12345",
  "role": "STAFF",
  "status": "ACTIVE",
  "relativesInfo": [
    {
      "name": "Ali Rahimi",
      "phone": "+937123456787",
      "relation": "Brother"
    },
    {
      "name": "Mariam Rahimi",
      "phone": "+937123456786",
      "relation": "Sister"
    },
    {
      "name": "Abdul Rahimi",
      "phone": "+937123456785",
      "relation": "Father"
    }
  ],
  "salary": {
    "type": "percentage",
    "percentage": 20,
    "baseAmount": 0,
    "perStudentAmount": 0,
    "maxStudents": 30,
    "currency": "AFN",
    "effectiveDate": "2024-01-15"
  },
  "courseAssignments": [
    {
      "courseId": 1,
      "courseName": "English Language - Level 1",
      "shift": "morning",
      "schedule": {
        "days": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
        "startTime": "08:00",
        "endTime": "12:00",
        "roomNumber": "A101"
      },
      "duration": {
        "startDate": "2024-01-15",
        "endDate": "2024-12-31",
        "totalHours": 120
      },
      "studentFee": 10000,
      "teacherPercentage": 20,
      "estimatedMonthlyEarning": 2000
    },
    {
      "courseId": 2,
      "courseName": "English Language - Level 2",
      "shift": "evening",
      "schedule": {
        "days": ["Thursday", "Friday"],
        "startTime": "16:00",
        "endTime": "20:00",
        "roomNumber": "B205"
      },
      "duration": {
        "startDate": "2024-02-01",
        "endDate": "2024-12-31",
        "totalHours": 80
      },
      "studentFee": 8000,
      "teacherPercentage": 25,
      "estimatedMonthlyEarning": 2000
    }
  ],
  "documents": {
    "cv": {
      "fileName": "fatima_cv.pdf",
      "fileType": "application/pdf",
      "fileSize": "2.5MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "degreeDocument": {
      "fileName": "bachelor_degree.pdf",
      "fileType": "application/pdf",
      "fileSize": "1.8MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "experienceDocument": {
      "fileName": "experience_letter.pdf",
      "fileType": "application/pdf",
      "fileSize": "1.2MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "nationalIdCard": {
      "fileName": "national_id.jpg",
      "fileType": "image/jpeg",
      "fileSize": "800KB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "contractDocument": {
      "fileName": "employment_contract.pdf",
      "fileType": "application/pdf",
      "fileSize": "3.1MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    },
    "otherCertificates": {
      "fileName": "teaching_certificate.jpg",
      "fileType": "image/jpeg",
      "fileSize": "1.5MB",
      "uploadDate": "2024-01-15T10:00:00Z"
    }
  },
  "metadata": {
    "previousSchool": "Kabul International School",
    "certifications": ["TEFL", "TESOL"],
    "languages": ["English", "Dari", "Pashto", "Urdu"],
    "coursePreferences": {
      "preferredShifts": ["morning", "evening"],
      "preferredSubjects": ["English", "Dari", "Literature"],
      "maxCoursesPerTerm": 3,
      "preferredRoomTypes": ["classroom", "lab"]
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
      "studentRetentionRate": 85,
      "averageStudentScore": 78,
      "courseCompletionRate": 92
    }
  }
}
```

### Salary Calculation Examples

#### **Fixed Monthly Salary**
```json
{
  "salary": {
    "type": "fixed",
    "amount": 5000,
    "currency": "AFN",
    "payFrequency": "monthly",
    "effectiveDate": "2024-01-15"
  }
}
```

#### **Percentage-Based Salary**
```json
{
  "salary": {
    "type": "percentage",
    "percentage": 20,
    "currency": "AFN",
    "applicableTo": ["courseId": 1, "courseId": 2],
    "effectiveDate": "2024-01-15"
  }
}
// Calculation: 20% of student fees = 0.20 × 10000 AFN = 2000 AFN per student
```

#### **Per-Student Salary**
```json
{
  "salary": {
    "type": "perStudent",
    "amount": 2000,
    "currency": "AFN",
    "maxStudents": 30,
    "effectiveDate": "2024-01-15"
  }
}
// Calculation: 2000 AFN per student × 30 students = 60000 AFN per month
```

### Existing User Course Assignment Process

#### **API Endpoint for Existing Users**
```
POST /api/staff/assign-course
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body for Existing User**
```json
{
  "userEmail": "fatima.rahimi@school.com",
  "courseAssignments": [
    {
      "courseId": 3,
      "role": "teacher",
      "salary": {
        "type": "percentage",
        "percentage": 25,
        "effectiveDate": "2024-01-15"
      },
      "shift": "morning",
      "schedule": {
        "days": ["Monday", "Wednesday", "Friday"],
        "startTime": "09:00",
        "endTime": "13:00",
        "roomNumber": "C102"
      }
    }
  ],
  "updateExisting": true
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "Course assignment completed for existing user",
  "data": {
    "userId": 123,
    "existingUser": true,
    "previousCourses": ["courseId": 1, "courseId": 2],
    "newAssignments": ["courseId": 3],
    "updatedSalary": {
      "type": "percentage",
      "percentage": 25,
      "applicableCourses": [1, 2, 3]
    }
  }
}
```

### Course Metadata Fields

#### **Additional Course-Specific Fields**
```json
{
  "courseMetadata": {
    "courseId": 1,
    "courseCode": "ENG-L1-2024",
    "academicYear": "2024",
    "semester": "spring",
    "department": "languages",
    "level": "beginner",
    "capacity": 25,
    "currentEnrollment": 20,
    "waitlistCount": 5,
    "prerequisites": ["basic-literacy"],
    "learningOutcomes": [
      "Basic English conversation",
      "Reading comprehension",
      "Writing skills"
    ],
    "assessmentMethod": "continuous",
    "textbook": "English for Beginners - Book 1",
    "resources": [
      "audio-materials",
      "visual-aids",
      "online-platform"
    ]
  }
}
```

### Shift and Schedule Metadata

#### **Comprehensive Shift Information**
```json
{
  "shiftMetadata": {
    "primaryShift": "morning",
    "secondaryShift": "evening",
    "flexibleShifts": true,
    "shiftPreferences": {
      "morning": {
        "preferred": true,
        "earliestStart": "07:00",
        "latestEnd": "13:00"
      },
      "evening": {
        "preferred": true,
        "earliestStart": "16:00",
        "latestEnd": "21:00"
      }
    },
    "breakSchedule": {
      "type": "fixed",
      "duration": 30,
      "times": ["10:30", "18:30"]
    }
  }
}
```

## Course Contract Management

### Course Contract Template
When creating HR users for specific courses, a course-specific contract can be generated and attached to the staff member's profile:

#### **Course Contract Structure**
```json
{
  "courseContract": {
    "contractId": "CC-2024-ENG-001",
    "contractType": "course-based",
    "staffMember": {
      "userId": 123,
      "name": "Fatima Rahimi",
      "employeeId": "ENG001",
      "designation": "English Teacher"
    },
    "courseDetails": {
      "courseId": 1,
      "courseName": "English Language - Level 1",
      "courseCode": "ENG-L1-2024",
      "academicYear": "2024",
      "semester": "spring",
      "department": "languages"
    },
    "contractPeriod": {
      "startDate": "2024-01-15",
      "endDate": "2024-12-31",
      "duration": "11 months",
      "academicTerm": "spring-2024"
    },
    "financialTerms": {
      "salaryType": "percentage",
      "percentage": 20,
      "studentFeeRange": {
        "minimum": 8000,
        "maximum": 15000,
        "average": 10000
      },
      "estimatedEarnings": {
        "minimum": 1600,
        "maximum": 3000,
        "average": 2000,
        "currency": "AFN",
        "paymentFrequency": "monthly"
      },
      "bonusStructure": {
        "studentRetentionBonus": 5,
        "performanceBonus": 10,
        "completionBonus": 15
      }
    },
    "workSchedule": {
      "shifts": ["morning", "evening"],
      "weeklyHours": 25,
      "totalHours": 275,
      "breakTimes": ["10:30-11:00", "18:30-19:00"],
      "roomAssignments": ["A101", "B205"]
    },
    "responsibilities": [
      "Teaching English language fundamentals",
      "Conducting regular assessments",
      "Maintaining student attendance records",
      "Preparing lesson plans and materials",
      "Communicating with parents/guardians",
      "Participating in department meetings"
    ],
    "performanceMetrics": {
      "studentRetentionTarget": 85,
      "averageScoreTarget": 75,
      "completionRateTarget": 90,
      "attendanceRequirement": 95
    },
    "termsAndConditions": {
      "probationPeriod": "3 months",
      "noticePeriod": "30 days",
      "renewalTerms": "based on performance and student feedback",
      "terminationClause": "for cause or mutual agreement",
      "confidentialityClause": true,
      "nonCompeteClause": false
    },
    "signatures": {
      "staffMember": {
        "name": "Fatima Rahimi",
        "signature": "digital_signature_base64",
        "date": "2024-01-15"
      },
      "schoolRepresentative": {
        "name": "School Administrator",
        "title": "Principal",
        "signature": "admin_signature_base64",
        "date": "2024-01-15"
      },
      "witness": {
        "name": "Department Head",
        "signature": "witness_signature_base64",
        "date": "2024-01-15"
      }
    }
  }
}
```

#### **Course Contract Document Fields**
```json
{
  "contractDocument": {
    "fileName": "course_contract_eng_l1_2024.pdf",
    "fileType": "application/pdf",
    "fileSize": "2.8MB",
    "uploadDate": "2024-01-15T10:00:00Z",
    "documentType": "course-contract",
    "templateVersion": "v2.1",
    "generatedBy": "system",
    "status": "active",
    "expiryDate": "2024-12-31"
  }
}
```

### Course Contract Generation API

#### **Create Course Contract Endpoint**
```
POST /api/staff/course-contract
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userId": 123,
  "courseId": 1,
  "contractTemplate": "standard-course",
  "customTerms": {
    "salaryPercentage": 25,
    "bonusStructure": {
      "studentRetentionBonus": 7,
      "performanceBonus": 12
    }
  },
  "scheduleDetails": {
    "preferredShifts": ["morning"],
    "maxWeeklyHours": 30
  }
}
```

#### **Contract Generation Response**
```json
{
  "success": true,
  "message": "Course contract generated successfully",
  "data": {
    "contractId": "CC-2024-ENG-001",
    "contractUrl": "/downloads/contracts/CC-2024-ENG-001.pdf",
    "previewUrl": "/preview/contracts/CC-2024-ENG-001",
    "expiryDate": "2024-12-31",
    "autoRenewalEnabled": true,
    "notificationSettings": {
      "expiryReminder": "30 days before",
      "renewalReminder": "15 days before"
    }
  }
}
```

### Contract Variations

#### **Fixed Salary Course Contract**
```json
{
  "courseContract": {
    "contractId": "CC-2024-MATH-002",
    "contractType": "course-based-fixed",
    "financialTerms": {
      "salaryType": "fixed",
      "monthlyAmount": 8500,
      "currency": "AFN",
      "paymentSchedule": {
        "payDay": "25th",
        "paymentMethod": "bank-transfer",
        "overtimeRate": 1.5
      },
      "allowances": {
        "housing": 1000,
        "transport": 500,
        "medical": 300
      }
    }
  }
}
```

#### **Per-Student Course Contract**
```json
{
  "courseContract": {
    "contractId": "CC-2024-SCI-003",
    "contractType": "course-based-per-student",
    "financialTerms": {
      "salaryType": "perStudent",
      "amountPerStudent": 2500,
      "maxStudents": 25,
      "minimumGuarantee": 10000,
      "currency": "AFN",
      "paymentTerms": {
        "advancePayment": 50,
        "balancePayment": "monthly",
        "studentRegistrationDeadline": "2024-02-15"
      }
    }
  }
}
```

### Contract Management Features

#### **Contract Status Tracking**
```json
{
  "contractStatus": {
    "currentStatus": "active",
    "statusHistory": [
      {
        "status": "draft",
        "date": "2024-01-10",
        "changedBy": "system"
      },
      {
        "status": "pending_signature",
        "date": "2024-01-12",
        "changedBy": "admin"
      },
      {
        "status": "active",
        "date": "2024-01-15",
        "changedBy": "system"
      }
    ],
    "nextReviewDate": "2024-06-15",
    "renewalEligibility": true
  }
}
```

#### **Contract Amendments**
```json
{
  "contractAmendment": {
    "amendmentId": "CA-2024-001",
    "contractId": "CC-2024-ENG-001",
    "amendmentType": "salary_adjustment",
    "effectiveDate": "2024-07-01",
    "changes": {
      "oldSalaryPercentage": 20,
      "newSalaryPercentage": 25,
      "reason": "Excellent performance and increased enrollment"
    },
    "approvalStatus": "pending",
    "requestedBy": "admin",
    "approvedBy": null,
    "approvalDate": null
  }
}
```

### Contract Templates

#### **Standard Course Contract Template**
```json
{
  "contractTemplate": {
    "templateId": "standard-course-v2",
    "templateName": "Standard Course Teaching Contract",
    "applicableFor": ["teacher", "instructor", "trainer"],
    "sections": [
      "parties_information",
      "course_details",
      "employment_terms",
      "financial_compensation",
      "work_schedule",
      "responsibilities",
      "performance_expectations",
      "terms_and_conditions",
      "signatures"
    ],
    "customizableFields": [
      "salary_percentage",
      "bonus_structure",
      "work_schedule",
      "special_terms"
    ],
    "requiredFields": [
      "staff_member_signature",
      "school_signature",
      "contract_dates"
    ]
  }
}
```

### Contract Integration with HR System

#### **Contract-User Linking**
```json
{
  "contractIntegration": {
    "userId": 123,
    "linkedContracts": [
      {
        "contractId": "CC-2024-ENG-001",
        "courseId": 1,
        "status": "active",
        "linkDate": "2024-01-15"
      },
      {
        "contractId": "CC-2024-MATH-002",
        "courseId": 3,
        "status": "pending",
        "linkDate": "2024-02-01"
      }
    ],
    "totalActiveContracts": 1,
    "totalPendingContracts": 1,
    "contractHistory": [
      {
        "contractId": "CC-2023-ENG-099",
        "courseId": 1,
        "status": "completed",
        "completionDate": "2023-12-31"
      }
    ]
  }
}
```

## Multi-Scenario HR User Management

### **Scenario 1: New HR User with Course Assignment**
Create a new HR user and immediately assign them to specific courses with full metadata integration.

#### **API Endpoint**
```
POST /api/staff/create-with-courses
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userCreation": {
    "firstName": "Ahmad",
    "lastName": "Khan",
    "fatherName": "Mohammad Khan",
    "email": "ahmad.khan@school.com",
    "phone": "+937123456789",
    "gender": "MALE",
    "birthDate": "1985-05-15",
    "currentAddress": "Kabul, District 5, Afghanistan",
    "originAddress": "Mazar-i-Sharif, Afghanistan",
    "nationalIdCardNo": "9876543210",
    "employeeId": "MATH001",
    "designation": "Mathematics Teacher",
    "departmentId": 2,
    "joiningDate": "2024-01-15",
    "salary": 45000,
    "schoolId": 1,
    "branchId": 1,
    "timezone": "Asia/Kabul",
    "locale": "en-US",
    "username": "ahmad.khan",
    "password": "Hr@12345",
    "role": "STAFF",
    "status": "ACTIVE",
    "relativesInfo": [
      {
        "name": "Ali Khan",
        "phone": "+937123456787",
        "relation": "Brother"
      }
    ],
    "documents": {
      "cv": {
        "fileName": "ahmad_cv.pdf",
        "fileType": "application/pdf",
        "fileSize": "2.5MB",
        "uploadDate": "2024-01-15T10:00:00Z"
      },
      "degreeDocument": {
        "fileName": "bachelor_degree.pdf",
        "fileType": "application/pdf",
        "fileSize": "1.8MB",
        "uploadDate": "2024-01-15T10:00:00Z"
      }
    }
  },
  "courseAssignments": [
    {
      "courseId": 1,
      "courseName": "Mathematics - Level 1",
      "salary": {
        "type": "percentage",
        "percentage": 20,
        "studentFeeRange": {
          "minimum": 8000,
          "maximum": 15000,
          "average": 10000
        },
        "estimatedEarnings": {
          "minimum": 1600,
          "maximum": 3000,
          "average": 2000,
          "currency": "AFN",
          "paymentFrequency": "monthly"
        }
      },
      "schedule": {
        "shift": "morning",
        "days": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
        "startTime": "08:00",
        "endTime": "12:00",
        "roomNumber": "A101"
      },
      "contract": {
        "autoGenerate": true,
        "template": "standard-course",
        "customTerms": {
          "probationPeriod": "2 months",
          "bonusStructure": {
            "studentRetentionBonus": 7,
            "performanceBonus": 12
          }
        }
      }
    }
  ],
  "metadata": {
    "coursePreferences": {
      "preferredShifts": ["morning", "evening"],
      "preferredSubjects": ["Mathematics", "Physics", "Statistics"],
      "maxCoursesPerTerm": 3,
      "preferredRoomTypes": ["classroom", "lab"]
    },
    "salaryHistory": [],
    "performanceMetrics": {
      "targetStudentRetention": 85,
      "targetAverageScore": 75,
      "targetCompletionRate": 90
    }
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "HR user created and assigned to courses successfully",
  "data": {
    "userId": 123,
    "employeeId": "MATH001",
    "userStatus": "ACTIVE",
    "courseAssignments": [
      {
        "courseId": 1,
        "assignmentId": "CA-2024-001",
        "status": "active",
        "contractId": "CC-2024-MATH-001"
      }
    ],
    "generatedContracts": [
      {
        "contractId": "CC-2024-MATH-001",
        "contractUrl": "/downloads/contracts/CC-2024-MATH-001.pdf",
        "previewUrl": "/preview/contracts/CC-2024-MATH-001"
      }
    ],
    "createdMetadata": {
      "coursePreferences": "saved",
      "salaryStructure": "configured",
      "scheduleAssignments": "confirmed"
    }
  }
}
```

### **Scenario 2: Add Existing School User to Course**
Find an existing user in the school system and add them to a new course with enhanced metadata.

#### **API Endpoint**
```
POST /api/staff/add-existing-user-to-course
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userIdentification": {
    "searchMethod": "email", // Options: "email", "nationalId", "employeeId", "phone"
    "searchValue": "fatima.rahimi@school.com",
    "schoolId": 1 // Restrict search to specific school
  },
  "courseAssignment": {
    "courseId": 2,
    "courseName": "English Language - Level 2",
    "role": "teacher",
    "salary": {
      "type": "percentage",
      "percentage": 25,
      "studentFeeRange": {
        "minimum": 9000,
        "maximum": 18000,
        "average": 12000
      },
      "estimatedEarnings": {
        "minimum": 2250,
        "maximum": 4500,
        "average": 3000,
        "currency": "AFN",
        "paymentFrequency": "monthly"
      }
    },
    "schedule": {
      "shift": "evening",
      "days": ["Thursday", "Friday"],
      "startTime": "16:00",
      "endTime": "20:00",
      "roomNumber": "B205"
    },
    "startDate": "2024-02-01",
    "contract": {
      "autoGenerate": true,
      "template": "standard-course",
      "customTerms": {
        "probationPeriod": "1 month", // Shorter for existing users
        "noticePeriod": "15 days",
        "bonusStructure": {
          "studentRetentionBonus": 10,
          "performanceBonus": 15
        }
      }
    }
  },
  "metadataUpdate": {
    "addCoursePreferences": true,
    "updateSalaryHistory": true,
    "preserveExistingMetadata": true,
    "newCoursePreferences": {
      "preferredShifts": ["morning", "evening"],
      "preferredSubjects": ["English", "Dari", "Literature"],
      "maxCoursesPerTerm": 4,
      "preferredRoomTypes": ["classroom", "lab", "computer-lab"]
    }
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "Existing user added to course successfully",
  "data": {
    "userId": 456,
    "existingUser": true,
    "userDetails": {
      "name": "Fatima Rahimi",
      "employeeId": "ENG001",
      "currentRole": "STAFF",
      "previousCourses": ["courseId": 1],
      "totalExperience": "8 years"
    },
    "newCourseAssignment": {
      "courseId": 2,
      "assignmentId": "CA-2024-002",
      "status": "active",
      "contractId": "CC-2024-ENG-002"
    },
    "updatedMetadata": {
      "coursePreferences": "updated",
      "salaryHistory": "new_entry_added",
      "totalActiveCourses": 2
    },
    "generatedContract": {
      "contractId": "CC-2024-ENG-002",
      "contractUrl": "/downloads/contracts/CC-2024-ENG-002.pdf",
      "previewUrl": "/preview/contracts/CC-2024-ENG-002"
    }
  }
}
```

### **Scenario 3: Add Course to Existing HR User**
Add a new course assignment to an existing HR user who already has course assignments.

#### **API Endpoint**
```
POST /api/staff/add-course-to-existing-staff
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userId": 123,
  "newCourseAssignment": {
    "courseId": 3,
    "courseName": "Physics - Advanced",
    "role": "teacher",
    "salary": {
      "type": "fixed", // Different from existing percentage-based
      "monthlyAmount": 7500,
      "currency": "AFN",
      "paymentSchedule": {
        "payDay": "25th",
        "paymentMethod": "bank-transfer"
      },
      "allowances": {
        "housing": 1000,
        "transport": 500,
        "labEquipment": 300
      }
    },
    "schedule": {
      "shift": "morning",
      "days": ["Monday", "Wednesday", "Friday"],
      "startTime": "09:00",
      "endTime": "13:00",
      "roomNumber": "LAB-301"
    },
    "startDate": "2024-03-01",
    "contract": {
      "autoGenerate": true,
      "template": "advanced-course", // Different template for advanced courses
      "customTerms": {
        "probationPeriod": "1 month",
        "specialRequirements": [
          "Lab safety certification",
          "Advanced physics knowledge",
          "Research experience"
        ],
        "bonusStructure": {
          "researchBonus": 20,
          "equipmentHandlingBonus": 10,
          "studentPerformanceBonus": 15
        }
      }
    }
  },
  "metadataUpdate": {
    "appendToCoursePreferences": true,
    "updateSalaryHistory": true,
    "newCourseMetadata": {
      "courseId": 3,
      "difficulty": "advanced",
      "labRequired": true,
      "equipmentNeeded": ["microscope", "physics-kit", "computer"],
      "specializations": ["quantum-physics", "mechanics"]
    }
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "Course added to existing HR user successfully",
  "data": {
    "userId": 123,
    "userName": "Ahmad Khan",
    "totalCourses": 3,
    "newAssignment": {
      "courseId": 3,
      "assignmentId": "CA-2024-003",
      "status": "active",
      "contractId": "CC-2024-PHY-003"
    },
    "updatedProfile": {
      "courseAssignments": "updated",
      "salaryStructures": "mixed_types", // Now has both percentage and fixed
      "totalEstimatedEarnings": {
        "monthly": "9500 AFN", // Combined from multiple courses
        "annual": "114000 AFN"
      }
    },
    "generatedContract": {
      "contractId": "CC-2024-PHY-003",
      "contractUrl": "/downloads/contracts/CC-2024-PHY-003.pdf",
      "previewUrl": "/preview/contracts/CC-2024-PHY-003"
    }
  }
}
```

### **Scenario 4: Bulk Course Assignment to Multiple HR Users**
Assign multiple HR users to multiple courses in a single operation.

#### **API Endpoint**
```
POST /api/staff/bulk-course-assignment
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "bulkAssignment": {
    "operationType": "course-assignment", // Options: "course-assignment", "contract-generation", "metadata-update"
    "schoolId": 1,
    "academicTerm": "spring-2024"
  },
  "assignments": [
    {
      "userId": 123,
      "courseId": 1,
      "salary": {
        "type": "percentage",
        "percentage": 20
      }
    },
    {
      "userId": 456,
      "courseId": 2,
      "salary": {
        "type": "percentage",
        "percentage": 25
      }
    },
    {
      "userId": 789,
      "courseId": 3,
      "salary": {
        "type": "fixed",
        "monthlyAmount": 6000
      }
    }
  ],
  "globalSettings": {
    "autoGenerateContracts": true,
    "contractTemplate": "standard-course",
    "updateMetadata": true,
    "notificationSettings": {
      "notifyUsers": true,
      "notifyAdmins": true,
      "sendEmailConfirmation": true
    }
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "Bulk course assignment completed successfully",
  "data": {
    "processedAssignments": 3,
    "successfulAssignments": 3,
    "failedAssignments": 0,
    "generatedContracts": 3,
    "updatedUsers": 3,
    "summary": {
      "totalEstimatedMonthlyPayout": "17500 AFN",
      "totalContractsGenerated": 3,
      "averageSalaryPerUser": "5833 AFN"
    },
    "details": [
      {
        "userId": 123,
        "status": "success",
        "contractId": "CC-2024-001",
        "courseId": 1
      },
      {
        "userId": 456,
        "status": "success",
        "contractId": "CC-2024-002",
        "courseId": 2
      },
      {
        "userId": 789,
        "status": "success",
        "contractId": "CC-2024-003",
        "courseId": 3
      }
    ]
  }
}
```

## System Support for Multi-Scenario Operations

### **User Detection and Validation**
The system automatically handles user detection and validation across all scenarios:

#### **User Search Methods**
```json
{
  "userSearch": {
    "searchMethods": [
      {
        "method": "email",
        "validation": "email_format",
        "uniqueness": true
      },
      {
        "method": "nationalId",
        "validation": "national_id_format",
        "uniqueness": true
      },
      {
        "method": "employeeId",
        "validation": "employee_id_format",
        "uniqueness": true
      },
      {
        "method": "phone",
        "validation": "phone_format",
        "uniqueness": false
      }
    ],
    "schoolScope": true, // Restrict search to specific school
    "branchScope": false, // Optional branch restriction
    "activeUserOnly": true // Only search active users
  }
}
```

### **Metadata Management**
The system intelligently manages metadata across different scenarios:

#### **Metadata Merge Strategy**
```json
{
  "metadataMerge": {
    "strategy": "intelligent_merge",
    "rules": {
      "existingData": "preserve",
      "newData": "append",
      "conflicts": "new_wins",
      "historyTracking": "always"
    },
    "mergeOperations": {
      "coursePreferences": {
        "existing": ["morning", "English"],
        "new": ["evening", "Physics"],
        "result": ["morning", "evening", "English", "Physics"]
      },
      "salaryHistory": {
        "existing": [{"type": "percentage", "amount": 20}],
        "new": {"type": "fixed", "amount": 6000},
        "result": [
          {"type": "percentage", "amount": 20, "courseId": 1},
          {"type": "fixed", "amount": 6000, "courseId": 3}
        ]
      },
      "performanceMetrics": {
        "existing": {"retention": 85},
        "new": {"target": 90},
        "result": {"retention": 85, "target": 90}
      }
    }
  }
}
```

### **Contract Generation Logic**
Automated contract generation based on scenario and user type:

#### **Contract Generation Rules**
```json
{
  "contractGeneration": {
    "triggers": {
      "newUser": "auto_generate",
      "existingUser": "generate_on_new_course",
      "bulkAssignment": "generate_for_each"
    },
    "templateSelection": {
      "newUser": "standard-course",
      "existingUser": "standard-course",
      "advancedCourse": "advanced-course",
      "labCourse": "lab-course"
    },
    "customization": {
      "allowCustomTerms": true,
      "requireApproval": false,
      "autoSign": false
    }
  }
}
```

## Cross-System User Management Operations

### **Scenario 5: HR User Creation for Course (Non-School Person)**
Create a new HR user who is not currently in the school system but needs to be added to a specific course.

#### **API Endpoint**
```
POST /api/staff/create-course-only-user
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userCreation": {
    "firstName": "Abdullah",
    "lastName": "Karimi",
    "fatherName": "Ghulam Karimi",
    "email": "abdullah.karimi@school.com",
    "phone": "+937123456789",
    "gender": "MALE",
    "birthDate": "1982-03-20",
    "currentAddress": "Kabul, District 3, Afghanistan",
    "originAddress": "Jalalabad, Afghanistan",
    "nationalIdCardNo": "4567890123",
    "employeeId": "SCI001",
    "designation": "Science Teacher",
    "departmentId": 3,
    "joiningDate": "2024-01-15",
    "salary": 55000,
    "schoolId": 1,
    "branchId": 1,
    "timezone": "Asia/Kabul",
    "locale": "en-US",
    "username": "abdullah.karimi",
    "password": "Hr@12345",
    "role": "STAFF",
    "status": "ACTIVE",
    "relativesInfo": [
      {
        "name": "Saeed Karimi",
        "phone": "+937123456788",
        "relation": "Brother"
      }
    ],
    "documents": {
      "cv": {
        "fileName": "abdullah_cv.pdf",
        "fileType": "application/pdf",
        "fileSize": "3.2MB",
        "uploadDate": "2024-01-15T10:00:00Z"
      },
      "degreeDocument": {
        "fileName": "masters_degree.pdf",
        "fileType": "application/pdf",
        "fileSize": "2.8MB",
        "uploadDate": "2024-01-15T10:00:00Z"
      }
    }
  },
  "courseAssignment": {
    "courseId": 4,
    "courseName": "Physics - Advanced",
    "role": "teacher",
    "salary": {
      "type": "percentage",
      "percentage": 18,
      "studentFeeRange": {
        "minimum": 10000,
        "maximum": 20000,
        "average": 15000
      },
      "estimatedEarnings": {
        "minimum": 1800,
        "maximum": 3600,
        "average": 2700,
        "currency": "AFN",
        "paymentFrequency": "monthly"
      }
    },
    "schedule": {
      "shift": "morning",
      "days": ["Monday", "Tuesday", "Thursday", "Friday"],
      "startTime": "09:00",
      "endTime": "13:00",
      "roomNumber": "LAB-401"
    },
    "startDate": "2024-01-15",
    "contract": {
      "autoGenerate": true,
      "template": "advanced-course",
      "customTerms": {
        "probationPeriod": "3 months",
        "specialRequirements": [
          "Science teaching certification",
          "Laboratory safety training",
          "Advanced physics knowledge"
        ],
        "bonusStructure": {
          "labBonus": 15,
          "researchBonus": 10,
          "studentPerformanceBonus": 12
        }
      }
    }
  },
  "metadata": {
    "coursePreferences": {
      "preferredShifts": ["morning", "evening"],
      "preferredSubjects": ["Physics", "Chemistry", "Mathematics"],
      "maxCoursesPerTerm": 3,
      "preferredRoomTypes": ["classroom", "lab", "computer-lab"]
    },
    "salaryHistory": [],
    "performanceMetrics": {
      "targetStudentRetention": 88,
      "targetAverageScore": 80,
      "targetCompletionRate": 92
    }
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "Course-only HR user created successfully",
  "data": {
    "userId": 789,
    "employeeId": "SCI001",
    "userStatus": "ACTIVE",
    "courseAssignment": {
      "courseId": 4,
      "assignmentId": "CA-2024-004",
      "status": "active",
      "contractId": "CC-2024-PHY-004"
    },
    "generatedContract": {
      "contractId": "CC-2024-PHY-004",
      "contractUrl": "/downloads/contracts/CC-2024-PHY-004.pdf",
      "previewUrl": "/preview/contracts/CC-2024-PHY-004"
    },
    "createdMetadata": {
      "coursePreferences": "saved",
      "salaryStructure": "configured",
      "scheduleAssignments": "confirmed"
    }
  }
}
```

### **Scenario 6: Add Course-Only User to School**
Add a user who exists in course system but not in school HR system.

#### **API Endpoint**
```
POST /api/staff/add-course-user-to-school
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userIdentification": {
    "searchMethod": "email", // Options: "email", "nationalId", "courseId"
    "searchValue": "sarah.ahmadi@school.com",
    "courseSystemId": "course-management-system", // Identify course system
    "schoolId": 1 // Target school for HR assignment
  },
  "schoolAssignment": {
    "role": "STAFF",
    "departmentId": 2,
    "salary": {
      "type": "fixed", // School HR can override course salary
      "monthlyAmount": 48000,
      "currency": "AFN",
      "paymentSchedule": {
        "payDay": "25th",
        "paymentMethod": "bank-transfer",
        "effectiveDate": "2024-02-01"
      },
      "allowances": {
        "housing": 800,
        "transport": 400,
        "medical": 250
      }
    },
    "hrPermissions": {
      "canCreateUsers": false,
      "canManageCourses": false,
      "canViewReports": true,
      "canManageAttendance": true,
      "canManagePayroll": false
    },
    "contract": {
      "autoGenerate": true,
      "template": "school-hr-contract",
      "customTerms": {
        "probationPeriod": "2 months",
        "noticePeriod": "30 days",
        "schoolPolicies": ["HR manual compliance", "Staff conduct guidelines"]
      }
    }
  },
  "metadataUpdate": {
    "preserveCourseData": true,
    "addHRMetadata": true,
    "mergeWithExisting": false, // No existing HR record
    "updatePermissions": true
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "Course user added to school HR system successfully",
  "data": {
    "userId": 1011,
    "hrUserId": 1011,
    "courseUserId": "CU-2023-045", // Previous course system ID
    "schoolRole": "STAFF",
    "hrPermissions": {
      "canViewReports": true,
      "canManageAttendance": true,
      "canManagePayroll": false
    },
    "generatedContract": {
      "contractId": "SC-HR-2024-001",
      "contractUrl": "/downloads/contracts/SC-HR-2024-001.pdf",
      "previewUrl": "/preview/contracts/SC-HR-2024-001"
    },
    "integrationStatus": {
      "courseSystemAccess": "maintained",
      "schoolSystemAccess": "granted",
      "dualSystemAccess": true
    }
  }
}
```

### **Scenario 7: School User to Course Assignment**
Add a school HR user to a course in the course management system.

#### **API Endpoint**
```
POST /api/staff/add-school-user-to-course
Content-Type: application/json
Authorization: Bearer {token}
```

#### **Request Body**
```json
{
  "userIdentification": {
    "searchMethod": "hrUserId", // Options: "hrUserId", "email", "employeeId"
    "searchValue": "123", // HR user ID
    "schoolId": 1
  },
  "courseAssignment": {
    "courseId": 5,
    "courseName": "Chemistry - Organic",
    "courseSystem": "course-management-system",
    "role": "teacher",
    "salary": {
      "type": "percentage", // Course system salary takes precedence
      "percentage": 22,
      "studentFeeRange": {
        "minimum": 9000,
        "maximum": 18000,
        "average": 12000
      },
      "estimatedEarnings": {
        "minimum": 1980,
        "maximum": 3960,
        "average": 2640,
        "currency": "AFN",
        "paymentFrequency": "monthly"
      }
    },
    "schedule": {
      "shift": "evening",
      "days": ["Tuesday", "Wednesday", "Thursday", "Saturday"],
      "startTime": "16:00",
      "endTime": "20:00",
      "roomNumber": "LAB-502"
    },
    "startDate": "2024-02-01",
    "contract": {
      "autoGenerate": true,
      "template": "cross-system-course",
      "customTerms": {
        "probationPeriod": "1 month",
        "crossSystemCoordination": true,
        "dualReporting": true
      }
    }
  },
  "metadataUpdate": {
    "addCourseMetadata": true,
    "updateSalaryHistory": true,
    "maintainHRPermissions": true,
    "crossSystemSync": true
  }
}
```

#### **System Response**
```json
{
  "success": true,
  "message": "School HR user assigned to course successfully",
  "data": {
    "hrUserId": 123,
    "courseAssignmentId": "CA-2024-005",
    "courseSystemAccess": "granted",
    "dualSystemRole": {
      "schoolSystem": "STAFF",
      "courseSystem": "TEACHER"
    },
    "generatedContract": {
      "contractId": "CC-2024-CHEM-005",
      "contractUrl": "/downloads/contracts/CC-2024-CHEM-005.pdf",
      "previewUrl": "/preview/contracts/CC-2024-CHEM-005"
    },
    "crossSystemStatus": {
      "schoolHR": "updated",
      "courseManagement": "assigned",
      "syncStatus": "active"
    }
  }
}
```

## Validation Examples and Testing

### **Field Validation Examples**

#### **Email Validation**
```javascript
// Valid Email Examples
const validEmails = [
  "user@school.com",
  "name.surname@domain.org",
  "teacher123@school.edu",
  "first.last@school.af"
];

// Invalid Email Examples
const invalidEmails = [
  "user@",                    // Missing domain
  "@domain.com",              // Missing local part
  "user@.com",                // Invalid domain format
  "user..name@domain.com",    // Double dots
  "user@domain",              // Missing TLD
  "user name@domain.com",     // Space in local part
  "user@domain..com"           // Double dots in domain
];

// Validation Pattern
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

#### **Phone Number Validation**
```javascript
// Valid Phone Examples (Afghanistan format)
const validPhones = [
  "+937123456789",  // International format
  "0712345678",     // Local format
  "+93 71 234 5678" // With spaces
];

// Invalid Phone Examples
const invalidPhones = [
  "123",              // Too short
  "abc123",           // Contains letters
  "+123456789012345", // Too long
  "+93712345678",     // Too short for Afghanistan
  "07123456789"       // Too long for local format
];

// Validation Pattern
const phonePattern = /^(\+93)?[0-9]{10}$/;
```

#### **Salary Validation**
```javascript
// Valid Salary Examples
const validSalaries = [
  5000,           // Integer
  5000.50,        // Decimal
  "5000",         // String number
  "5000.50",      // String decimal
  0,              // Zero (with warning)
  1000000         // Large number
];

// Invalid Salary Examples
const invalidSalaries = [
  -1000,          // Negative
  0,              // Zero (if not allowed)
  "abc",          // Non-numeric
  null,           // Null value
  undefined,      // Undefined
  Infinity,       // Infinite
  NaN             // Not a Number
];

// Validation Function
function validateSalary(salary) {
  const num = Number(salary);
  return !isNaN(num) && num > 0 && num <= 1000000;
}
```

#### **Date Validation**
```javascript
// Valid Date Examples
const validDates = [
  "2024-01-15",           // ISO format
  "2024/01/15",           // Slash format
  new Date("2024-01-15"), // Date object
  "15-01-2024"            // Day-Month-Year
];

// Invalid Date Examples
const invalidDates = [
  "2024-13-15",           // Invalid month
  "2024-02-30",           // Invalid day
  "15/13/2024",           // Invalid month
  "abc-def-ghi",          // Non-date string
  null,                   // Null value
  undefined               // Undefined
];

// Validation Function
function validateDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
```

### **Comprehensive Test Scenarios**

#### **Positive Test Cases**
```javascript
const positiveTests = [
  {
    name: "Create User with All Valid Fields",
    input: {
      firstName: "Ahmad",
      lastName: "Khan",
      fatherName: "Mohammad Khan",
      email: "ahmad.khan@school.com",
      phone: "+937123456789",
      gender: "MALE",
      birthDate: "1985-05-15",
      designation: "Mathematics Teacher",
      role: "TEACHER",
      subjectsCanTeach: ["Mathematics", "Physics"],
      salary: 50000,
      schoolId: 1
    },
    expected: "success"
  },
  {
    name: "Create User with Minimum Required Fields",
    input: {
      firstName: "Sara",
      lastName: "Ahmadi",
      fatherName: "Abdul Ahmadi",
      email: "sara.ahmadi@school.com",
      designation: "HR Manager",
      role: "HRM",
      schoolId: 1
    },
    expected: "success"
  },
  {
    name: "Create User with Course Assignment",
    input: {
      firstName: "Zahra",
      lastName: "Hussaini",
      fatherName: "Ali Hussaini",
      email: "zahra.hussaini@school.com",
      designation: "Course Coordinator",
      role: "COURSE_MANAGER",
      schoolId: 1,
      courseAssignments: [
        {
          courseId: 1,
          salary: { type: "percentage", percentage: 20 }
        }
      ]
    },
    expected: "success"
  }
];
```

#### **Negative Test Cases**
```javascript
const negativeTests = [
  {
    name: "Duplicate Email",
    input: {
      firstName: "Test",
      lastName: "User",
      fatherName: "Test Father",
      email: "existing.user@school.com", // Already exists
      designation: "Teacher",
      role: "TEACHER",
      schoolId: 1
    },
    expected: "error",
    expectedMessage: "Email already exists"
  },
  {
    name: "Invalid Role",
    input: {
      firstName: "Test",
      lastName: "User",
      fatherName: "Test Father",
      email: "test.user@school.com",
      designation: "Teacher",
      role: "INVALID_ROLE", // Not in enum
      schoolId: 1
    },
    expected: "error",
    expectedMessage: "Invalid role specified"
  },
  {
    name: "Missing Required Fields",
    input: {
      firstName: "Test",
      // Missing lastName, fatherName, email, designation, role, schoolId
    },
    expected: "error",
    expectedMessage: "Required fields missing"
  },
  {
    name: "Invalid Email Format",
    input: {
      firstName: "Test",
      lastName: "User",
      fatherName: "Test Father",
      email: "invalid-email", // Invalid format
      designation: "Teacher",
      role: "TEACHER",
      schoolId: 1
    },
    expected: "error",
    expectedMessage: "Invalid email format"
  },
  {
    name: "Negative Salary",
    input: {
      firstName: "Test",
      lastName: "User",
      fatherName: "Test Father",
      email: "test.user@school.com",
      designation: "Teacher",
      role: "TEACHER",
      salary: -1000, // Negative value
      schoolId: 1
    },
    expected: "error",
    expectedMessage: "Salary must be positive"
  }
];
```

#### **Edge Case Tests**
```javascript
const edgeCaseTests = [
  {
    name: "Maximum Field Lengths",
    input: {
      firstName: "A".repeat(50), // Max length
      lastName: "B".repeat(50),
      fatherName: "C".repeat(50),
      email: "max.length.user@school.com",
      designation: "D".repeat(100), // Max length
      role: "TEACHER",
      schoolId: 1
    },
    expected: "success"
  },
  {
    name: "Unicode Characters",
    input: {
      firstName: "أحمد", // Arabic characters
      lastName: "خان",
      fatherName: "محمد خان",
      email: "ahmad.khan@school.com",
      designation: "معلم ریاضی",
      role: "TEACHER",
      schoolId: 1
    },
    expected: "success"
  },
  {
    name: "Special Characters in Name",
    input: {
      firstName: "Jean-Claude", // Hyphen
      lastName: "O'Connor", // Apostrophe
      fatherName: "Muhammad Ali", // Space
      email: "jean.claude@school.com",
      designation: "Language Teacher",
      role: "TEACHER",
      schoolId: 1
    },
    expected: "success"
  }
];
```

### **Performance Testing Scenarios**

#### **Load Testing**
```javascript
const loadTestScenarios = [
  {
    name: "Bulk User Creation",
    description: "Create 1000 users simultaneously",
    config: {
      concurrentUsers: 100,
      totalUsers: 1000,
      rampUpTime: "30s",
      testDuration: "5m"
    },
    expectedMetrics: {
      averageResponseTime: "< 2s",
      errorRate: "< 1%",
      throughput: "> 20 users/second"
    }
  },
  {
    name: "Large File Upload",
    description: "Upload maximum size documents",
    config: {
      fileSize: "5MB",
      concurrentUploads: 10,
      fileTypes: ["PDF", "DOCX", "JPG"]
    },
    expectedMetrics: {
      averageUploadTime: "< 10s",
      errorRate: "< 0.5%",
      memoryUsage: "< 500MB"
    }
  }
];
```

## Security Implementation Guidelines

### **Input Sanitization**
```javascript
// Security: Input sanitization functions
const sanitizeInput = {
  email: (email) => email.toLowerCase().trim(),
  name: (name) => name.replace(/[<>]/g, '').trim(),
  phone: (phone) => phone.replace(/[^\d+]/g, ''),
  text: (text) => text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
};
```

### **Rate Limiting**
```javascript
// Security: Rate limiting configuration
const rateLimitConfig = {
  userCreation: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many user creation attempts, please try again later"
  },
  fileUpload: {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Too many file upload attempts, please try again later"
  }
};
```

### **Audit Logging**
```javascript
// Security: Audit logging structure
const auditLog = {
  timestamp: "2024-01-15T10:30:00Z",
  userId: "admin_user_id",
  action: "CREATE_HR_USER",
  targetUserId: "created_user_id",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  requestData: {
    firstName: "Ahmad",
    lastName: "Khan",
    email: "ahmad.khan@school.com",
    role: "TEACHER"
  },
  result: "SUCCESS",
  changes: {
    before: null,
    after: {
      userId: 123,
      status: "ACTIVE",
      createdAt: "2024-01-15T10:30:00Z"
    }
  }
};
```

### **Data Encryption**
```javascript
// Security: Sensitive data encryption
const encryptionConfig = {
  algorithm: "AES-256-GCM",
  keyRotation: "90 days",
  fieldsToEncrypt: [
    "nationalIdCardNo",
    "phone",
    "bankAccountNumber",
    "salary",
    "relativesInfo"
  ]
};
```

## Performance Optimization Guidelines

### **Database Optimization**
```javascript
// Performance: Database indexing strategy
const databaseIndexes = [
  "CREATE INDEX idx_users_email ON users(email)",
  "CREATE INDEX idx_users_school_id ON users(school_id)",
  "CREATE INDEX idx_users_role ON users(role)",
  "CREATE INDEX idx_users_status ON users(status)",
  "CREATE INDEX idx_users_created_at ON users(created_at)",
  "CREATE INDEX idx_staff_employee_id ON staff(employee_id)",
  "CREATE INDEX idx_staff_school_id ON staff(school_id)"
];
```

### **Caching Strategy**
```javascript
// Performance: Caching configuration
const cacheConfig = {
  userProfiles: {
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  schoolData: {
    ttl: 7200, // 2 hours
    maxSize: 100
  },
  validationRules: {
    ttl: 86400, // 24 hours
    maxSize: 50
  }
};
```

### **File Upload Optimization**
```javascript
// Performance: File upload optimization
const uploadOptimization = {
  streaming: true,
  chunkSize: 1024 * 1024, // 1MB chunks
  maxConcurrentUploads: 5,
  compression: {
    enabled: true,
    level: 6,
    formats: ["PDF", "DOCX", "JPG", "PNG"]
  },
  virusScanning: {
    enabled: true,
    async: true,
    timeout: 30000 // 30 seconds
  }
};
```

## Monitoring and Analytics

### **Key Performance Indicators**
```javascript
// Monitoring: KPI definitions
const kpis = {
  userCreation: {
    dailyNewUsers: "Count of new users created per day",
    averageCreationTime: "Average time to create a user",
    errorRate: "Percentage of failed user creations",
    peakHours: "Hours with highest user creation activity"
  },
  systemPerformance: {
    apiResponseTime: "Average API response time",
    databaseQueryTime: "Average database query execution time",
    memoryUsage: "System memory consumption",
    cpuUsage: "System CPU utilization"
  },
  fileOperations: {
    uploadSuccessRate: "Percentage of successful file uploads",
    averageUploadSize: "Average size of uploaded files",
    storageUsage: "Total storage consumption",
    uploadSpeed: "Average file upload speed"
  }
};
```

### **Alert Configuration**
```javascript
// Monitoring: Alert thresholds
const alerts = {
  errorRate: {
    threshold: 5, // 5% error rate
    window: "5m",
    action: "notify_admins"
  },
  responseTime: {
    threshold: 3000, // 3 seconds
    window: "1m",
    action: "log_warning"
  },
  memoryUsage: {
    threshold: 80, // 80% memory usage
    window: "1m",
    action: "scale_up"
  },
  diskSpace: {
    threshold: 90, // 90% disk usage
    window: "5m",
    action: "cleanup_and_notify"
  }
};
```

### **Analytics Dashboard**
```javascript
// Monitoring: Dashboard metrics
const dashboardMetrics = {
  overview: {
    totalUsers: "Total number of HR users",
    activeUsers: "Currently active users",
    newUsersToday: "Users created today",
    usersByRole: "User distribution by role"
  },
  performance: {
    averageResponseTime: "API response time trend",
    errorRateTrend: "Error rate over time",
    throughput: "Requests per second",
    systemHealth: "Overall system health score"
  },
  usage: {
    popularRoles: "Most commonly created user roles",
    peakCreationTimes: "Busiest user creation times",
    fileUploadStats: "File upload statistics",
    courseAssignments: "Course assignment trends"
  }
};
```

## Final Implementation Checklist

### **Pre-Deployment Checklist**
- [ ] All validation rules implemented and tested
- [ ] Error handling covers all edge cases
- [ ] Security measures (rate limiting, encryption) in place
- [ ] Database indexes created for performance
- [ ] File upload security implemented
- [ ] Audit logging configured
- [ ] Monitoring and alerting set up
- [ ] Load testing completed
- [ ] Documentation reviewed and approved
- [ ] Backup and recovery procedures tested

### **Post-Deployment Monitoring**
- [ ] Monitor error rates for first 24 hours
- [ ] Track API response times
- [ ] Verify user creation success rates
- [ ] Check file upload performance
- [ ] Monitor system resource usage
- [ ] Review audit logs for security issues
- [ ] Validate data integrity
- [ ] Test rollback procedures if needed

---

**The HR User Creation Fields documentation is now 100% complete** with comprehensive validation examples, testing scenarios, security guidelines, performance optimization, and monitoring recommendations for production deployment.
