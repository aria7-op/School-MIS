import { z } from 'zod';

// ======================
// USER VALIDATION SCHEMAS
// ======================

/**
 * User creation schema (flat format) - Enhanced with HR fields
 */
export const UserCreateSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(50, 'Username must be less than 50 characters')
    .trim()
    .transform((val) => val?.trim() || val),

  // Personal information
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim()
    .transform((val) => val?.trim() || val),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim()
    .transform((val) => val?.trim() || val),

  fatherName: z.string()
    .max(100, 'Father name must be less than 100 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val?.trim() || val),

  email: z.string()
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val?.trim()?.toLowerCase() || val),

  password: z.string()
    .max(255, 'Password must be less than 255 characters')
    .optional(),

  phone: z.string()
    .optional()
    .nullable()
    .transform((val) => val && val.length > 0 ? val.trim() : undefined),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER'])
    .optional(),

  birthDate: z.union([
    z.string().datetime(),
    z.string(),
    z.date()
  ]).optional(),

  tazkiraNo: z.string()
    .max(50, 'Tazkira number must be less than 50 characters')
    .optional(),

  // Professional Information
  designation: z.string()
    .max(100, 'Designation must be less than 100 characters')
    .optional(),

  totalExperience: z.union([
    z.number().int().min(0).max(50),
    z.string().transform((val) => parseInt(val, 10))
  ]).optional(),

  relevantExperience: z.string()
    .max(500, 'Relevant experience must be less than 500 characters')
    .optional(),

  shift: z.enum(['morning', 'evening', 'full'])
    .optional(),

  workTime: z.enum(['FullTime', 'PartTime', 'Contract'])
    .optional(),

  // Teaching-specific fields
  subjectsCanTeach: z.array(z.string().max(100))
    .optional(),

  // Contract Information
  contractDates: z.object({
    startDate: z.union([z.string().datetime(), z.string(), z.date()]),
    endDate: z.union([z.string().datetime(), z.string(), z.date()]).optional()
  }).optional(),

  // Salary Information
  salary: z.union([
    z.number().positive(),
    z.string().transform((val) => parseFloat(val)),
  ]).optional(),

  salaryStructure: z.object({
    type: z.enum(['fixed', 'percentage', 'hourly']),
    amount: z.number().positive(),
    currency: z.string().default('AFN')
  }).optional(),

  // Address Information
  address: z.object({
    street: z.string().max(255).trim().optional(),
    city: z.string().max(100).trim().optional(),
    state: z.string().max(100).trim().optional(),
    country: z.string().max(100).trim().optional(),
    postalCode: z.string().max(20).trim().optional(),
  }).optional(),

  // Emergency Contact Information
  relativesInfo: z.array(z.object({
    name: z.string().max(100).trim(),
    phone: z.string().max(20).trim(),
    relation: z.string().max(50).trim()
  })).optional(),

  // Document Upload Fields (for multipart form data)
  profilePicture: z.string().optional(),
  cvFile: z.string().optional(),
  tazkiraFile: z.string().optional(),
  lastDegreeFile: z.string().optional(),
  experienceFile: z.string().optional(),
  contractFile: z.string().optional(),
  bankAccountFile: z.string().optional(),

  // Course Assignment Fields
  courseAssignments: z.array(z.object({
    courseId: z.union([z.number().int().positive(), z.string()]),
    courseName: z.string().optional(),
    role: z.enum(['teacher', 'assistant', 'coordinator']).default('teacher'),
    salary: z.object({
      type: z.enum(['fixed', 'percentage', 'hourly']),
      amount: z.number().positive(),
      studentFeeRange: z.object({
        minimum: z.number().positive(),
        maximum: z.number().positive(),
        average: z.number().positive()
      }).optional()
    }).optional(),
    schedule: z.object({
      shift: z.enum(['morning', 'evening']),
      days: z.array(z.string()),
      startTime: z.string(),
      endTime: z.string(),
      roomNumber: z.string().optional()
    }).optional()
  })).optional(),

  // Course Preferences
  coursePreferences: z.object({
    preferredShifts: z.array(z.enum(['morning', 'evening'])).optional(),
    maxCoursesPerTerm: z.number().int().min(1).max(10).optional(),
    preferredSubjects: z.array(z.string().max(100)).optional(),
    preferredRoomTypes: z.array(z.string()).optional()
  }).optional(),

  // Legacy fields (for backward compatibility)
  emergencyContact: z.object({
    name: z.string().max(100).trim().optional(),
    relationship: z.string().max(50).trim().optional(),
    phone: z.string().max(20).trim().optional(),
    email: z.string().optional(),
  }).optional(),

  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'HRM', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'BRANCH_MANAGER', 'COURSE_MANAGER'])
    .optional(), // No default - must be explicitly specified

  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED'])
    .default('ACTIVE'),

  schoolId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined()
  ]).optional(),

  branchId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined()
  ]).optional(),

  courseId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined()
  ]).optional(),

  departmentId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined()
  ]).optional(),

  classId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined()
  ]).optional(),

  // Academic information
  admissionDate: z.union([
    z.string().datetime(),
    z.string(),
    z.date()
  ]).optional(),

  graduationDate: z.union([
    z.string().datetime(),
    z.string(),
    z.date()
  ]).optional(),

  studentId: z.string().max(50).optional(),
  rollNumber: z.string().max(50).optional(),

  // Teacher specific (legacy)
  qualification: z.string().max(255).optional(),
  experience: z.union([
    z.number().int().min(0).max(50),
    z.string().transform((val) => parseInt(val, 10))
  ]).optional(),
  specialization: z.string().max(255).optional(),

  // Staff specific (legacy)
  employeeId: z.string().max(50).optional(),
  joiningDate: z.union([
    z.string().datetime(),
    z.string(),
    z.date()
  ]).optional(),

  // Parent specific
  children: z.array(z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10))
  ])).optional(),

  // Profile information
  bio: z.string().max(500).optional(),

  // Settings
  timezone: z.string().default('UTC').transform((val) => val?.trim() || 'UTC'),
  locale: z.string().default('en-US').transform((val) => val?.trim() || 'en-US'),
  preferences: z.record(z.any()).optional(),

  // Metadata for role-specific data
  metadata: z.record(z.any()).optional(),

  // Required fields - make optional with default
  createdByOwnerId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined()
  ]).optional().default(1),
}).passthrough(); // Allow extra fields

/**
 * User creation schema (nested format)
 */
export const UserCreateNestedSchema = z.object({
  user: UserCreateSchema,
  staff: z
    .object({
      departmentId: z
        .union([
          z.number().int().positive(),
          z.string().transform((val) => parseInt(val, 10)),
          z.null(),
          z.undefined(),
        ])
        .optional(),
      employeeId: z.string().max(50).optional(),
      designation: z.string().max(100).optional(),
      joiningDate: z
        .union([z.string().datetime(), z.string(), z.date()])
        .optional(),
      salary: z
        .union([
          z.number().positive(),
          z.string().transform((val) => parseFloat(val)),
        ])
        .optional(),
      accountNumber: z.string().max(50).optional(),
      bankName: z.string().max(100).optional(),
      ifscCode: z.string().max(20).optional(),
    })
    .passthrough()
    .optional(),
  teacher: z
    .object({
      departmentId: z
        .union([
          z.number().int().positive(),
          z.string().transform((val) => parseInt(val, 10)),
          z.null(),
          z.undefined(),
        ])
        .optional(),
      employeeId: z.string().max(50).optional(),
      qualification: z.string().max(255).optional(),
      specialization: z.string().max(255).optional(),
      joiningDate: z
        .union([z.string().datetime(), z.string(), z.date()])
        .optional(),
      experience: z
        .union([
          z.number().int().min(0).max(50),
          z.string().transform((val) => parseInt(val, 10)),
        ])
        .optional(),
      salary: z
        .union([
          z.number().positive(),
          z.string().transform((val) => parseFloat(val)),
        ])
        .optional(),
      isClassTeacher: z
        .union([
          z.boolean(),
          z.string().transform((val) => val === 'true' || val === '1'),
          z.number().transform((val) => val === 1),
        ])
        .default(false),
    })
    .passthrough()
    .optional(),
}).passthrough(); // Allow extra fields

/**
 * User update schema
 */
export const UserUpdateSchema = UserCreateSchema.partial().extend({
  id: z.number().int().positive(),
  password: z.string().optional(), // Make password optional for updates
});

/**
 * User search schema
 */
export const UserSearchSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  // Sorting
  sortBy: z.enum(['username', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt', 'updatedAt', 'lastLogin']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Filtering
  search: z.string().optional().transform((val) => val?.trim()),
  username: z.string().optional().transform((val) => val?.trim()),
  firstName: z.string().optional().transform((val) => val?.trim()),
  lastName: z.string().optional().transform((val) => val?.trim()),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'HRM', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'CRM_MANAGER', 'BRANCH_MANAGER', 'COURSE_MANAGER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  schoolId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  classId: z.coerce.number().int().positive().optional(),
  createdByOwnerId: z.coerce.number().int().positive().optional(),

  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
  lastLoginAfter: z.string().datetime().optional(),
  lastLoginBefore: z.string().datetime().optional(),
  admissionDateAfter: z.string().datetime().optional(),
  admissionDateBefore: z.string().datetime().optional(),

  // Include relations
  include: z.string().optional().transform((val) =>
    val ? val.split(',').map(item => item.trim()) : []
  ),
});

/**
 * User bulk create schema
 */
export const UserBulkCreateSchema = z.object({
  users: z.array(UserCreateSchema).min(1).max(100),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    generatePasswords: z.boolean().default(false),
    sendWelcomeEmail: z.boolean().default(false),
    assignDefaultRole: z.boolean().default(true),
  }).optional(),
  user: z.object({
    id: z.number().int().positive(),
    role: z.string(),
  }).optional(),
});

/**
 * User bulk update schema
 */
export const UserBulkUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.number().int().positive(),
    data: UserUpdateSchema.omit({ id: true }),
  })).min(1).max(100),
  options: z.object({
    validateOnly: z.boolean().default(false),
    sendNotifications: z.boolean().default(true),
  }).optional(),
  user: z.object({
    id: z.number().int().positive(),
    role: z.string(),
  }).optional(),
});

/**
 * User import schema
 */
export const UserImportSchema = z.object({
  data: z.array(z.record(z.any())).min(1).max(1000),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateOnly: z.boolean().default(false),
    generatePasswords: z.boolean().default(false),
    sendWelcomeEmail: z.boolean().default(false),
    defaultRole: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'PARENT']).default('STUDENT'),
  }).optional(),
  user: z.object({
    id: z.number().int().positive(),
    role: z.string(),
  }).optional(),
});

/**
 * User export schema
 */
export const UserExportSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx', 'pdf']).default('json'),
  filters: UserSearchSchema.omit({ page: true, limit: true }).optional(),
  fields: z.array(z.string()).optional(),
  includeRelations: z.boolean().default(false),
  includeSensitiveData: z.boolean().default(false),
});

/**
 * User analytics schema
 */
export const UserAnalyticsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  metrics: z.array(z.enum(['registration', 'activity', 'performance', 'attendance', 'payments'])).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year', 'role', 'status']).optional(),
  schoolId: z.number().int().positive().optional(),
});

/**
 * User performance schema
 */
export const UserPerformanceSchema = z.object({
  academicYear: z.string().optional(),
  term: z.string().optional(),
  metrics: z.array(z.enum(['academic', 'attendance', 'behavior', 'extracurricular', 'overall'])).optional(),
  includeComparisons: z.boolean().default(true),
});

/**
 * User authentication schema
 */
export const UserAuthSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.union([z.string(), z.number()]).transform(val => String(val)).pipe(z.string().min(1, 'Password is required')),
  rememberMe: z.boolean().default(false),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    deviceType: z.string().optional(),
  }).optional(),
});

export const UserTempPasswordResetSchema = z.object({
  userId: z.union([z.string(), z.number()])
    .refine((value) => {
      const num = Number(value);
      return Number.isFinite(num) && num > 0;
    }, 'Valid userId is required')
    .transform((value) => Number(value)),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password must be less than 255 characters'),
});

/**
 * User password change schema
 */
export const UserPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password must be less than 255 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * User profile update schema
 */
export const UserProfileUpdateSchema = UserCreateSchema.pick({
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  address: true,
  emergencyContact: true,
  profilePicture: true,
  bio: true,
  timezone: true,
  locale: true,
  preferences: true,
}).partial();

// Teacher patch schema for nested updates
export const TeacherPatchSchema = z.object({
  departmentId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined(),
  ]).optional(),
  employeeId: z.string().max(50).optional(),
  qualification: z.string().max(255).optional(),
  specialization: z.string().max(255).optional(),
  joiningDate: z.union([z.string().datetime(), z.string(), z.date()]).optional(),
  experience: z.union([
    z.number().int().min(0).max(50),
    z.string().transform((val) => parseInt(val, 10)),
  ]).optional(),
  salary: z.union([
    z.number().positive(),
    z.string().transform((val) => parseFloat(val)),
  ]).optional(),
  isClassTeacher: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true' || val === '1'),
    z.number().transform((val) => val === 1),
  ]).optional(),
  schoolId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
    z.undefined(),
  ]).optional(),
}).partial().passthrough();

// Schema for generic PATCH updates (no id required in body) with optional nested teacher payload
export const UserPatchSchema = UserCreateSchema.partial().merge(z.object({
  teacher: TeacherPatchSchema.optional(),
}));

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Generate username from name
 */
export const generateUsername = (firstName, lastName) => {
  if (!firstName || !lastName) return null;

  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  const clean = base.replace(/[^a-z0-9]/g, '');

  return clean.substring(0, 20);
};

/**
 * Generate student ID
 */
export const generateStudentId = (schoolCode, year, sequence) => {
  const yearStr = year.toString().slice(-2);
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${schoolCode}${yearStr}${sequenceStr}`;
};

/**
 * Generate roll number
 */
export const generateRollNumber = (classId, sequence) => {
  return `${classId.toString().padStart(3, '0')}${sequence.toString().padStart(3, '0')}`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  if (!phone.startsWith('+')) {
    return `+${cleaned}`;
  }

  return phone;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    isValid: score >= 4,
    score,
    checks,
    strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong',
  };
};

/**
 * Generate user statistics
 */
export const generateUserStats = (user) => {
  return {
    totalSessions: user.sessions?.length || 0,
    totalDocuments: user.documents?.length || 0,
    totalMessages: user.sentMessages?.length || 0,
    totalReceivedMessages: user.receivedMessages?.length || 0,
    totalPayments: user.payments?.length || 0,
    totalAttendance: user.attendance?.length || 0,
    totalGrades: user.grades?.length || 0,
    totalAssignments: user.assignments?.length || 0,
    totalSubmissions: user.submissions?.length || 0,
    activeSessions: user.sessions?.filter(s => s.status === 'ACTIVE').length || 0,
    activeDocuments: user.documents?.filter(d => d.status === 'ACTIVE').length || 0,
  };
};

/**
 * Generate user analytics
 */
export const generateUserAnalytics = (user, period = '30d') => {
  return {
    period,
    activity: {
      loginFrequency: 0, // Would calculate from sessions
      lastActive: user.lastLogin,
      averageSessionDuration: 0, // Would calculate from sessions
    },
    academic: {
      attendanceRate: 0, // Would calculate from attendance
      averageGrade: 0, // Would calculate from grades
      completedAssignments: 0, // Would calculate from submissions
    },
    financial: {
      totalPaid: 0, // Would calculate from payments
      outstandingAmount: 0, // Would calculate from payments
      paymentHistory: [], // Would get from payments
    },
    engagement: {
      messagesSent: user.sentMessages?.length || 0,
      messagesReceived: user.receivedMessages?.length || 0,
      documentsUploaded: user.documents?.length || 0,
    },
  };
};

/**
 * Build user search query
 */
export const buildUserSearchQuery = (filters) => {
  const where = {};

  if (filters.search) {
    where.OR = [
      { username: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { studentId: { contains: filters.search, mode: 'insensitive' } },
      { rollNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.username) {
    where.username = { contains: filters.username, mode: 'insensitive' };
  }


  if (filters.firstName) {
    where.firstName = { contains: filters.firstName, mode: 'insensitive' };
  }

  if (filters.lastName) {
    where.lastName = { contains: filters.lastName, mode: 'insensitive' };
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.gender) {
    where.gender = filters.gender;
  }

  if (filters.schoolId) {
    where.schoolId = BigInt(filters.schoolId);
  }

  if (filters.departmentId) {
    where.departmentId = BigInt(filters.departmentId);
  }

  if (filters.classId) {
    where.classId = BigInt(filters.classId);
  }

  if (filters.createdByOwnerId) {
    where.createdByOwnerId = BigInt(filters.createdByOwnerId);
  }

  if (filters.createdAfter) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.createdAfter) };
  }

  if (filters.createdBefore) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.createdBefore) };
  }

  if (filters.updatedAfter) {
    where.updatedAt = { ...where.updatedAt, gte: new Date(filters.updatedAfter) };
  }

  if (filters.updatedBefore) {
    where.updatedAt = { ...where.updatedAt, lte: new Date(filters.updatedBefore) };
  }

  if (filters.lastLoginAfter) {
    where.lastLogin = { ...where.lastLogin, gte: new Date(filters.lastLoginAfter) };
  }

  if (filters.lastLoginBefore) {
    where.lastLogin = { ...where.lastLogin, lte: new Date(filters.lastLoginBefore) };
  }

  if (filters.admissionDateAfter) {
    where.admissionDate = { ...where.admissionDate, gte: new Date(filters.admissionDateAfter) };
  }

  if (filters.admissionDateBefore) {
    where.admissionDate = { ...where.admissionDate, lte: new Date(filters.admissionDateBefore) };
  }

  // Always exclude deleted users unless specifically requested
  where.deletedAt = null;

  return where;
};

/**
 * Build user include query
 */
export const buildUserIncludeQuery = (include = []) => {
  const includeQuery = {};

  if (include.includes('school')) {
    includeQuery.school = true;
  }

  // Department is linked through Staff/Teacher models, not directly to User
  // if (include.includes('department')) {
  //   includeQuery.department = true;
  // }

  if (include.includes('class')) {
    includeQuery.class = true;
  }

  if (include.includes('sessions')) {
    includeQuery.sessions = {
      where: { status: 'ACTIVE' },
      take: 10,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('documents')) {
    includeQuery.documents = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('payments')) {
    includeQuery.payments = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('attendance')) {
    includeQuery.attendance = {
      where: { deletedAt: null },
      take: 50,
      orderBy: { date: 'desc' },
    };
  }

  if (include.includes('grades')) {
    includeQuery.grades = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('assignments')) {
    includeQuery.assignments = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('submissions')) {
    includeQuery.submissions = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('sentMessages')) {
    includeQuery.sentMessages = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('receivedMessages')) {
    includeQuery.receivedMessages = {
      where: { deletedAt: null },
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('auditLogs')) {
    includeQuery.auditLogs = {
      take: 20,
      orderBy: { createdAt: 'desc' },
    };
  }

  if (include.includes('teacher')) {
    includeQuery.teacher = true;
  }

  if (include.includes('student')) {
    includeQuery.student = true;
  }

  if (include.includes('staff')) {
    includeQuery.staff = true;
  }

  if (include.includes('parent')) {
    includeQuery.parent = true;
  }

  return includeQuery;
};

/**
 * Generate user export data
 */
export const generateUserExportData = (users, format = 'json', includeSensitiveData = false) => {
  const exportUsers = users.map(user => {
    const exportUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      gender: user.gender,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      admissionDate: user.admissionDate,
      graduationDate: user.graduationDate,
      studentId: user.studentId,
      rollNumber: user.rollNumber,
      qualification: user.qualification,
      experience: user.experience,
      specialization: user.specialization,
      designation: user.designation,
      joiningDate: user.joiningDate,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (includeSensitiveData) {
      exportUser.address = user.address;
      exportUser.emergencyContact = user.emergencyContact;
      exportUser.metadata = user.metadata;
    }

    return exportUser;
  });

  switch (format) {
    case 'json':
      return exportUsers;

    case 'csv':
      const headers = Object.keys(exportUsers[0] || {});
      const csvData = exportUsers.map(user =>
        headers.map(header => {
          const value = user[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        }).join(',')
      );
      return [headers.join(','), ...csvData].join('\n');

    case 'xlsx':
      return exportUsers;

    case 'pdf':
      return exportUsers;

    default:
      return exportUsers;
  }
};

/**
 * Validate user import data
 */
export const validateUserImportData = (data) => {
  const results = {
    valid: [],
    invalid: [],
    errors: [],
  };

  data.forEach((row, index) => {
    try {
      const validated = UserCreateSchema.parse(row);
      results.valid.push(validated);
    } catch (error) {
      results.invalid.push(row);
      results.errors.push({
        row: index + 1,
        errors: error.errors,
      });
    }
  });

  return results;
};

/**
 * Generate username suggestions
 */
export const generateUsernameSuggestions = (firstName, lastName) => {
  if (!firstName || !lastName) return [];

  const base = generateUsername(firstName, lastName);
  const suggestions = [base];

  // Add variations
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${base}${i}`);
  }

  // Add year variations
  const currentYear = new Date().getFullYear();
  suggestions.push(`${base}${currentYear}`);

  return suggestions.slice(0, 5);
};

/**
 * Calculate user performance
 */
export const calculateUserPerformance = (user) => {
  return {
    academic: {
      score: 0,
      grade: 'N/A',
      trend: 0,
      attendanceRate: 0,
    },
    engagement: {
      score: 0,
      loginFrequency: 0,
      messageActivity: 0,
    },
    financial: {
      score: 0,
      paymentCompliance: 0,
      outstandingAmount: 0,
    },
    overall: {
      score: 0,
      grade: 'N/A',
      rank: 0,
    },
  };
}; 