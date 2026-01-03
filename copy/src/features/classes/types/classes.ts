// copy/src/features/classes/types/classes.ts
export interface Class {
  id: string;
  uuid: string;
  name: string;
  code: string;
  level: number;
  section?: string;
  roomNumber?: string;
  capacity: number;
  expectedFees?: number;
  shift?: 'morning' | 'afternoon';
  gender?: 'boys' | 'girls' | 'mixed';
  classTeacherId?: number | null;
  schoolId: string;
  isActive?: boolean | number;
  academicYear?: string;
  semester?: string;
  description?: string;
  schedule?: string;
  location?: string;
  maxStudents?: number;
  currentStudents?: number;
  grade?: string;
  studentsCount?: number;
  avatar?: string;
  subjects?: Subject[];
  students?: Student[];
  classTeacher?: Teacher;
  school?: School;
  timetables?: Timetable[];
  exams?: Exam[];
  assignments?: Assignment[];
  attendances?: Attendance[];
  sections?: ClassSection[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string | null;
  deletedAt?: string | null;
  _count?: {
    students: number;
    subjects: number;
    timetables: number;
    exams: number;
    assignments: number;
    attendances: number;
  };
}

// ======================
// RELATED ENTITY TYPES
// ======================

export interface School {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Teacher {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  subjects?: string[];
  experience?: number;
  qualification?: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  grade?: string;
  parentId?: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  teacherId?: number;
}

export interface Timetable {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  teacherId: number;
  roomNumber?: string;
}

export interface Exam {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  totalMarks: number;
  passingMarks: number;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  subjectId: number;
}

export interface Attendance {
  id: number;
  date: string;
  studentId: number;
  academicSessionId?: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

export interface ClassSection {
  id: number;
  name: string;
  code: string;
  capacity: number;
  currentStudents: number;
}

// ======================
// API REQUEST TYPES
// ======================

export interface ClassCreateRequest {
  name: string;
  code: string;
  level: number;
  capacity: number;
  expectedFees?: number;
  shift?: 'morning' | 'afternoon';
  gender?: 'boys' | 'girls' | 'mixed';
  schoolId: number;
  createdBy: number;
}

export interface ClassUpdateRequest extends Partial<ClassCreateRequest> {
  isActive?: boolean;
  updatedBy: number;
}

export interface ClassSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  level?: number;
  section?: string;
  schoolId?: number;
  classTeacherId?: number;
  hasStudents?: boolean;
  hasSubjects?: boolean;
  hasTimetable?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  include?: string;
}

// ======================
// ANALYTICS & STATISTICS TYPES
// ======================

export interface ClassStats {
  totalClasses: number;
  activeClasses: number;
  inactiveClasses: number;
  totalStudents: number;
  totalTeachers: number;
  averageClassSize: number;
  maxClassSize: number;
  minClassSize: number;
  averageAttendance: number;
  averageGrade: number;
  levelDistribution: Array<{
    level: number;
    count: number;
    percentage: number;
  }>;
  sectionDistribution: Array<{
    section: string;
    count: number;
    percentage: number;
  }>;
  capacityUtilization: {
    underCapacity: number;
    atCapacity: number;
    overCapacity: number;
  };
}

export interface ClassAnalytics {
  period: string;
  data: Array<{
    date: string;
    totalClasses: number;
    activeClasses: number;
    newClasses: number;
    totalStudents: number;
    averageAttendance: number;
  }>;
  trends: {
    classGrowth: number;
    studentGrowth: number;
    attendanceTrend: number;
  };
}

// ======================
// STATE MANAGEMENT TYPES
// ======================

export interface ClassListState {
  classes: Class[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
  filters: ClassSearchParams;
  selectedClasses: number[];
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ClassFormState {
  formData: ClassCreateRequest;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  isEdit: boolean;
  originalData?: Class;
}

export interface ClassDetailsState {
  class: Class | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
  relatedData: {
    students: Student[];
    subjects: Subject[];
    timetables: Timetable[];
    exams: Exam[];
    assignments: Assignment[];
    attendances: Attendance[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    timestamp: string;
    source?: string;
    pagination?: PaginationMeta;
    filters?: number;
    cacheHit?: boolean;
  };
}

// ======================
// CONSTANTS
// ======================

export const CLASS_LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
export const CLASS_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const ACADEMIC_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
export const SEMESTERS = ['Fall', 'Spring', 'Summer'];

export const CLASS_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export const CLASS_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'level', label: 'Level' },
  { value: 'section', label: 'Section' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
];