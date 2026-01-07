# Education Center Schema Design

## Overview
An Education Center within a school represents a dedicated facility or organizational unit for specific types of education (e.g., Language Center, Computer Center, Religious Education Center). Each center can host multiple classes where teachers, subjects, and students are organized. This is a high-level organizational structure that groups related educational activities.

## Database Schema

### Table: `courses`
**Note:** Table name remains `courses` for backward compatibility with existing system relationships.

```sql
CREATE TABLE `courses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `description` TEXT NULL,
  `summary` TEXT NULL,
  `focusArea` VARCHAR(100) NULL,
  `centerType` VARCHAR(50) NULL,
  `targetAudience` VARCHAR(50) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `isAccredited` TINYINT(1) NOT NULL DEFAULT 0,
  `enrollmentOpen` TINYINT(1) NOT NULL DEFAULT 1,
  `schoolId` BIGINT NOT NULL,
  `branchId` BIGINT NULL,
  `centerManagerId` BIGINT NULL,
  `operatingHours` VARCHAR(100) NULL,
  `scheduleType` VARCHAR(30) NULL,
  `budget` DECIMAL(12,2) NULL,
  `resources` JSON NULL,
  `policies` JSON NULL,
  `createdBy` BIGINT NOT NULL,
  `updatedBy` BIGINT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_uuid_key` (`uuid`),
  UNIQUE KEY `courses_schoolId_code_key` (`schoolId`, `code`),
  KEY `idx_courses_schoolId` (`schoolId`),
  KEY `idx_courses_branchId` (`branchId`),
  KEY `idx_courses_centerManagerId` (`centerManagerId`),
  KEY `idx_courses_centerType` (`centerType`),
  KEY `idx_courses_isActive` (`isActive`),
  CONSTRAINT `courses_schoolId_fkey`
    FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `courses_branchId_fkey`
    FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `courses_centerManagerId_fkey`
    FOREIGN KEY (`centerManagerId`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `courses_createdBy_fkey`
    FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `courses_updatedBy_fkey`
    FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Field Descriptions

### Core Information
- **id** - Primary Key (DO NOT CHANGE - used in relationships across the system)
- **uuid** - Unique identifier (36 chars) (DO NOT CHANGE - used in relationships)
- **name** - Center name (e.g., "English Language Center", "Computer Training Center", "Islamic Studies Center")
- **code** - Center code (e.g., "ENG-CENTER", "COMP-CENTER", "ISLAM-001") (DO NOT CHANGE - used in relationships)
- **description** - Detailed description of the education center and its mission
- **summary** - Brief overview of the education center

### Center Focus & Type
- **focusArea** - String (100 chars, optional) - Primary educational focus: "Language Studies", "Technology Training", "Religious Education", "Vocational Skills"
- **centerType** - String (50 chars, optional) - Type of center: "ACADEMIC", "VOCATIONAL", "LANGUAGE", "RELIGIOUS", "TECHNOLOGY", "MIXED"
- **targetAudience** - String (50 chars, optional) - Target student group: "PRIMARY", "SECONDARY", "ADULT", "ALL_AGES"

### Status & Accreditation
- **isActive** - Whether the education center is currently operational
- **isAccredited** - Whether the center is officially accredited by educational authorities
- **enrollmentOpen** - Whether the center is accepting new student enrollments

### Relationships (DO NOT CHANGE - Critical for system integrity)
- **schoolId** - Links to the parent school (required)
- **branchId** - Links to specific school branch if applicable (optional)
- **centerManagerId** - Center director/head/manager responsible for operations (optional)

### Schedule & Administration
- **operatingHours** - String (100 chars, optional) - Center operating hours: "9AM-9PM Daily", "Evenings 4PM-9PM", "Weekends Only"
- **scheduleType** - String (30 chars, optional) - Primary schedule pattern: "WEEKDAY", "WEEKEND", "FLEXIBLE", "EVENING"
- **budget** - Decimal (optional) - Annual operational budget allocated to the center
- **resources** - JSON (optional) - Available physical resources, equipment, and facilities
- **policies** - JSON (optional) - Center-specific rules, policies, and procedures

### Audit Fields (DO NOT CHANGE - System tracking fields)
- **createdBy** - User ID who created the center record
- **updatedBy** - User ID who last updated the center record
- **createdAt** - Timestamp when center was created in system
- **updatedAt** - Timestamp of last update
- **deletedAt** - Soft delete timestamp (NULL if active)

## Center Types

### CenterType Values
- **ACADEMIC** - Traditional academic education center
- **VOCATIONAL** - Skills-based and vocational training center
- **LANGUAGE** - Language learning and training center
- **RELIGIOUS** - Religious education and studies center
- **TECHNOLOGY** - Technology, computer, and IT training center
- **MIXED** - Multi-purpose education center offering various programs

### TargetAudience Values
- **PRIMARY** - Centers focused on primary school-age children
- **SECONDARY** - Centers for secondary/high school students
- **ADULT** - Adult education and continuing education centers
- **ALL_AGES** - Centers serving all age groups and demographics

### ScheduleType Values
- **WEEKDAY** - Centers operating Monday to Friday (typical business hours)
- **WEEKEND** - Centers operating Saturday and Sunday only
- **EVENING** - Centers operating evening hours for working adults
- **FLEXIBLE** - Centers with flexible, custom scheduling arrangements

## Example Data

```json
{
  "name": "English Language Learning Center",
  "code": "LANG-ENG-01",
  "description": "Comprehensive English language training center offering courses from beginner to advanced levels, including conversation, writing, and business English programs.",
  "summary": "Professional English language training for all levels",
  "focusArea": "Language Studies - English",
  "centerType": "LANGUAGE",
  "targetAudience": "ALL_AGES",
  "isActive": true,
  "isAccredited": true,
  "enrollmentOpen": true,
  "operatingHours": "9AM-9PM Daily (6 days/week)",
  "scheduleType": "FLEXIBLE",
  "budget": 150000.00,
  "resources": {
    "classrooms": 8,
    "projectors": 8,
    "computers": 25,
    "whiteboards": 10,
    "audioSystem": true,
    "languageLab": true,
    "library": true,
    "onlinePlatform": true
  },
  "policies": {
    "attendancePolicy": "80% attendance required for certification",
    "dressCode": "Smart casual",
    "refundPolicy": "Full refund within 7 days, 50% within 14 days",
    "placementTest": "Required for all new students",
    "certificationRules": "Pass final exam with 70% minimum"
  }
}
```

## Relationships

### Foreign Keys (DO NOT CHANGE - Critical system relationships)
- `schoolId` → `schools.id` (Parent school)
- `branchId` → `branches.id` (School branch, if applicable)
- `centerManagerId` → `users.id` (Center director/manager)
- `createdBy` → `users.id` (User who created record)
- `updatedBy` → `users.id` (User who last updated record)

### Related Tables
The education center has relationships with these system tables:
- **Classes** - Individual classes operating within the center (e.g., "Beginner English Class", "Advanced Computer Class")
- **Teachers** - Teaching staff assigned to classes in this center
- **Students** - Students enrolled in classes at this center
- **Subjects** - Subjects/topics taught in classes at this center
- **Timetables** - Class schedules and timing for center operations
- **StudentEnrollments** - Formal student enrollment records for center classes
- **Sections** - Class sections within the center
- **Attendance** - Student and staff attendance tracking
- **Payments** - Fee payments related to center enrollments
- **Assignments** - Academic assignments within center classes
- **Exams** - Examinations and assessments conducted at the center

## Indexes

### Performance Indexes
- Primary key on `id`
- Unique index on `uuid`
- Unique composite index on `schoolId` + `code` (ensures unique center codes per school)
- Indexes on foreign keys (`schoolId`, `branchId`, `centerManagerId`) for join performance
- Index on `centerType` for filtering centers by type
- Index on `isActive` for querying operational centers

## Usage Examples

### Creating a New Education Center
```sql
INSERT INTO courses (
  uuid, name, code, description, summary, focusArea, 
  centerType, targetAudience, isActive, isAccredited, enrollmentOpen,
  operatingHours, scheduleType, budget,
  schoolId, branchId, centerManagerId, createdBy
) VALUES (
  UUID(), 
  'Islamic Studies and Quran Center', 
  'ISLAM-CENTER-01', 
  'Comprehensive Islamic education center offering Quran memorization, Arabic language, Islamic history, and Fiqh studies for all ages.',
  'Traditional Islamic education and Quran memorization',
  'Religious Education - Islamic Studies', 
  'RELIGIOUS', 
  'ALL_AGES',
  1, -- isActive
  1, -- isAccredited
  1, -- enrollmentOpen
  'Daily 8AM-8PM (Saturday-Thursday)',
  'WEEKDAY',
  200000.00, -- budget
  1, -- schoolId
  NULL, -- branchId (optional)
  5, -- centerManagerId (user ID of center director)
  1  -- createdBy
);
```

### Querying Active Centers
```sql
-- Get all active education centers for a school
SELECT id, name, code, centerType, targetAudience, operatingHours
FROM courses 
WHERE schoolId = 1 
  AND isActive = 1 
  AND deletedAt IS NULL
ORDER BY name;
```

### Centers by Type
```sql
-- Count centers by type for reporting
SELECT 
  centerType, 
  COUNT(*) as center_count,
  SUM(budget) as total_budget
FROM courses 
WHERE schoolId = 1 
  AND isActive = 1 
  AND deletedAt IS NULL
GROUP BY centerType;
```

### Centers with Open Enrollment
```sql
-- Find centers currently accepting students
SELECT name, code, centerType, targetAudience, operatingHours
FROM courses 
WHERE schoolId = 1 
  AND isActive = 1 
  AND enrollmentOpen = 1
  AND deletedAt IS NULL
ORDER BY centerType, name;
```

## How Education Centers Work with Classes

### Organizational Hierarchy
1. **Education Center** - Top-level organizational unit (e.g., "English Language Learning Center")
2. **Classes** - Specific classes within the center (e.g., "Beginner English A1", "Business English Advanced", "IELTS Preparation")
3. **Class Components** - Teachers, subjects, and students are assigned to individual classes
4. **Schedules** - Each class has its own timetable within the center's operating hours

### Real-World Example: Language Center

**Center Level:**
- Name: "English Language Learning Center"
- Type: LANGUAGE
- Operating Hours: 9AM-9PM Daily
- Capacity: 200 students
- Resources: 8 classrooms, language lab, online platform

**Classes within the Center:**
- "Beginner English Level A1" (Morning shift, 20 students)
- "Intermediate English Level B1" (Afternoon shift, 25 students)
- "Advanced Conversation" (Evening shift, 15 students)
- "Business English" (Weekend, 18 students)
- "IELTS Preparation" (Evening, 22 students)

### Example SQL Flow
```sql
-- Step 1: Create an education center
INSERT INTO courses (uuid, name, code, centerType, targetAudience, 
                    operatingHours, scheduleType, schoolId, createdBy)
VALUES (UUID(), 'Computer Training Center', 'COMP-CENTER-01', 'TECHNOLOGY', 
        'ALL_AGES', '9AM-9PM Daily', 'FLEXIBLE', 1, 1);

-- Step 2: Create classes within the center
INSERT INTO classes (name, code, level, courseId, schoolId, capacity, createdBy)
VALUES 
  ('Basic Computer Skills', 'COMP-BASIC', 1, 1, 1, 25, 1),
  ('Web Development Bootcamp', 'COMP-WEB', 3, 1, 1, 20, 1),
  ('Data Entry Operator Training', 'COMP-DATA', 2, 1, 1, 30, 1);

-- Step 3: Assign teachers to classes with their subjects
INSERT INTO teacher_class_subjects (classId, teacherId, subjectId, schoolId)
VALUES 
  (1, 10, 50, 1), -- Teacher 10 teaches "MS Office" in Basic Computer class
  (2, 11, 51, 1), -- Teacher 11 teaches "HTML/CSS" in Web Development class
  (3, 10, 52, 1); -- Teacher 10 also teaches "Typing" in Data Entry class

-- Step 4: Enroll students in specific classes
INSERT INTO student_enrollments (studentId, classId, courseId, schoolId, status, createdBy)
VALUES 
  (100, 1, 1, 1, 'ACTIVE', 1), -- Student 100 in Basic Computer class
  (101, 2, 1, 1, 'ACTIVE', 1), -- Student 101 in Web Development class
  (102, 1, 1, 1, 'ACTIVE', 1); -- Student 102 in Basic Computer class
```

## Benefits of Center-Based Organization

1. **Clear Structure** - Physical or organizational separation of different educational programs
2. **Resource Management** - Dedicated resources, staff, and budget per center
3. **Specialized Focus** - Each center can focus on specific educational domains
4. **Flexible Scheduling** - Centers can operate on different schedules (weekday, evening, weekend)
5. **Independent Operations** - Centers can have their own managers, policies, and procedures
6. **Reporting & Analytics** - Easy to track performance metrics per center
7. **Scalability** - New centers can be added as the institution grows

## Complete JSON Template for Creating Education Centers

### Template Structure
Below is a complete JSON template that can be used for creating education centers via API. All fields are included with explanations.

```json
{
  "name": "English Language Learning Center",
  "code": "LANG-ENG-01",
  "description": "Comprehensive English language training center offering courses from beginner to advanced levels, including conversation, writing, business English, and IELTS preparation programs. Our experienced instructors use modern teaching methods and technology to ensure effective learning outcomes.",
  "summary": "Professional English language training for all levels and purposes",
  "focusArea": "Language Studies - English",
  "centerType": "LANGUAGE",
  "targetAudience": "ALL_AGES",
  "isActive": true,
  "isAccredited": true,
  "enrollmentOpen": true,
  "schoolId": 1,
  "branchId": null,
  "centerManagerId": 25,
  "operatingHours": "9AM-9PM Daily (Saturday-Thursday), Closed Friday",
  "scheduleType": "FLEXIBLE",
  "budget": 150000.00,
  "resources": {
    "facilities": {
      "classrooms": 8,
      "languageLab": true,
      "library": true,
      "studyRooms": 4,
      "computerLab": true,
      "cafeteria": false,
      "parking": true
    },
    "equipment": {
      "projectors": 8,
      "smartBoards": 4,
      "computers": 25,
      "tablets": 15,
      "whiteboards": 10,
      "audioSystem": true,
      "headsets": 30,
      "printers": 2,
      "scanner": 1
    },
    "digitalResources": {
      "onlinePlatform": "Custom LMS",
      "videoConferencing": "Zoom Pro",
      "digitalLibrary": true,
      "mobileApp": true,
      "practicePortal": "English Practice Hub"
    },
    "teachingMaterials": {
      "textbooks": "Cambridge & Oxford Series",
      "workbooks": 200,
      "audioBooks": true,
      "videoLessons": true,
      "interactiveGames": true
    }
  },
  "policies": {
    "enrollment": {
      "placementTest": "Required for all new students",
      "minimumAge": 6,
      "maximumClassSize": 25,
      "enrollmentFee": 500.00,
      "registrationProcess": "Online or in-person with documents"
    },
    "attendance": {
      "minimumAttendance": "80% required for certification",
      "lateArrivalPolicy": "15 minutes grace period",
      "absenceNotification": "Must notify 24 hours in advance",
      "makeupClasses": "Available for excused absences"
    },
    "academic": {
      "assessmentFrequency": "Monthly progress tests",
      "finalExamRequired": true,
      "passingScore": 70,
      "certificationType": "Center Certificate + International Certification Option",
      "gradingSystem": "A-F Letter Grades"
    },
    "financial": {
      "refundPolicy": "Full refund within 7 days, 50% within 14 days, no refund after 14 days",
      "paymentMethods": ["Cash", "Bank Transfer", "Credit Card", "Monthly Installments"],
      "lateFeePercentage": 5,
      "scholarshipAvailable": true,
      "familyDiscount": "10% for 2nd family member, 15% for 3rd+"
    },
    "conduct": {
      "dressCode": "Smart casual, no strict uniform required",
      "behaviorPolicy": "Respectful communication and professional conduct required",
      "disciplinaryProcess": "Warning -> Parent Meeting -> Suspension -> Expulsion",
      "electronicDevices": "Allowed for educational purposes only"
    },
    "safety": {
      "emergencyContact": "Required for all students",
      "medicalInfo": "Health conditions must be disclosed",
      "pickupPolicy": "Students under 16 must be picked up by authorized person",
      "securityMeasures": "CCTV, visitor registration, ID cards"
    }
  },
  "createdBy": 1
}
```

### Field-by-Field Explanation

| Field | Type | Required | Description | Example Values |
|-------|------|----------|-------------|----------------|
| **name** | String(150) | Yes | Full name of the education center | "English Language Learning Center", "Islamic Studies Center" |
| **code** | String(30) | Yes | Unique code for the center (per school) | "LANG-ENG-01", "COMP-CENTER-01", "ISLAM-001" |
| **description** | Text | No | Detailed description of the center's offerings and approach | Full paragraph about programs and methodology |
| **summary** | Text | No | Brief one-line summary | "Professional English training for all levels" |
| **focusArea** | String(100) | No | Primary educational focus area | "Language Studies - English", "Technology Training", "Religious Education" |
| **centerType** | String(50) | No | Type of center | "LANGUAGE", "TECHNOLOGY", "RELIGIOUS", "VOCATIONAL", "ACADEMIC", "MIXED" |
| **targetAudience** | String(50) | No | Primary target demographic | "ALL_AGES", "ADULT", "PRIMARY", "SECONDARY" |
| **isActive** | Boolean | Yes | Whether center is operational | true, false |
| **isAccredited** | Boolean | Yes | Whether officially accredited | true, false |
| **enrollmentOpen** | Boolean | Yes | Whether accepting new students | true, false |
| **schoolId** | BigInt | Yes | ID of parent school | 1, 2, 3, etc. |
| **branchId** | BigInt | No | ID of school branch (if applicable) | 1, 2, null |
| **centerManagerId** | BigInt | No | User ID of center director/manager | 25, 30, null |
| **operatingHours** | String(100) | No | Center operating hours | "9AM-9PM Daily", "Evenings 4PM-9PM", "Weekends Only" |
| **scheduleType** | String(30) | No | Primary schedule pattern | "FLEXIBLE", "WEEKDAY", "WEEKEND", "EVENING" |
| **budget** | Decimal(12,2) | No | Annual operational budget | 150000.00, 200000.00 |
| **resources** | JSON | No | Available resources and equipment | See full JSON structure above |
| **policies** | JSON | No | Center rules and policies | See full JSON structure above |
| **createdBy** | BigInt | Yes | User ID who is creating the center | 1, 2, 3, etc. |

### Additional Center Examples

#### 1. Computer Training Center
```json
{
  "name": "Advanced Computer Training Center",
  "code": "COMP-CENTER-01",
  "description": "State-of-the-art computer training center offering courses in programming, web development, graphic design, data entry, and office applications. Certified trainers with industry experience.",
  "summary": "Professional IT and computer skills training",
  "focusArea": "Technology Training - Computer Science",
  "centerType": "TECHNOLOGY",
  "targetAudience": "ALL_AGES",
  "isActive": true,
  "isAccredited": true,
  "enrollmentOpen": true,
  "schoolId": 1,
  "branchId": null,
  "centerManagerId": 30,
  "operatingHours": "8AM-10PM Daily (Saturday-Thursday)",
  "scheduleType": "FLEXIBLE",
  "budget": 250000.00,
  "resources": {
    "facilities": {
      "computerLabs": 5,
      "classrooms": 6,
      "projectRoom": 2,
      "library": true
    },
    "equipment": {
      "desktopComputers": 100,
      "laptops": 25,
      "servers": 5,
      "projectors": 6,
      "3dPrinters": 2,
      "networkEquipment": true
    },
    "software": {
      "microsoftOffice": true,
      "adobeCreativeSuite": true,
      "developmentTools": ["VS Code", "PyCharm", "Android Studio"],
      "databaseSystems": ["MySQL", "MongoDB", "PostgreSQL"],
      "designTools": ["Figma", "Sketch", "Blender"]
    }
  },
  "policies": {
    "enrollment": {
      "placementTest": "Required for advanced courses",
      "minimumAge": 12,
      "prerequisites": "Varies by course level"
    },
    "attendance": {
      "minimumAttendance": "75% required",
      "practicalHours": "50 hours minimum for certification"
    },
    "academic": {
      "projectBased": true,
      "internshipSupport": true,
      "certificationPartners": ["Microsoft", "Cisco", "Adobe"]
    },
    "financial": {
      "refundPolicy": "Full refund within 7 days",
      "installmentPlans": true,
      "jobPlacementSupport": true
    }
  },
  "createdBy": 1
}
```

#### 2. Islamic Studies Center
```json
{
  "name": "Islamic Studies and Quran Memorization Center",
  "code": "ISLAM-CENTER-01",
  "description": "Traditional Islamic education center offering Quran memorization (Hifz), Tajweed, Arabic language, Islamic history, Fiqh, and Hadith studies. Experienced scholars and qualified Huffaz provide authentic Islamic education in a conducive environment.",
  "summary": "Comprehensive Islamic education and Quran memorization",
  "focusArea": "Religious Education - Islamic Studies",
  "centerType": "RELIGIOUS",
  "targetAudience": "ALL_AGES",
  "isActive": true,
  "isAccredited": true,
  "enrollmentOpen": true,
  "schoolId": 1,
  "branchId": null,
  "centerManagerId": 35,
  "operatingHours": "6AM-8PM Daily (Saturday-Thursday), Special Friday Programs",
  "scheduleType": "WEEKDAY",
  "budget": 200000.00,
  "resources": {
    "facilities": {
      "classrooms": 10,
      "masjid": true,
      "library": true,
      "dormitory": true,
      "diningHall": true,
      "wuduArea": true
    },
    "religiousResources": {
      "quranCopies": 500,
      "hadithBooks": 200,
      "fiqhReferences": 150,
      "arabicTextbooks": 300,
      "audioRecitations": true,
      "islamicLibrary": true
    },
    "teachingStaff": {
      "huffaz": 8,
      "islamicScholars": 6,
      "arabicTeachers": 4,
      "femaleTeachers": 5
    },
    "technology": {
      "audioSystem": true,
      "recordingFacility": true,
      "onlineClasses": true,
      "digitalQuran": true
    }
  },
  "policies": {
    "enrollment": {
      "interviewRequired": true,
      "minimumAge": 5,
      "genderSeparation": true,
      "commitmentRequired": "Minimum 1 year for Hifz program"
    },
    "attendance": {
      "minimumAttendance": "90% required for Hifz students",
      "dailyRevision": "Mandatory for memorization program",
      "prayerAttendance": "Required for all students"
    },
    "academic": {
      "examSystem": "Oral and written tests",
      "graduationRequirement": "Complete Quran memorization or course completion",
      "ijazahProgram": true,
      "arabicProficiency": "Required for advanced studies"
    },
    "conduct": {
      "islamicDressCode": "Mandatory - Hijab for sisters, modest for brothers",
      "behaviorStandards": "Islamic manners and ethics strictly enforced",
      "prayerTimes": "Observed strictly, classes scheduled around Salah",
      "phonePolicy": "Not allowed during class hours"
    },
    "financial": {
      "subsidizedPrograms": true,
      "zakatFunding": "Available for eligible students",
      "scholarships": "Merit and need-based",
      "boarding": "Available with additional fees"
    }
  },
  "createdBy": 1
}
```

#### 3. Vocational Training Center
```json
{
  "name": "Professional Skills Development Center",
  "code": "VOC-CENTER-01",
  "description": "Vocational training center offering practical skills courses in tailoring, carpentry, electrical work, plumbing, automotive repair, and hospitality. Job-focused training with hands-on experience and industry partnerships.",
  "summary": "Practical vocational skills for employment readiness",
  "focusArea": "Vocational Skills - Trade Training",
  "centerType": "VOCATIONAL",
  "targetAudience": "ADULT",
  "isActive": true,
  "isAccredited": true,
  "enrollmentOpen": true,
  "schoolId": 1,
  "branchId": null,
  "centerManagerId": 40,
  "operatingHours": "7AM-6PM Daily (Saturday-Thursday)",
  "scheduleType": "WEEKDAY",
  "budget": 300000.00,
  "resources": {
    "workshops": {
      "carpentryShop": true,
      "tailoringUnit": true,
      "electricalLab": true,
      "automotiveGarage": true,
      "plumbingLab": true,
      "weldingShop": true
    },
    "equipment": {
      "sewingMachines": 30,
      "woodworkingTools": "Complete set",
      "electricalTestEquipment": true,
      "vehicles": 5,
      "weldingMachines": 10,
      "handTools": "Comprehensive inventory"
    },
    "partnerships": {
      "industryPartners": ["Local businesses", "Construction companies", "Hotels"],
      "jobPlacement": true,
      "apprenticeships": true
    }
  },
  "policies": {
    "enrollment": {
      "minimumAge": 16,
      "educationRequirement": "Basic literacy",
      "aptitudeTest": "Required for some trades"
    },
    "training": {
      "duration": "3-12 months per trade",
      "practicalHours": "70% hands-on training",
      "theoryHours": "30% classroom instruction",
      "safetyTraining": "Mandatory for all students"
    },
    "certification": {
      "governmentRecognized": true,
      "nationalVocationalQualification": true,
      "industryEndorsed": true
    },
    "placement": {
      "jobPlacementSupport": true,
      "businessStartupGuidance": true,
      "toolKitProvision": "Upon graduation for some trades"
    }
  },
  "createdBy": 1
}
```

### API Usage Notes

**Endpoint:** `POST /api/courses` or `POST /api/centers`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_AUTH_TOKEN"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Education center created successfully",
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "English Language Learning Center",
    "code": "LANG-ENG-01",
    "centerType": "LANGUAGE",
    "isActive": true,
    "createdAt": "2026-01-06T22:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "code",
      "message": "Center code already exists for this school"
    }
  ]
}
```
