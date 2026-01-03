export interface StaffMember {
  id: number;
  name: string;
  position: string;
  salary: number;
  avatar?: string;
  contact_number: string;
  email: string;
  address: string;
  joining_date: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Teacher extends StaffMember {
  specialization: string;
  teaching_subjects: string[];
  teaching_experience: number;
  qualification: string;
}

// ======================
// CORE STAFF TYPES
// ======================

export interface Staff {
  id: number;
  uuid: string;
  userId: number;
  employeeId: string;
  departmentId?: number;
  designation: string;
  joiningDate?: string;
  salary?: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  // Relations
  user?: User;
  department?: Department;
  school?: School;
  attendances?: Attendance[];
  payrolls?: Payroll[];
  documents?: Document[];
  bookIssues?: BookIssue[];
}

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  birthDate?: string;
  avatar?: string;
  bio?: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'STAFF' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'TRANSFERRED';
  timezone?: string;
  locale?: string;
  metadata?: Record<string, any>;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Department {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  headId?: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface School {
  id: number;
  uuid: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  principalPhone?: string;
  principalEmail?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Attendance {
  id: number;
  uuid: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';
  remarks?: string;
  staffId?: number;
  classId?: number;
  subjectId?: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Payroll {
  id: number;
  uuid: string;
  staffId: number;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate?: string;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  remarks?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Document {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  filePath: string;
  fileSize: number;
  documentType: 'ID_PROOF' | 'ADDRESS_PROOF' | 'BIRTH_CERTIFICATE' | 'TRANSFER_CERTIFICATE' | 'MARKSHEET' | 'PHOTOGRAPH' | 'MEDICAL_CERTIFICATE' | 'OTHER';
  staffId?: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BookIssue {
  id: number;
  uuid: string;
  bookId: number;
  staffId?: number;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST' | 'DAMAGED';
  fineAmount?: number;
  remarks?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ======================
// FORM TYPES
// ======================

export interface StaffCreateForm {
  // User fields
  username: string;
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  birthDate?: string;
  avatar?: string;
  bio?: string;
  
  // Staff specific fields
  employeeId?: string;
  departmentId?: number;
  designation: string;
  joiningDate?: string;
  salary?: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  
  // System fields
  schoolId: number;
  timezone?: string;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface StaffUpdateForm {
  // User fields
  email?: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  birthDate?: string;
  avatar?: string;
  bio?: string;
  
  // Staff specific fields
  employeeId?: string;
  departmentId?: number;
  designation?: string;
  joiningDate?: string;
  salary?: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  
  // System fields
  timezone?: string;
  locale?: string;
  metadata?: Record<string, any>;
}

// ======================
// SEARCH & FILTER TYPES
// ======================

export interface StaffSearchFilters {
  search?: string;
  name?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  departmentId?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  
  // Salary filters
  minSalary?: number;
  maxSalary?: number;
  salaryRange?: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Date filters
  joiningDateAfter?: string;
  joiningDateBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  
  // Status filters
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' | 'employeeId' | 'designation' | 'salary' | 'joiningDate';
  sortOrder?: 'asc' | 'desc';
  
  // Include relations
  include?: string[];
  
  // School filter
  schoolId?: number;
}

export interface StaffListResponse {
  success: boolean;
  data: {
    staff: Staff[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface StaffResponse {
  success: boolean;
  data: Staff;
  message: string;
}

// ======================
// STATISTICS & ANALYTICS TYPES
// ======================

export interface StaffStats {
  staff: {
    id: number;
    employeeId: string;
    name: string;
    email: string;
    status: string;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  };
  payroll: {
    totalPayrolls: number;
    totalPaid: number;
    pendingPayrolls: number;
    averageSalary: number;
  };
  performance: {
    totalDocuments: number;
    totalBookIssues: number;
    activeBookIssues: number;
    experience: number;
  };
}

export interface StaffAnalytics {
  attendance: {
    daily: { date: string; present: number; absent: number; late: number }[];
    weekly: { week: string; attendanceRate: number }[];
    monthly: { month: string; attendanceRate: number }[];
  };
  payroll: {
    monthly: { month: string; amount: number; status: string }[];
    trends: { period: string; averageSalary: number }[];
  };
  performance: {
    documents: { month: string; count: number }[];
    bookIssues: { month: string; count: number }[];
    overallScore: number;
    grade: string;
    recommendations: string[];
  };
}

export interface StaffPerformance {
  attendance: {
    currentMonth: number;
    lastMonth: number;
    trend: number;
  };
  payroll: {
    totalEarnings: number;
    averageSalary: number;
    paymentCompliance: number;
  };
  documents: {
    totalUploaded: number;
    recentUploads: number;
  };
  bookIssues: {
    totalIssued: number;
    overdueBooks: number;
    returnRate: number;
  };
  experience: {
    yearsOfService: number;
    department: string;
    designation: string;
  };
}

// ======================
// BULK OPERATION TYPES
// ======================

export interface StaffBulkCreateData {
  staff: StaffCreateForm[];
  skipDuplicates?: boolean;
}

export interface StaffBulkUpdateData {
  updates: {
    id: number;
    data: StaffUpdateForm;
  }[];
}

export interface StaffBulkDeleteData {
  staffIds: number[];
}

export interface BulkOperationResult {
  success: boolean;
  created?: number;
  updated?: number;
  deleted?: number;
  failed?: number;
  errors?: string[];
  data?: Staff[];
}

// ======================
// EXPORT/IMPORT TYPES
// ======================

export interface StaffExportOptions {
  format?: 'json' | 'csv' | 'excel';
  filters?: StaffSearchFilters;
  include?: string[];
  fields?: string[];
}

export interface StaffImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
  data?: Staff[];
}

// ======================
// CACHE TYPES
// ======================

export interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  averageTTL: number;
}

// ======================
// REPORT TYPES
// ======================

export interface StaffReport {
  summary: {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    suspendedStaff: number;
  };
  departmentDistribution: {
    department: string;
    count: number;
    percentage: number;
  }[];
  designationDistribution: {
    designation: string;
    count: number;
    percentage: number;
  }[];
  salaryDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  joiningTrends: {
    year: number;
    count: number;
  }[];
  attendanceSummary: {
    averageAttendance: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
  };
}

// ======================
// DASHBOARD TYPES
// ======================

export interface StaffDashboard {
  overview: {
    totalStaff: number;
    activeStaff: number;
    newThisMonth: number;
    averageSalary: number;
  };
  departmentStats: {
    department: string;
    count: number;
    averageSalary: number;
  }[];
  recentActivity: {
    type: 'created' | 'updated' | 'deleted';
    staff: Staff;
    timestamp: string;
  }[];
  upcomingEvents: {
    type: 'birthday' | 'anniversary' | 'contract_end';
    staff: Staff;
    date: string;
  }[];
  attendanceToday: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

// ======================
// COMPARISON TYPES
// ======================

export interface StaffComparison {
  staff1: Staff;
  staff2: Staff;
  comparison: {
    attendance: {
      staff1: number;
      staff2: number;
      difference: number;
    };
    salary: {
      staff1: number;
      staff2: number;
      difference: number;
    };
    experience: {
      staff1: number;
      staff2: number;
      difference: number;
    };
    performance: {
      staff1: number;
      staff2: number;
      difference: number;
    };
  };
}

// ======================
// NAVIGATION TYPES
// ======================

export type StaffStackParamList = {
  Staff: undefined;
  AddStaff: undefined;
  EditStaff: { staffId: number };
  StaffDetail: { staffId: number };
  StaffStats: { staffId: number };
  StaffAnalytics: { staffId: number };
  StaffPerformance: { staffId: number };
  BulkImport: undefined;
  BulkExport: undefined;
  StaffReport: undefined;
  StaffDashboard: undefined;
  StaffComparison: { staffId1: number; staffId2: number };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends StaffStackParamList {}
  }
}
