export interface Student {
  id: number;
  uuid: string;
  userId: number;
  admissionNo: string;
  rollNo?: string;
  cardNo?: string;
  classId?: number;
  sectionId?: number;
  parentId?: number;
  localLastName?: string;
  admissionDate?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  aadharNo?: string;
  bankAccountNo?: string;
  bankName?: string;
  ifscCode?: string;
  previousSchool?: string;
  conversionDate?: string;
  convertedFromCustomerId?: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  // Relations
  user?: User;
  class?: Class;
  section?: Section;
  parent?: Parent;
  school?: School;
  convertedFromCustomer?: any;
  _count?: {
    attendances: number;
    grades: number;
    payments: number;
    documents: number;
  };
  attendances?: Attendance[];
  grades?: Grade[];
  payments?: Payment[];
  documents?: Document[];
  enrollments?: Enrollment[];
}

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  emailVerified?: string;
  phone?: string;
  phoneVerified?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dariName?: string;
  displayName?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  birthDate?: string;
  dateOfBirth?: string; // Add dateOfBirth field for controller compatibility
  avatar?: string;
  coverImage?: string;
  bio?: string;
  tazkiraNo?: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'STAFF' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'TRANSFERRED';
  lastLogin?: string;
  lastIp?: string;
  timezone?: string;
  locale?: string;
  metadata?: string;
  schoolId?: number;
  createdByOwnerId: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Add address fields for form compatibility
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Class {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  capacity: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Section {
  id: number;
  uuid: string;
  name: string;
  classId: number;
  teacherId?: number;
  capacity: number;
  roomNumber?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Parent {
  id: number;
  uuid: string;
  userId: number;
  occupation?: string;
  workplace?: string;
  annualIncome?: string;
  education?: string;
  employer?: string;
  designation?: string;
  workPhone?: string;
  emergencyContact?: string;
  relationship?: string;
  isGuardian?: boolean;
  isEmergencyContact?: boolean;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: User;
}

export interface School {
  id: number;
  uuid: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  establishedYear?: number;
  schoolType?: string;
  board?: string;
  medium?: string;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Attendance {
  id: number;
  uuid: string;
  studentId: number;
  classId?: number;
  subjectId?: number;
  academicSessionId?: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY';
  inTime?: string;
  outTime?: string;
  remarks?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Grade {
  id: number;
  uuid: string;
  studentId: number;
  subjectId: number;
  examId?: number;
  marksObtained: number;
  totalMarks: number;
  grade?: string;
  remarks?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Payment {
  id: number;
  uuid: string;
  studentId: number;
  amount: number;
  paymentDate: string;
  dueDate?: string;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAYED' | 'OVERDUE';
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK';
  type?: string;
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
  studentId: number;
  name: string;
  type: string;
  url: string;
  size?: number;
  mimeType?: string;
  description?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Dashboard Analytics Types
export interface StudentAnalytics {
  totalStudents: number;
  convertedStudents: number;
  conversionRate: number;
  recentConversions: number;
  conversionByMonth: any[];
  averageConversionTime: number;
  conversionEvents: ConversionEvent[];
  // Additional dashboard metrics
  classCount?: number;
  teacherCount?: number;
  subjectCount?: number;
  averageGrade?: number;
  attendanceRate?: number;
}

export interface ConversionEvent {
  id: string;
  eventType: string;
  createdAt: string;
  student: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
      displayName?: string;
    };
  };
}

export interface ClassPerformance {
  className: string;
  studentCount: number;
  averageAttendance: number;
  averageGPA: number;
}

export interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number;
}

export interface AttendanceTrend {
  date: string;
  attendance: number;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: string;
  color: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface StudentFilters {
  search?: string;
  classId?: number;
  sectionId?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'all';
  includeInactive?: boolean;
  gender?: string;
  branchId?: number | string;
  courseId?: number | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  classId?: number;
  period?: '1D' | '7D' | '30D' | '90D' | '6M' | '1Y';
  schoolId?: number;
  branchId?: number;
  courseId?: number;
}

export interface Enrollment {
  id: number | string;
  courseId: number;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  enrollmentDate: string;
  course?: Course;
}

export interface Course {
  id: number;
  name: string;
  code: string;
}