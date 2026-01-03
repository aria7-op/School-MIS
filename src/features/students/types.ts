export interface Student {
  id: number;
  uuid: string;
  userId: number;
  admissionNo: string;
  rollNo?: string;
  classId?: number;
  sectionId?: number;
  parentId?: number;
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
  _count?: {
    attendances: number;
    grades: number;
    payments: number;
    documents: number;
    bookIssues: number;
    studentTransports: number;
    assignmentSubmissions: number;
  };
  attendances?: Attendance[];
  grades?: Grade[];
  payments?: Payment[];
  documents?: Document[];
  bookIssues?: BookIssue[];
  studentTransports?: StudentTransport[];
  assignmentSubmissions?: AssignmentSubmission[];
}

export interface User {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'STAFF' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'TRANSFERRED';
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
  annualIncome?: number;
  education?: string;
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
  studentId: number;
  classId: number;
  subjectId?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
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
  examId: number;
  studentId: number;
  subjectId: number;
  marks: number;
  grade?: string;
  remarks?: string;
  isAbsent: boolean;
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
  amount: number;
  paymentDate: string;
  dueDate?: string;
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'ONLINE' | 'CARD' | 'UPI' | 'WALLET';
  paymentType: 'TUITION_FEE' | 'TRANSPORT_FEE' | 'LIBRARY_FEE' | 'LABORATORY_FEE' | 'SPORTS_FEE' | 'EXAM_FEE' | 'UNIFORM_FEE' | 'MEAL_FEE' | 'HOSTEL_FEE' | 'OTHER';
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  referenceNo?: string;
  remarks?: string;
  studentId?: number;
  parentId?: number;
  feeStructureId?: number;
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
  fileType: string;
  fileSize: number;
  documentType: 'ADMISSION_FORM' | 'BIRTH_CERTIFICATE' | 'TRANSFER_CERTIFICATE' | 'CHARACTER_CERTIFICATE' | 'MEDICAL_CERTIFICATE' | 'PHOTO' | 'ID_PROOF' | 'OTHER';
  studentId?: number;
  teacherId?: number;
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
  studentId?: number;
  teacherId?: number;
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

export interface StudentTransport {
  id: number;
  uuid: string;
  studentId: number;
  routeId: number;
  pickupLocation?: string;
  dropLocation?: string;
  monthlyFee: number;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  remarks?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AssignmentSubmission {
  id: number;
  uuid: string;
  assignmentId: number;
  studentId: number;
  submissionDate: string;
  status: 'SUBMITTED' | 'LATE' | 'NOT_SUBMITTED';
  marks?: number;
  feedback?: string;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Form Types
export interface StudentCreateForm {
  admissionNo?: string;
  rollNo?: string;
  classId?: number;
  sectionId?: number;
  parentId?: number;
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
  schoolId: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface StudentUpdateForm {
  admissionNo?: string;
  rollNo?: string;
  classId?: number;
  sectionId?: number;
  parentId?: number;
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
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'TRANSFERRED';
  };
}

export interface StudentSearchFilters {
  search?: string;
  classId?: number;
  sectionId?: number;
  parentId?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'TRANSFERRED';
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  page?: number;
  limit?: number;
  include?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response Types
export interface StudentListResponse {
  success: boolean;
  data: {
    students: Student[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface StudentResponse {
  success: boolean;
  data: Student;
  message: string;
}

export interface StudentStats {
  student: {
    id: number;
    admissionNo: string;
    rollNo?: string;
    name: string;
    email: string;
    status: string;
  };
  class?: {
    id: number;
    name: string;
    code: string;
  };
  section?: {
    id: number;
    name: string;
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  };
  academic: {
    totalGrades: number;
    totalMarks: number;
    averageMarks: number;
    passingGrades: number;
    passRate: number;
  };
  financial: {
    totalPayments: number;
    totalPaid: number;
    pendingPayments: number;
    paymentCompliance: number;
  };
  other: {
    totalDocuments: number;
    totalBookIssues: number;
    activeBookIssues: number;
    totalTransports: number;
    totalAssignments: number;
  };
}

export interface StudentAnalytics {
  attendance: {
    daily: { date: string; present: number; absent: number; late: number }[];
    weekly: { week: string; attendanceRate: number }[];
    monthly: { month: string; attendanceRate: number }[];
  };
  academic: {
    subjects: { subject: string; averageMarks: number }[];
    exams: { exam: string; marks: number; grade: string }[];
    trends: { period: string; averageMarks: number }[];
  };
  financial: {
    payments: { month: string; amount: number; status: string }[];
    outstanding: { type: string; amount: number }[];
  };
  performance: {
    overallScore: number;
    grade: string;
    rank?: number;
    recommendations: string[];
  };
}

// Customer Integration Types
export interface Customer {
  id: number;
  name: string;
  purpose: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  source: string;
  remark: string;
  added_by: number;
  department: string;
  status: 'active' | 'inactive';
}

export interface AcademicCustomer extends Customer {
  purpose: 'academic';
  // Additional fields for academic customers
  academicInterest?: string;
  preferredClass?: string;
  previousEducation?: string;
}

// Navigation Types
export type StudentStackParamList = {
  Students: undefined;
  AddStudent: undefined;
  EditStudent: { studentId: number };
  StudentDetail: { studentId: number };
  StudentStats: { studentId: number };
  StudentAnalytics: { studentId: number };
  StudentPerformance: { studentId: number };
  BulkImport: undefined;
  BulkExport: undefined;
  CustomerSelection: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends StudentStackParamList {}
  }
} 
