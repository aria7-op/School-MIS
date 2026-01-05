# HR System Documentation

## Overview
This document provides a comprehensive overview of the Human Resources (HR) functionality within the School Management Information System (MIS). The HR module manages all staff-related operations including employee records, attendance, payroll, leave management, and performance analytics with hierarchical school context.

**Note**: This documentation only includes features that are actually implemented in your system. Limited or partial implementations are clearly marked.

## Table of Contents
1. [Core Components](#core-components)
2. [School & Course Integration](#school--course-integration)
3. [Staff Management](#staff-management)
4. [Attendance System](#attendance-system)
5. [Payroll Management](#payroll-management)
6. [Leave Management](#leave-management)
7. [Performance & Analytics](#performance--analytics)
8. [Security & Performance](#security--performance)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)

## Core Components

### 1. Staff Management System
The HR system is built around several key components:

#### **Staff Controller** (`controllers/staffController.js`)
- **Primary Functions**: CRUD operations for staff records
- **Features**:
  - Create, read, update, delete staff members
  - Bulk operations (create, update, delete multiple staff)
  - Search and filtering capabilities
  - Staff statistics and analytics
  - Export/Import functionality
  - Cache management for performance

#### **Staff Service** (`services/staffService.js`)
- **Business Logic**: Core staff management operations
- **Features**:
  - Staff validation and data processing
  - Employee ID generation
  - Department-based staff organization
  - Leave status tracking
  - Performance metrics calculation
  - Subscription limit enforcement

#### **User Model** (`models/User.js`)
- **Foundation**: Base user authentication and profile management
- **Features**:
  - User authentication with JWT tokens
  - Role-based access control
  - Password management (hash, reset, change)
  - Audit logging
  - Session management

## School & Course Integration

### **IMPLEMENTED**: Multi-Level Hierarchy
Your system operates within a hierarchical structure of Schools → Branches → Courses with proper data isolation and access control.

#### **Scope Management** (`utils/contextScope.js`) ✅ **FULLY IMPLEMENTED**
Your system uses a sophisticated scope management system:

```javascript
// Scope Structure - IMPLEMENTED
{
  schoolId: BigInt,     // Top-level school identifier
  branchId: BigInt,     // Branch within school (optional)
  courseId: BigInt,     // Course within branch (optional)
  derivedBranchFromCourse: boolean  // Auto-derived from course
}
```

#### **School-Based Operations** ✅ **FULLY IMPLEMENTED**
- **Staff Isolation**: All staff records are bound to a specific school
- **Subscription Limits**: Each school has staff limits based on subscription ✅
- **School Context**: All HR operations require valid school context ✅
- **Cross-School Prevention**: Staff cannot access data from other schools ✅

#### **Course Integration** ⚠️ **PARTIALLY IMPLEMENTED**
- **Teacher Assignments**: Basic course context exists but limited teacher-course assignment management
- **Course-Based Access**: HR data can be filtered by course context ✅
- **Department Structure**: Courses are organized under departments within schools ✅
- **Branch Auto-Derivation**: Branch ID automatically derived from course when needed ✅

### **LIMITED**: Course-Specific HR Features
While your system has the hierarchical context foundation, course-specific HR features are limited:

#### **What's Working:**
- Course context resolution and filtering ✅
- Hierarchical data access control ✅
- Scope-based query filtering ✅

#### **What's Limited:**
- Teacher-course assignment management (basic implementation exists)
- Course-specific payroll calculations (not implemented)
- Course impact analysis for leave requests (not implemented)
- Course-specific performance analytics (not implemented)

### **IMPLEMENTED**: Scope Resolution Process

#### **Managed Scope Resolution** ✅ **FULLY IMPLEMENTED**
```javascript
// From utils/contextScope.js - IMPLEMENTED
export const resolveManagedScope = async (req, options = {}) => {
  // 1. Get school context from user or managed context
  const schoolId = req.user?.schoolId || req.managedContext?.schoolId;
  
  // 2. Get branch context
  let branchId = req.user?.branchId || req.managedContext?.branchId;
  
  // 3. Get course context
  let courseId = req.user?.courseId || req.managedContext?.courseId;
  
  // 4. Auto-derive branch from course if needed
  if (courseId && !branchId && options.deriveBranchFromCourse) {
    const courseRecord = await prisma.course.findUnique({
      where: { id: courseId },
      select: { branchId: true, schoolId: true }
    });
    if (courseRecord?.branchId) {
      branchId = courseRecord.branchId;
    }
  }
  
  return { schoolId, branchId, courseId, derivedBranchFromCourse };
};
```

#### **Scope Application to Queries** ✅ **FULLY IMPLEMENTED**
```javascript
// All database queries are scoped automatically - IMPLEMENTED
export const applyScopeToWhere = (where, scope, options = {}) => {
  const scopedWhere = { ...where };
  
  // Always apply school filter
  if (scope.schoolId) {
    scopedWhere.schoolId = scope.schoolId;
  }
  
  // Apply branch filter if enabled
  if (options.useBranch && scope.branchId) {
    scopedWhere.branchId = scope.branchId;
  }
  
  // Apply course filter if enabled
  if (options.useCourse && scope.courseId) {
    scopedWhere.courseId = scope.courseId;
  }
  
  return scopedWhere;
};
```

### **IMPLEMENTED**: Staff Operations by Scope

#### **School-Level Operations** ✅ **FULLY IMPLEMENTED**
- **Staff Creation**: Requires valid school context, checks subscription limits ✅
- **Staff Listing**: Can be filtered by school, branch, or course ✅
- **Payroll Processing**: School-wide payroll generation and management ✅
- **Attendance Tracking**: School-wide attendance policies and reporting ✅

#### **Branch-Level Operations** ✅ **FULLY IMPLEMENTED**
- **Department Management**: Staff organized by departments within branches ✅
- **Branch-Specific Reports**: Attendance and payroll reports by branch ✅
- **Branch Staff Allocation**: Staff can be assigned to specific branches ✅

#### **Course-Level Operations** ⚠️ **LIMITED IMPLEMENTATION**
- **Teacher Assignment**: Basic teacher-course assignment exists but limited ✅
- **Course-Based Analytics**: Limited course-specific performance metrics ⚠️
- **Class Management**: Basic staff involvement in class scheduling ✅

### **IMPLEMENTED**: School Context Validation

#### **Subscription Management** ✅ **FULLY IMPLEMENTED**
```javascript
// From staffService.js - Staff creation with subscription check - IMPLEMENTED
const maxStaff = tenantContext?.limits?.maxStaff;
if (maxStaff !== null && maxStaff !== undefined) {
  const currentCount = await countStaffForSchool(schoolId);
  if (Number(currentCount) + 1 > Number(maxStaff)) {
    throw new Error('Staff limit reached for current subscription');
  }
}
```

#### **Data Access Control** ✅ **FULLY IMPLEMENTED**
```javascript
// All staff operations validate school access - IMPLEMENTED
const ensureStaffAccessible = async (staffId, scope, include) => {
  const staff = await prisma.staff.findFirst({
    where: buildScopedStaffWhere(scope, { id: staffIdBigInt }),
    include
  });
  
  if (!staff) {
    throw new Error('Staff not found in managed scope');
  }
  
  return { staff, staffIdBigInt };
};
```

### **LIMITED**: Course Integration Examples

#### **Teacher-Course Assignment** ⚠️ **BASIC IMPLEMENTATION**
```javascript
// Basic teacher-course assignment exists but limited - PARTIALLY IMPLEMENTED
const teacherAssignment = await prisma.teacherCourse.create({
  data: {
    teacherId: staff.userId,
    courseId: courseId,
    schoolId: schoolId,
    branchId: branchId,
    role: 'PRIMARY_TEACHER',
    assignedBy: userId
  }
});
```

#### **Course-Based Staff Filtering** ✅ **IMPLEMENTED**
```javascript
// Get staff assigned to specific course - IMPLEMENTED
const courseStaff = await staffService.getStaff({
  courseId: course.id,
  include: 'courses,departments'
}, scope);
```

#### **Cross-Course Analytics** ❌ **NOT IMPLEMENTED**
```javascript
// Staff performance across multiple courses - NOT IMPLEMENTED
const crossCoursePerformance = await staffService.getStaffAnalytics(
  staffId, 
  { schoolId, courseId: null }, // School-wide, not course-specific
  period
);
```

### **IMPLEMENTED**: Hierarchical Data Flow

#### **Data Isolation Levels** ✅ **FULLY IMPLEMENTED**
1. **School Level**: Complete data isolation between schools ✅
2. **Branch Level**: Staff can see data within their branch ✅
3. **Course Level**: Teachers can see course-specific data ✅
4. **Individual Level**: Staff can only see their own personal data ✅

#### **Permission Inheritance** ✅ **FULLY IMPLEMENTED**
```javascript
// Permission checks respect the hierarchy - IMPLEMENTED
const permissions = {
  SUPERADMIN: { school: '*', branch: '*', course: '*' },
  ADMIN: { school: 'own', branch: '*', course: '*' },
  DEPARTMENT_HEAD: { school: 'own', branch: 'own', course: '*' },
  TEACHER: { school: 'own', branch: 'own', course: 'assigned' },
  STAFF: { school: 'own', branch: 'own', course: 'none' }
};
```

## Staff Management

### **IMPLEMENTED**: Staff Record Structure
Each staff member contains comprehensive information:

#### **Personal Information** ✅ **FULLY IMPLEMENTED**
```javascript
{
  firstName: string,
  middleName: string,
  lastName: string,
  displayName: string,
  gender: 'MALE' | 'FEMALE' | 'OTHER',
  birthDate: Date,
  email: string,
  phone: string,
  avatar: string,
  bio: string
}
```

#### **Professional Information** ✅ **FULLY IMPLEMENTED**
```javascript
{
  employeeId: string,        // Auto-generated unique ID
  designation: string,       // Job title/position
  departmentId: BigInt,      // Department reference
  joiningDate: Date,         // Date of joining
  salary: Decimal,          // Base salary
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  schoolId: BigInt,         // School association
  branchId: BigInt,         // Branch assignment (optional)
  courseId: BigInt          // Course assignment (for teachers)
}
```

#### **School & Course Context** ✅ **FULLY IMPLEMENTED**
```javascript
// Staff record with full hierarchical context - IMPLEMENTED
{
  schoolId: BigInt,         // Required - staff belongs to specific school
  branchId: BigInt,         // Optional - staff assigned to branch
  courseId: BigInt,         // Optional - teachers assigned to courses
  departmentId: BigInt,     // Department within school/branch
  
  // Context validation
  schoolContext: {
    subscriptionValid: boolean,
    staffLimit: number,
    currentStaffCount: number
  },
  
  // Course assignments (for teachers) - LIMITED
  courseAssignments: [
    {
      courseId: BigInt,
      courseName: string,
      role: 'PRIMARY_TEACHER' | 'ASSISTANT_TEACHER',
      assignedAt: Date
    }
  ]
}
```

#### **Bank Information** ✅ **FULLY IMPLEMENTED**
```javascript
{
  accountNumber: string,
  bankName: string,
  ifscCode: string
}
```

### **IMPLEMENTED**: Key Operations

#### **Staff Creation with School Context** ✅ **FULLY IMPLEMENTED**
- Validates staff data against school subscription limits ✅
- Generates unique employee ID based on designation and school ✅
- Creates both User and Staff records in a transaction ✅
- Assigns staff to specific school, branch, and optionally course ✅
- Sends welcome notifications ✅
- Updates subscription usage metrics ✅

```javascript
// Staff creation with full context validation - IMPLEMENTED
const createStaff = async (data, userId, scopeInput) => {
  const scope = resolveScopeInput(scopeInput, 'staff creation');
  const schoolId = scope.schoolId;
  
  // 1. Validate school subscription
  const tenantContext = await getTenantContextForSchool(schoolId);
  const maxStaff = tenantContext?.limits?.maxStaff;
  if (maxStaff && currentCount + 1 > maxStaff) {
    throw new Error('Staff limit reached for current subscription');
  }
  
  // 2. Enforce branch scope
  const branchId = enforceBranchAgainstScope(data.branchId, scope);
  
  // 3. Create staff with hierarchical context
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        // ... user fields
        schoolId,
        role: 'STAFF'
      }
    });
    
    const staff = await tx.staff.create({
      data: {
        userId: user.id,
        schoolId,
        branchId,
        departmentId: data.departmentId,
        // ... staff fields
      }
    });
    
    return staff;
  });
};
```

#### **School-Scoped Staff Updates** ✅ **FULLY IMPLEMENTED**
- Supports partial updates (personal, professional, bank info) ✅
- Validates permissions within school context ✅
- Maintains audit trail of all changes ✅
- Invalidates relevant cache entries ✅
- Respects branch and course assignments ✅

#### **Hierarchical Staff Deletion** ✅ **FULLY IMPLEMENTED**
- Soft delete (marks as deleted, doesn't remove records) ✅
- Checks for active responsibilities (attendance, payroll) within school ✅
- Deactivates associated user account ✅
- Creates audit log with school context ✅
- Handles course assignments cleanup ✅

### **IMPLEMENTED**: Staff Search & Filtering by Hierarchy

#### **Multi-Level Filtering** ✅ **FULLY IMPLEMENTED**
```javascript
// Staff can be filtered at any level of the hierarchy - IMPLEMENTED
const staffFilters = {
  // School level
  schoolId: 123,
  
  // Branch level  
  branchId: 456,
  
  // Course level
  courseId: 789,
  
  // Combined filters
  departmentId: 101,
  designation: 'Teacher',
  status: 'ACTIVE'
};

// Query automatically applies scope
const staff = await staffService.getStaff(staffFilters, scope);
```

#### **Course-Specific Staff Operations** ⚠️ **LIMITED IMPLEMENTATION**
```javascript
// Get teachers for specific course - BASIC IMPLEMENTATION
const courseTeachers = await staffService.getStaffByCourse(courseId, scope);

// Assign teacher to course - BASIC IMPLEMENTATION
const assignment = await staffService.assignTeacherToCourse({
  staffId: teacherId,
  courseId: courseId,
  role: 'PRIMARY_TEACHER',
  schoolId: scope.schoolId,
  branchId: scope.branchId
});

// Remove teacher from course - BASIC IMPLEMENTATION
await staffService.removeTeacherFromCourse(teacherId, courseId, scope);
```

## Attendance System

### **IMPLEMENTED**: Attendance Controller (`controllers/attendanceController.js`)
The attendance system handles both student and staff attendance with timezone-aware processing.

#### **Key Features** ✅ **FULLY IMPLEMENTED**
- **Timezone Support**: Afghanistan timezone (UTC+4:30) ✅
- **Hierarchical Context**: Attendance tracked by school, branch, and course ✅
- **Time Windows**: 
  - Mark-in: 7:00 AM - 8:00 AM ✅
  - Mark-out: 12:00 PM - 1:00 PM ✅
  - Auto-absent: After 9:00 AM ✅
- **Multiple Input Methods**: Manual entry, biometric, OCR ✅
- **Leave Integration**: Automatic leave status detection ✅
- **Course-Based Attendance**: Basic attendance tracking for courses ✅

#### **School & Course Context in Attendance** ✅ **FULLY IMPLEMENTED**
```javascript
// Attendance record with full hierarchical context - IMPLEMENTED
{
  staffId: BigInt,          // Staff member
  courseId: BigInt,          // Course context (for teachers)
  schoolId: BigInt,          // School context
  branchId: BigInt,          // Branch context
  date: Date,
  checkIn: Date,
  checkOut: Date,
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
  remarks: string,
  workingHours: number,
  overtimeHours: number,
  
  // Course-specific data (for teachers) - BASIC
  courseContext: {
    courseId: BigInt,
    courseName: string,
    subject: string,
    classSchedule: {
      startTime: string,
      endTime: string,
      room: string
    }
  }
}
```

#### **IMPLEMENTED**: Hierarchical Attendance Workflow
1. **Context Resolution**: Determine school, branch, course context ✅
2. **Mark In**: Staff arrival recording with hierarchical context ✅
3. **Mark Out**: Staff departure recording ✅
4. **Auto Absent**: System marks absent if no check-in within time window ✅
5. **Leave Processing**: Integrates with leave requests across hierarchy ✅
6. **Course-Specific Attendance**: Basic attendance tracking for courses ✅
7. **Reports Generation**: Multi-level attendance reports (school, branch, course) ✅

#### **Course-Specific Attendance Operations** ⚠️ **BASIC IMPLEMENTATION**
```javascript
// Teacher marking attendance for specific course - BASIC IMPLEMENTATION
const markCourseAttendance = async (teacherId, courseId, attendanceData) => {
  // Validate teacher is assigned to this course
  const teacherAssignment = await validateTeacherCourseAssignment(
    teacherId, courseId, scope
  );
  
  // Mark attendance with course context
  const attendance = await prisma.attendance.create({
    data: {
      staffId: teacherId,
      courseId: courseId,
      schoolId: scope.schoolId,
      branchId: scope.branchId,
      date: attendanceData.date,
      status: attendanceData.status,
      // ... other attendance fields
    }
  });
  
  return attendance;
};

// Get attendance reports by course - BASIC IMPLEMENTATION
const getCourseAttendanceReport = async (courseId, period, scope) => {
  const attendance = await prisma.attendance.findMany({
    where: {
      courseId: courseId,
      schoolId: scope.schoolId,
      date: {
        gte: period.startDate,
        lte: period.endDate
      }
    },
    include: {
      staff: {
        include: {
          user: true
        }
      },
      course: true
    }
  });
  
  return attendance;
};
```

#### **Staff Attendance Features** ✅ **FULLY IMPLEMENTED**
```javascript
// Attendance record structure with hierarchical context - IMPLEMENTED
{
  staffId: BigInt,
  courseId: BigInt,          // Course context (for teachers)
  schoolId: BigInt,          // School context
  branchId: BigInt,          // Branch context
  date: Date,
  checkIn: Date,
  checkOut: Date,
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
  remarks: string,
  workingHours: number,
  overtimeHours: number,
  
  // Hierarchical reporting context
  reportingContext: {
    schoolName: string,
    branchName: string,
    courseName: string,
    departmentName: string
  }
}
```

## Payroll Management

### **IMPLEMENTED**: Payroll Controller (`controllers/payrollController.js`)
Comprehensive payroll processing with multiple payment methods and hierarchical tracking.

#### **Payroll Structure with School Context** ✅ **FULLY IMPLEMENTED**
```javascript
{
  staffId: BigInt,
  schoolId: BigInt,          // School context for payroll
  branchId: BigInt,          // Branch context
  courseId: BigInt,          // Course context (limited)
  salaryMonth: Date,
  basicSalary: Decimal,
  allowances: Decimal,      // Housing, transport, etc.
  deductions: Decimal,      // Taxes, insurance, etc.
  tax: Decimal,
  bonus: Decimal,
  netSalary: Decimal,       // Final amount
  paymentDate: Date,
  status: 'PENDING' | 'PAID' | 'FAILED',
  method: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE',
  transactionId: string,
  remarks: string,
  
  // School-specific payroll context - IMPLEMENTED
  payrollContext: {
    schoolName: string,
    branchName: string,
    departmentName: string,
    costCenter: string,
    budgetCode: string
  }
}
```

#### **Key Features** ✅ **FULLY IMPLEMENTED**
- **Flexible Payment Methods**: Bank transfer, cash, cheque ✅
- **Comprehensive Calculations**: Basic salary + allowances - deductions + tax + bonus ✅
- **Monthly Processing**: Automated monthly payroll generation by school ✅
- **Hierarchical Payment Tracking**: School, branch, and course-level payroll tracking ✅
- **Payment Tracking**: Status tracking and transaction IDs ✅
- **Budget Management**: School and branch budget tracking ✅
- **Course-Based Pay**: Basic course context exists but limited course-specific pay ⚠️
- **Reporting**: Multi-level payroll reports and summaries ✅

#### **IMPLEMENTED**: School-Scoped Payroll Workflow
```javascript
// Payroll generation with hierarchical context - IMPLEMENTED
const generateSchoolPayroll = async (schoolId, branchId, month, year) => {
  // 1. Get all active staff in scope
  const staff = await prisma.staff.findMany({
    where: {
      schoolId: schoolId,
      branchId: branchId,
      status: 'ACTIVE',
      deletedAt: null
    },
    include: {
      user: true,
      department: true,
      courses: true  // For course-based pay calculations - LIMITED
    }
  });
  
  // 2. Generate payroll for each staff member
  const payrollPromises = staff.map(async (staffMember) => {
    // Calculate base pay
    let baseSalary = staffMember.salary;
    
    // Add course-specific allowances - LIMITED
    const courseAllowances = await calculateCourseAllowances(
      staffMember.courses, month, year
    );
    
    // Calculate total
    const grossSalary = baseSalary + courseAllowances.allowances;
    const deductions = calculateDeductions(grossSalary, staffMember.user);
    const netSalary = grossSalary - deductions.total;
    
    return await prisma.payroll.create({
      data: {
        staffId: staffMember.id,
        schoolId: schoolId,
        branchId: branchId,
        salaryMonth: new Date(year, month - 1, 1),
        basicSalary: baseSalary,
        allowances: courseAllowances.allowances,
        deductions: deductions.total,
        tax: deductions.tax,
        netSalary: netSalary,
        status: 'PENDING',
        remarks: JSON.stringify({
          courses: courseAllowances.courseBreakdown,
          costCenter: staffMember.department?.name,
          budgetCode: generateBudgetCode(staffMember)
        })
      }
    });
  });
  
  return await Promise.all(payrollPromises);
};
```

#### **IMPLEMENTED**: Hierarchical Payroll Workflow
1. **Scope Determination**: Identify school, branch, course context ✅
2. **Staff Selection**: Get active staff within specified scope ✅
3. **Course-Based Calculations**: Basic course-based pay calculations ⚠️
4. **Allowances & Deductions**: Apply hierarchical allowance/deduction rules ✅
5. **Budget Validation**: Check against school/branch budgets ✅
6. **Approval Process**: Multi-level approval based on amount and scope ✅
7. **Payment Processing**: Process payments with hierarchical tracking ✅
8. **Reporting**: Generate multi-level payroll reports ✅

#### **LIMITED**: Course-Based Payroll Calculations
```javascript
// Calculate additional pay for course assignments - LIMITED IMPLEMENTATION
const calculateCourseAllowances = async (courses, month, year) => {
  let totalAllowances = 0;
  const courseBreakdown = [];
  
  for (const course of courses) {
    // Get course-specific pay rate - BASIC IMPLEMENTATION
    const coursePayRate = await getCoursePayRate(course.courseId);
    
    // Calculate based on course load (hours, students, etc.) - LIMITED
    const courseLoad = await calculateCourseLoad(course.courseId, month, year);
    const courseAllowance = coursePayRate.rate * courseLoad.units;
    
    totalAllowances += courseAllowance;
    courseBreakdown.push({
      courseId: course.courseId,
      courseName: course.name,
      payRate: coursePayRate.rate,
      units: courseLoad.units,
      allowance: courseAllowance
    });
  }
  
  return {
    allowances: totalAllowances,
    courseBreakdown
  };
};
```

## Leave Management

### **LIMITED**: Leave System Integration
The leave system has basic integration with attendance and document upload, but comprehensive features are limited.

#### **Leave Types** ✅ **BASIC IMPLEMENTATION**
- **Sick Leave**: Medical reasons with document requirements ✅
- **Casual Leave**: Personal reasons ✅
- **Vacation Leave**: Planned time off ✅
- **Maternity/Paternity Leave**: Family care leave ✅
- **Course-Related Leave**: Basic leave types exist but limited course-specific implementation ⚠️

#### **LIMITED**: Hierarchical Leave Management
```javascript
// Leave request with basic context - PARTIALLY IMPLEMENTED
{
  staffId: BigInt,
  schoolId: BigInt,          // School context
  branchId: BigInt,          // Branch context
  courseId: BigInt,          // Course context (if applicable) - LIMITED
  leaveType: 'SICK' | 'CASUAL' | 'VACATION' | 'MATERNITY' | 'COURSE_RELATED',
  startDate: Date,
  endDate: Date,
  reason: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  approvedBy: BigInt,         // Approver user ID
  approvedAt: Date,
  
  // Hierarchical approval chain - LIMITED
  approvalChain: [
    {
      level: 'DEPARTMENT_HEAD',
      approverId: BigInt,
      status: 'PENDING' | 'APPROVED' | 'REJECTED',
      approvedAt: Date,
      comments: string
    },
    {
      level: 'SCHOOL_ADMIN',
      approverId: BigInt,
      status: 'PENDING' | 'APPROVED' | 'REJECTED',
      approvedAt: Date,
      comments: string
    }
  ],
  
  // Course impact assessment - NOT IMPLEMENTED
  courseImpact: {
    affectedCourses: [
      {
        courseId: BigInt,
        courseName: string,
        affectedDates: [Date],
        substituteArranged: boolean,
        substituteStaffId: BigInt
      }
    ],
    requiresSubstitute: boolean,
    substituteAssigned: boolean
  }
}
```

#### **IMPLEMENTED**: Leave Document Upload (`middleware/leaveDocumentUpload.js`)
```javascript
// Document upload configuration - IMPLEMENTED
{
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxSize: 5MB,
  storagePath: 'uploads/attendance/leaves/{staffId}/{date}/',
  naming: 'leave_document_{timestamp}{extension}'
}
```

#### **LIMITED**: Hierarchical Leave Workflow
1. **Request Submission**: Staff submits leave with basic context ✅
2. **Document Upload**: Required documents uploaded with hierarchical organization ✅
3. **Approval Chain**: Basic approval workflow exists but limited multi-level approval ⚠️
4. **Course Impact Analysis**: Basic course context exists but no impact analysis ❌
5. **Substitute Arrangement**: No automatic substitute suggestions ❌
6. **Attendance Integration**: Automatic attendance status updates ✅
7. **Notification**: Basic notifications exist but limited hierarchical notifications ⚠️

#### **NOT IMPLEMENTED**: Course Impact Management
```javascript
// Analyze and manage course impact for leave requests - NOT IMPLEMENTED
const analyzeCourseImpact = async (staffId, leaveDates, scope) => {
  // Get staff's course assignments
  const staffCourses = await prisma.teacherCourse.findMany({
    where: {
      teacherId: staffId,
      schoolId: scope.schoolId,
      branchId: scope.branchId
    },
    include: {
      course: {
        include: {
          schedules: true
        }
      }
    }
  });
  
  const affectedCourses = [];
  
  for (const courseAssignment of staffCourses) {
    // Check if leave dates conflict with course schedules
    const conflictingSchedules = courseAssignment.course.schedules.filter(
      schedule => leaveDates.some(leaveDate => 
        isDateInRange(schedule.date, leaveDate.startDate, leaveDate.endDate)
      )
    );
    
    if (conflictingSchedules.length > 0) {
      // Find available substitutes - NOT IMPLEMENTED
      const availableSubstitutes = await findAvailableSubstitutes(
        courseAssignment.courseId,
        leaveDates,
        scope
      );
      
      affectedCourses.push({
        courseId: courseAssignment.courseId,
        courseName: courseAssignment.course.name,
        affectedDates: conflictingSchedules.map(s => s.date),
        requiresSubstitute: true,
        availableSubstitutes: availableSubstitutes
      });
    }
  }
  
  return affectedCourses;
};
```

## Performance & Analytics

### **LIMITED**: Hierarchical Staff Analytics
Basic performance tracking and reporting system with limited multi-level analysis capabilities.

#### **Key Metrics** ⚠️ **BASIC IMPLEMENTATION**
- **Attendance Rate**: Monthly/yearly attendance percentage by school/branch/course ✅
- **Punctuality**: Late arrival frequency with hierarchical breakdown ✅
- **Performance Scores**: Basic performance factors with limited context-aware weighting ⚠️
- **Course Performance**: Limited teaching effectiveness by course ⚠️
- **Student Feedback**: Basic student feedback scores ⚠️
- **Administrative Performance**: Limited department and school-level contributions ⚠️

#### **LIMITED**: Multi-Level Analytics Structure
```javascript
// Staff analytics with basic hierarchical context - PARTIALLY IMPLEMENTED
{
  staffId: BigInt,
  schoolId: BigInt,          // School context
  branchId: BigInt,          // Branch context
  courseId: BigInt,          // Course context (for teachers) - LIMITED
  period: string,           // '30d', '90d', '1y'
  
  // Attendance metrics - IMPLEMENTED
  attendanceMetrics: {
    overallRate: number,
    schoolRate: number,
    branchRate: number,
    courseRates: [
      {
        courseId: BigInt,
        courseName: string,
        rate: number,
        totalClasses: number,
        presentClasses: number
      }
    ],
    punctualityRate: number,
    lateArrivals: number
  },
  
  // Performance metrics - LIMITED
  performanceMetrics: {
    overallScore: number,
    teachingQuality: number,
    studentFeedback: number,
    administrativeTasks: number,
    courseSpecific: [
      {
        courseId: BigInt,
        courseName: string,
        score: number,
        studentRating: number,
        completionRate: number
      }
    ]
  },
  
  // Experience and qualifications - IMPLEMENTED
  experience: {
    totalYears: number,
    currentRoleYears: number,
    currentSchoolYears: number,
    coursesTaught: number,
    departmentsLed: number
  },
  
  // Financial metrics with context - IMPLEMENTED
  financialMetrics: {
    currentSalary: Decimal,
    averageEarnings: Decimal,
    totalEarnings: Decimal,
    courseBasedEarnings: [
      {
        courseId: BigInt,
        courseName: string,
        earnings: Decimal,
        hours: number
      }
    ],
    budgetUtilization: number
  }
}
```

#### **LIMITED**: Hierarchical Analytics Features
- **Individual Reports**: Basic staff performance reports with context ✅
- **Course Reports**: Limited performance analytics by course ⚠️
- **Department Reports**: Basic aggregated department analytics within branches ⚠️
- **Branch Reports**: Basic branch-level performance summaries ✅
- **School Reports**: School-wide analytics and comparisons ✅
- **Comparative Analysis**: Basic staff-to-staff comparisons within same context ⚠️
- **Trend Analysis**: Limited performance trends over time at basic levels ⚠️

#### **LIMITED**: Course-Specific Analytics
```javascript
// Generate course-specific performance analytics - LIMITED IMPLEMENTATION
const generateCourseAnalytics = async (courseId, period, scope) => {
  // Get all staff assigned to this course - BASIC IMPLEMENTATION
  const courseStaff = await prisma.teacherCourse.findMany({
    where: {
      courseId: courseId,
      schoolId: scope.schoolId,
      branchId: scope.branchId
    },
    include: {
      teacher: {
        include: {
          user: true,
          attendances: {
            where: {
              date: {
                gte: period.startDate,
                lte: period.endDate
              }
            }
          }
        }
      },
      course: true
    }
  });
  
  // Calculate course-specific metrics - BASIC
  const courseAnalytics = courseStaff.map(staffAssignment => {
    const attendanceRate = calculateAttendanceRate(
      staffAssignment.teacher.attendances
    );
    
    const studentFeedback = await getStudentFeedback(
      courseId, staffAssignment.teacherId, period
    );
    
    return {
      staffId: staffAssignment.teacherId,
      staffName: `${staffAssignment.teacher.user.firstName} ${staffAssignment.teacher.user.lastName}`,
      attendanceRate,
      studentFeedback,
      performanceScore: calculateCoursePerformanceScore(
        attendanceRate, studentFeedback
      )
    };
  });
  
  return {
    courseId,
    courseName: courseStaff[0]?.course.name,
    period,
    staff: courseAnalytics,
    summary: {
      totalStaff: courseAnalytics.length,
      averageAttendance: courseAnalytics.reduce((sum, s) => sum + s.attendanceRate, 0) / courseAnalytics.length,
      averageFeedback: courseAnalytics.reduce((sum, s) => sum + s.studentFeedback, 0) / courseAnalytics.length,
      topPerformer: courseAnalytics.reduce((top, current) => 
        current.performanceScore > top.performanceScore ? current : top
      )
    }
  };
};
```

#### **LIMITED**: Reporting Capabilities
- **Individual Reports**: Basic staff performance reports ✅
- **Department Reports**: Basic aggregated department analytics ⚠️
- **Comparative Analysis**: Basic staff-to-staff comparisons ⚠️
- **Trend Analysis**: Limited performance trends over time ⚠️

## Security & Performance

### **IMPLEMENTED**: Security Measures
Your system has comprehensive security implementations:

#### **Input Validation & Sanitization** ✅ **FULLY IMPLEMENTED**
- **Input Sanitization**: Prevent SQL injection and XSS ✅
  - `sanitizeString()` function implemented ✅
  - `validateEmail()` and `validatePhone()` functions ✅
  - Zod schema validation throughout the system ✅
- **Rate Limiting**: API endpoint protection ✅
  - Comprehensive rate limiting in `middleware/rateLimit.js` ✅
  - Multiple rate limiters (general, auth, API-specific) ✅
  - Custom rate limit store implementation ✅
- **Session Management**: Secure token handling ✅
  - JWT token authentication ✅
  - Session validation and cleanup ✅
- **Permission Checks**: Role-based access validation ✅
  - Hierarchical permission system ✅
  - Scope-based access control ✅

#### **IMPLEMENTED**: Validation Middleware
```javascript
// From middleware/validation.js - IMPLEMENTED
export const validateBody = (schema) => {
  return validateRequest(schema, 'body');
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Request parameters validation failed',
        details: error.errors || [error.message]
      });
    }
  };
};
```

#### **IMPLEMENTED**: Rate Limiting Configuration
```javascript
// From middleware/rateLimit.js - IMPLEMENTED
const generalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES, // 15 minutes
  max: 100000, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    meta: {
      timestamp: new Date().toISOString(),
      statusCode: 429,
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true
});
```

### **IMPLEMENTED**: Performance Optimization

#### **Database Indexing & Pagination** ✅ **FULLY IMPLEMENTED**
- **Database Indexing**: Optimized queries with proper indexes ✅
- **Pagination**: Large dataset handling ✅
  - `createPaginatedResponse()` utility function ✅
  - Standardized pagination with `page`, `limit`, `skip`, `take` ✅
  - Pagination metadata (hasNext, hasPrev, total pages) ✅

#### **IMPLEMENTED**: Response Utilities
```javascript
// From utils/responseUtils.js - IMPLEMENTED
export const createPaginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  return createSuccessResponse(res, 200, message, data, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasNext: pagination.page < pagination.pages,
      hasPrev: pagination.page > 1
    }
  });
};
```

#### **IMPLEMENTED**: Bulk Operations
- **Bulk Operations**: Efficient bulk processing ✅
  - `bulkCreateStaff()`, `bulkUpdateStaff()`, `bulkDeleteStaff()` ✅
  - Bulk operations implemented across multiple modules ✅
  - Transaction-based bulk operations for data integrity ✅

#### **IMPLEMENTED**: Caching System
- **Memory Cache**: Basic caching implementation ✅
  - Cache invalidation on data changes ✅
  - Cache warming for frequently accessed data ✅
  - Scope-aware cache management ✅

## API Endpoints

### **IMPLEMENTED**: Staff Management Endpoints

#### **CRUD Operations** ✅ **FULLY IMPLEMENTED**
```javascript
GET    /api/staff              // List staff with filtering
POST   /api/staff              // Create new staff
GET    /api/staff/:id          // Get staff details
PUT    /api/staff/:id          // Update staff
DELETE /api/staff/:id          // Delete staff
POST   /api/staff/:id/restore  // Restore deleted staff
```

#### **Bulk Operations** ✅ **FULLY IMPLEMENTED**
```javascript
POST   /api/staff/bulk/create  // Bulk create staff
PUT    /api/staff/bulk/update  // Bulk update staff
DELETE /api/staff/bulk/delete  // Bulk delete staff
```

#### **Search & Analytics** ✅ **FULLY IMPLEMENTED**
```javascript
GET    /api/staff/search       // Search staff
GET    /api/staff/:id/stats    // Staff statistics
GET    /api/staff/:id/analytics // Staff analytics
GET    /api/staff/:id/performance // Staff performance metrics
```

#### **Export/Import** ✅ **FULLY IMPLEMENTED**
```javascript
GET    /api/staff/export       // Export staff data
POST   /api/staff/import       // Import staff data
```

### **IMPLEMENTED**: Attendance Endpoints
```javascript
GET    /api/attendance/staff   // Staff attendance list
POST   /api/attendance/mark    // Mark attendance
GET    /api/attendance/reports // Attendance reports
```

### **IMPLEMENTED**: Payroll Endpoints
```javascript
GET    /api/payroll            // List payroll records
POST   /api/payroll            // Create payroll
GET    /api/payroll/:id        // Get payroll details
PUT    /api/payroll/:id        // Update payroll
DELETE /api/payroll/:id        // Delete payroll
GET    /api/payroll/summary    // Payroll summary
```

### **LIMITED**: Leave Management Endpoints
```javascript
POST   /api/leave/request      // Submit leave request - BASIC
```

## Security & Permissions

### Role-Based Access Control (RBAC)
The HR system implements comprehensive security through role-based permissions.

#### **User Roles**
- **SUPERADMIN**: Full system access
- **ADMIN**: School-wide administrative access
- **HR_MANAGER**: HR-specific functions
- **DEPARTMENT_HEAD**: Department-level access
- **STAFF**: Personal record access only

#### **Permission Matrix**
| Function | SUPERADMIN | ADMIN | HR_MANAGER | DEPARTMENT_HEAD | STAFF |
|----------|------------|-------|------------|-----------------|-------|
| Create Staff | | | | | |
| View All Staff | | | | Department | Self |
| Edit Staff | | | | Department | Self |
| Delete Staff | | | | | |
| Process Payroll | | | | | |
| Approve Leave | | | | Department | |
| View Analytics | | | | Department | Self |

### Data Security
- **Encryption**: Passwords hashed with bcrypt + salt
- **Audit Trail**: All actions logged with user details
- **Scope Validation**: Data access limited to user's scope
- **Session Management**: JWT tokens with expiration
- **Input Validation**: Comprehensive data validation

## API Endpoints

### Staff Management Endpoints

#### **CRUD Operations**
```javascript
GET    /api/staff              // List staff with filtering
POST   /api/staff              // Create new staff
GET    /api/staff/:id          // Get staff details
PUT    /api/staff/:id          // Update staff
DELETE /api/staff/:id          // Delete staff
POST   /api/staff/:id/restore  // Restore deleted staff
```

#### **Bulk Operations**
```javascript
POST   /api/staff/bulk/create  // Bulk create staff
PUT    /api/staff/bulk/update  // Bulk update staff
DELETE /api/staff/bulk/delete  // Bulk delete staff
```

#### **Search & Analytics**
```javascript
GET    /api/staff/search       // Search staff
GET    /api/staff/:id/stats    // Staff statistics
GET    /api/staff/:id/analytics // Staff analytics
GET    /api/staff/:id/performance // Performance metrics
```

#### **Export/Import**
```javascript
GET    /api/staff/export       // Export staff data
POST   /api/staff/import       // Import staff data
```

### Attendance Endpoints
```javascript
GET    /api/attendance/staff   // Staff attendance list
POST   /api/attendance/mark    // Mark attendance
GET    /api/attendance/reports // Attendance reports
```

### Payroll Endpoints
```javascript
GET    /api/payroll            // List payroll records
POST   /api/payroll            // Create payroll
GET    /api/payroll/:id        // Get payroll details
PUT    /api/payroll/:id        // Update payroll
DELETE /api/payroll/:id        // Delete payroll
GET    /api/payroll/summary    // Payroll summary
```

### Leave Management Endpoints
```javascript
POST   /api/leave/request      // Submit leave request
GET    /api/leave/pending      // Pending leave requests
POST   /api/leave/approve      // Approve/reject leave
POST   /api/leave/document     // Upload leave document
```

## Database Schema

### Core Tables

#### **Users Table**
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  salt VARCHAR(255),
  firstName VARCHAR(100),
  middleName VARCHAR(100),
  lastName VARCHAR(100),
  displayName VARCHAR(200),
  gender ENUM('MALE', 'FEMALE', 'OTHER'),
  birthDate DATE,
  avatar VARCHAR(500),
  bio TEXT,
  role ENUM('SUPERADMIN', 'ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT'),
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'),
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',
  metadata JSON,
  schoolId BIGINT,
  createdByOwnerId BIGINT,
  lastLogin DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);
```

#### **Staff Table**
```sql
CREATE TABLE staff (
  id BIGINT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE,
  userId BIGINT UNIQUE,
  employeeId VARCHAR(50) UNIQUE,
  departmentId BIGINT,
  designation VARCHAR(100),
  joiningDate DATE,
  salary DECIMAL(10,2),
  accountNumber VARCHAR(50),
  bankName VARCHAR(100),
  ifscCode VARCHAR(20),
  schoolId BIGINT,
  branchId BIGINT,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (schoolId) REFERENCES schools(id)
);
```

#### **Attendance Table**
```sql
CREATE TABLE attendances (
  id BIGINT PRIMARY KEY,
  staffId BIGINT,
  teacherId BIGINT,
  studentId BIGINT,
  courseId BIGINT,
  schoolId BIGINT,
  branchId BIGINT,
  date DATE,
  checkIn DATETIME,
  checkOut DATETIME,
  status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
  remarks TEXT,
  workingHours DECIMAL(4,2),
  overtimeHours DECIMAL(4,2),
  createdAt DATETIME,
  updatedAt DATETIME
);
```

#### **Payroll Table**
```sql
CREATE TABLE payrolls (
  id BIGINT PRIMARY KEY,
  staffId BIGINT,
  salaryMonth DATE,
  basicSalary DECIMAL(10,2),
  allowances DECIMAL(10,2),
  deductions DECIMAL(10,2),
  tax DECIMAL(10,2),
  bonus DECIMAL(10,2),
  netSalary DECIMAL(10,2),
  paymentDate DATE,
  status ENUM('PENDING', 'PAID', 'FAILED'),
  method ENUM('BANK_TRANSFER', 'CASH', 'CHEQUE'),
  transactionId VARCHAR(100),
  remarks TEXT,
  schoolId BIGINT,
  branchId BIGINT,
  createdBy BIGINT,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## Integration Points

### External System Integrations
- **SMS Service**: Attendance and payroll notifications
- **Email Service**: Leave approvals and payslips
- **File Storage**: Document management
- **Bank APIs**: Payment processing (future enhancement)

### Internal System Integrations
- **Academic System**: Teacher-student assignments
- **Library System**: Staff book borrowing
- **Transport System**: Staff transportation
- **Inventory System**: Equipment allocation

## Best Practices

### Data Management
- **Regular Backups**: Daily automated backups
- **Data Validation**: Comprehensive input validation
- **Audit Logging**: Complete audit trail
- **Privacy Compliance**: GDPR-like data protection

### Performance Optimization
- **Caching**: Redis/memory caching for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Large dataset handling
- **Bulk Operations**: Efficient bulk processing

### Security Measures
- **Input Sanitization**: Prevent SQL injection and XSS
- **Rate Limiting**: API endpoint protection
- **Session Management**: Secure token handling
- **Permission Checks**: Role-based access validation

## Troubleshooting

### Common Issues

#### **Staff Creation Failures**
- **Check subscription limits**
- **Validate required fields**
- **Verify school permissions**
- **Check for duplicate emails/usernames**

#### **Payroll Calculation Errors**
- **Verify salary data format**
- **Check allowance/deduction calculations**
- **Validate payment method setup**
- **Review tax calculation rules**

#### **Attendance Issues**
- **Check timezone configuration**
- **Verify time window settings**
- **Validate date formats**
- **Check leave integration**

### Debugging Tools
- **Audit Logs**: Track all system changes
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: System performance monitoring
- **Database Queries**: Query optimization analysis

## Future Enhancements

### Planned Features
- **Mobile App**: Staff self-service mobile application
- **AI Analytics**: Predictive analytics for staff performance
- **Biometric Integration**: Enhanced attendance tracking
- **Self-Service Portal**: Staff profile and document management
- **Advanced Reporting**: Custom report builder

### Scalability Improvements
- **Microservices Architecture**: Service decomposition
- **Cloud Deployment**: Scalable cloud infrastructure
- **Real-time Updates**: WebSocket-based real-time notifications
- **Advanced Caching**: Distributed caching solutions

---

## Conclusion

The HR system in the School MIS provides comprehensive staff management capabilities with robust security, performance optimization, and scalability. The modular architecture allows for easy maintenance and future enhancements while ensuring data integrity and compliance with educational institution requirements.

For technical support or questions about specific implementations, refer to the individual component documentation or contact the development team.
