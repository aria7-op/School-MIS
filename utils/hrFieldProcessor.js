// ======================
// HR FIELD PROCESSING UTILITIES
// ======================

/**
 * Process and organize HR fields for metadata storage
 */
export const processHRFieldsForMetadata = (data, role) => {
  const metadata = {};
  
  // Branch and Course assignments
  if (data.branchId) {
    metadata.branchId = data.branchId;
  }
  
  if (data.courseId) {
    metadata.courseId = data.courseId;
  }
  
  // Teaching-specific data
  if (data.subjectsCanTeach && Array.isArray(data.subjectsCanTeach)) {
    metadata.subjectsCanTeach = data.subjectsCanTeach.filter(subject => subject && subject.trim());
  }
  
  // Contract and salary information
  if (data.contractDates) {
    metadata.contractDates = {
      startDate: data.contractDates.startDate,
      endDate: data.contractDates.endDate || null
    };
  }
  
  if (data.salaryStructure) {
    metadata.salaryStructure = {
      type: data.salaryStructure.type,
      amount: data.salaryStructure.amount,
      currency: data.salaryStructure.currency || 'AFN'
    };
  }
  
  // Professional information
  if (data.totalExperience !== undefined) {
    metadata.totalExperience = Number(data.totalExperience);
  }
  
  if (data.relevantExperience) {
    metadata.relevantExperience = data.relevantExperience.trim();
  }
  
  metadata.shift = data.shift || 'morning';
  metadata.workTime = data.workTime || 'FullTime';
  
  // Emergency contacts
  if (data.relativesInfo && Array.isArray(data.relativesInfo)) {
    metadata.relativesInfo = data.relativesInfo.filter(relative => 
      relative.name && relative.phone && relative.relation
    );
  }
  
  // Course preferences for teaching roles
  if (data.coursePreferences) {
    metadata.coursePreferences = {
      preferredShifts: data.coursePreferences.preferredShifts || [],
      maxCoursesPerTerm: data.coursePreferences.maxCoursesPerTerm || 3,
      preferredSubjects: data.coursePreferences.preferredSubjects || [],
      preferredRoomTypes: data.coursePreferences.preferredRoomTypes || []
    };
  }
  
  // Course assignments
  if (data.courseAssignments && Array.isArray(data.courseAssignments)) {
    metadata.courseAssignments = data.courseAssignments.map(assignment => ({
      courseId: assignment.courseId,
      courseName: assignment.courseName || null,
      role: assignment.role || 'teacher',
      salary: assignment.salary || null,
      schedule: assignment.schedule || null
    }));
  }
  
  // Document file references
  const documents = {};
  const documentFields = [
    'profilePicture', 'cvFile', 'tazkiraFile', 'lastDegreeFile', 
    'experienceFile', 'contractFile', 'bankAccountFile'
  ];
  
  documentFields.forEach(field => {
    if (data[field]) {
      documents[field] = data[field];
    }
  });
  
  if (Object.keys(documents).length > 0) {
    metadata.documents = documents;
  }
  
  // Role-specific metadata
  metadata.roleSpecific = processRoleSpecificMetadata(role, data);
  
  return metadata;
};

/**
 * Process role-specific metadata
 */
export const processRoleSpecificMetadata = (role, data) => {
  const roleSpecific = {};
  
  switch (role) {
    case 'TEACHER':
    case 'SCHOOL_ADMIN':
      roleSpecific.teaching = {
        qualification: data.qualification || '',
        specialization: data.specialization || '',
        experience: data.experience || 0,
        isClassTeacher: data.isClassTeacher || false
      };
      
      // Salary history tracking
      roleSpecific.salaryHistory = [{
        effectiveDate: data.joiningDate || new Date().toISOString(),
        salaryType: data.salaryStructure?.type || 'fixed',
        amount: data.salary || data.salaryStructure?.amount || 0,
        courseId: data.courseId || null,
        reason: 'Initial assignment'
      }];
      
      // Performance metrics
      roleSpecific.performanceMetrics = {
        targetStudentRetention: 85,
        targetAverageScore: 75,
        targetCompletionRate: 90,
        currentMetrics: {
          studentRetentionRate: 0,
          averageStudentScore: 0,
          courseCompletionRate: 0
        }
      };
      break;
      
    case 'HRM':
    case 'BRANCH_MANAGER':
      roleSpecific.management = {
        department: data.departmentId || null,
        managedStaff: [],
        authorityLevel: role === 'BRANCH_MANAGER' ? 'branch' : 'department'
      };
      break;
      
    case 'ACCOUNTANT':
      roleSpecific.finance = {
        accessLevel: 'department',
        authorizedTransactions: ['salary', 'expenses', 'fees'],
        reportingRequirements: ['monthly', 'quarterly', 'annual']
      };
      break;
      
    case 'LIBRARIAN':
      roleSpecific.library = {
        managedSections: ['general', 'reference', 'digital'],
        permissions: ['checkout', 'checkin', 'inventory']
      };
      break;
      
    case 'CRM_MANAGER':
      roleSpecific.crm = {
        accessLevel: 'school',
        managedModules: ['contacts', 'communications', 'followups']
      };
      break;
      
    case 'COURSE_MANAGER':
      roleSpecific.courseManagement = {
        managedCourses: [],
        permissions: ['create', 'update', 'delete', 'assign']
      };
      break;
  }
  
  return roleSpecific;
};

/**
 * Extract HR fields from user data for database storage
 */
export const extractHRFieldsForDatabase = (data) => {
  const dbFields = {};
  const metadataFields = {};
  
  // Fields that go directly to user table
  const directUserFields = [
    'username', 'firstName', 'lastName', 'fatherName', 'email', 'phone',
    'password', 'role', 'status', 'schoolId', 'branchId', 'courseId',
    'timezone', 'locale', 'dateOfBirth', 'tazkiraNo', 'createdByOwnerId'
  ];
  
  // Fields that go to metadata
  const metadataFieldList = [
    'subjectsCanTeach', 'contractDates', 'salaryStructure', 'totalExperience',
    'relevantExperience', 'shift', 'workTime', 'relativesInfo', 'coursePreferences',
    'courseAssignments', 'profilePicture', 'cvFile', 'tazkiraFile', 'lastDegreeFile',
    'experienceFile', 'contractFile', 'bankAccountFile'
  ];
  
  // Fields that go to staff table
  const staffFields = [
    'designation', 'employeeId', 'joiningDate', 'salary', 'accountNumber',
    'bankName', 'ifscCode'
  ];
  
  // Fields that go to teacher table
  const teacherFields = [
    'qualification', 'specialization', 'experience', 'isClassTeacher'
  ];
  
  // Separate fields
  directUserFields.forEach(field => {
    if (data[field] !== undefined) {
      dbFields[field] = data[field];
    }
  });
  
  metadataFieldList.forEach(field => {
    if (data[field] !== undefined) {
      metadataFields[field] = data[field];
    }
  });
  
  staffFields.forEach(field => {
    if (data[field] !== undefined) {
      dbFields.staff = dbFields.staff || {};
      dbFields.staff[field] = data[field];
    }
  });
  
  teacherFields.forEach(field => {
    if (data[field] !== undefined) {
      dbFields.teacher = dbFields.teacher || {};
      dbFields.teacher[field] = data[field];
    }
  });
  
  return {
    userFields: dbFields,
    metadataFields,
    staffFields: dbFields.staff || {},
    teacherFields: dbFields.teacher || {}
  };
};

/**
 * Transform user data for API response
 */
export const transformUserDataForAPI = (user, includeMetadata = true) => {
  const transformed = {
    id: user.id?.toString(),
    uuid: user.uuid,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    fatherName: user.fatherName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    schoolId: user.schoolId?.toString(),
    branchId: user.branchId?.toString(),
    courseId: user.courseId?.toString(),
    timezone: user.timezone,
    locale: user.locale,
    dateOfBirth: user.dateOfBirth,
    tazkiraNo: user.tazkiraNo,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  // Include metadata if requested and available
  if (includeMetadata && user.metadata) {
    try {
      const metadata = typeof user.metadata === 'string' 
        ? JSON.parse(user.metadata) 
        : user.metadata;
      
      // Extract metadata fields to top level for easier access
      if (metadata.subjectsCanTeach) {
        transformed.subjectsCanTeach = metadata.subjectsCanTeach;
      }
      
      if (metadata.contractDates) {
        transformed.contractDates = metadata.contractDates;
      }
      
      if (metadata.salaryStructure) {
        transformed.salaryStructure = metadata.salaryStructure;
      }
      
      if (metadata.totalExperience !== undefined) {
        transformed.totalExperience = metadata.totalExperience;
      }
      
      if (metadata.relevantExperience) {
        transformed.relevantExperience = metadata.relevantExperience;
      }
      
      if (metadata.shift) {
        transformed.shift = metadata.shift;
      }
      
      if (metadata.workTime) {
        transformed.workTime = metadata.workTime;
      }
      
      if (metadata.relativesInfo) {
        transformed.relativesInfo = metadata.relativesInfo;
      }
      
      if (metadata.coursePreferences) {
        transformed.coursePreferences = metadata.coursePreferences;
      }
      
      if (metadata.courseAssignments) {
        transformed.courseAssignments = metadata.courseAssignments;
      }
      
      if (metadata.documents) {
        transformed.documents = metadata.documents;
      }
      
      if (metadata.roleSpecific) {
        transformed.roleSpecific = metadata.roleSpecific;
      }
      
      // Keep full metadata as well
      transformed.metadata = metadata;
    } catch (error) {
      console.warn('Failed to parse user metadata:', error);
      transformed.metadata = {};
    }
  }
  
  return transformed;
};

/**
 * Generate employee ID based on role and school
 */
export const generateEmployeeId = (role, userId, schoolCode = '') => {
  const roleCode = {
    'TEACHER': 'TCH',
    'SCHOOL_ADMIN': 'ADM',
    'HRM': 'HRM',
    'BRANCH_MANAGER': 'BRM',
    'ACCOUNTANT': 'ACC',
    'LIBRARIAN': 'LIB',
    'CRM_MANAGER': 'CRM',
    'COURSE_MANAGER': 'CSM',
    'STAFF': 'STF'
  };
  
  const code = roleCode[role] || 'STF';
  const timestamp = Date.now().toString().slice(-6);
  
  return `${schoolCode}${code}_${userId}_${timestamp}`;
};

/**
 * Process course assignments for database storage
 */
export const processCourseAssignments = (assignments, userId, schoolId, branchId, createdBy) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return [];
  }
  
  return assignments.map((assignment, index) => ({
    uuid: `assignment_${userId}_${index}_${Date.now()}`,
    teacherId: BigInt(userId),
    courseId: BigInt(assignment.courseId),
    schoolId: BigInt(schoolId),
    branchId: branchId ? BigInt(branchId) : null,
    role: assignment.role || 'teacher',
    salary: assignment.salary ? JSON.stringify(assignment.salary) : '{}',
    schedule: assignment.schedule ? JSON.stringify(assignment.schedule) : '{}',
    assignedBy: BigInt(createdBy),
    createdAt: new Date(),
    updatedAt: new Date()
  }));
};

/**
 * Calculate salary based on structure
 */
export const calculateSalary = (salaryStructure, baseSalary = 0, studentCount = 0) => {
  if (!salaryStructure) return baseSalary;
  
  switch (salaryStructure.type) {
    case 'fixed':
      return salaryStructure.amount || baseSalary;
      
    case 'percentage':
      const percentage = salaryStructure.percentage || 20;
      const averageFee = salaryStructure.averageStudentFee || 10000;
      return (averageFee * studentCount * percentage) / 100;
      
    case 'hourly':
      const hours = salaryStructure.hoursPerMonth || 160;
      const hourlyRate = salaryStructure.hourlyRate || 100;
      return hours * hourlyRate;
      
    default:
      return baseSalary;
  }
};

/**
 * Validate and process document uploads
 */
export const processDocumentUploads = (files, userId) => {
  const processedDocuments = {};
  
  for (const [field, file] of Object.entries(files)) {
    if (file) {
      processedDocuments[field] = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId
      };
    }
  }
  
  return processedDocuments;
};

/**
 * Generate audit log entry for HR operations
 */
export const generateHRAuditLog = (action, userId, targetUserId, changes, metadata = {}) => {
  return {
    action,
    userId: BigInt(userId),
    targetUserId: BigInt(targetUserId),
    changes: JSON.stringify(changes),
    metadata: JSON.stringify(metadata),
    ipAddress: metadata.ipAddress || 'unknown',
    userAgent: metadata.userAgent || 'unknown',
    timestamp: new Date(),
    module: 'HR_MANAGEMENT'
  };
};

// Export all processing functions
export default {
  processHRFieldsForMetadata,
  processRoleSpecificMetadata,
  extractHRFieldsForDatabase,
  transformUserDataForAPI,
  generateEmployeeId,
  processCourseAssignments,
  calculateSalary,
  processDocumentUploads,
  generateHRAuditLog
};
