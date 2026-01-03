// src/features/classes/types.ts
export interface Class {
  id: number;
  name: string;
  code: string;
  level: number;
  section?: string;
  roomNumber?: string;
  capacity: number;
  classTeacherId?: number;
  schoolId: number;
  isActive: boolean;
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
  createdBy?: number;
  updatedBy?: number;
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
  section?: string;
  roomNumber?: string;
  capacity: number;
  classTeacherId?: number;
  schoolId: number;
  academicYear?: string;
  semester?: string;
  description?: string;
  schedule?: string;
  location?: string;
  maxStudents?: number;
}

export interface ClassUpdateRequest extends Partial<ClassCreateRequest> {
  isActive?: boolean;
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

export interface ClassAdvancedSearchParams extends ClassSearchParams {
  capacityMin?: number;
  capacityMax?: number;
  levelRange?: string;
  studentCountMin?: number;
  studentCountMax?: number;
  subjectCountMin?: number;
  subjectCountMax?: number;
}

export interface ClassBulkCreateRequest {
  classes: ClassCreateRequest[];
  options?: {
    skipDuplicates?: boolean;
    validateOnly?: boolean;
    generateCodes?: boolean;
    assignDefaultTeacher?: boolean;
  };
}

export interface ClassBulkUpdateRequest {
  updates: Array<{
    id: number;
    data: ClassUpdateRequest;
  }>;
  options?: {
    validateOnly?: boolean;
    sendNotifications?: boolean;
    updateRelatedRecords?: boolean;
  };
}

// ======================
// ANALYTICS & STATISTICS TYPES
// ======================

export interface ClassAnalyticsParams {
  period?: '7d' | '30d' | '90d' | '1y' | 'all';
  metrics?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'level' | 'section';
  schoolId?: number;
  level?: number;
}

export interface ClassPerformanceParams {
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
  endDate?: string;
  metrics?: string[];
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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ClassListResponse {
  data: Class[];
  pagination: PaginationMeta;
  meta: {
    timestamp: string;
    source: string;
    filters: number;
    cacheHit: boolean;
  };
}

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

export interface ClassPerformance {
  classId: number;
  className: string;
  metrics: {
    attendanceRate: number;
    averageGrade: number;
    completionRate: number;
    studentSatisfaction: number;
  };
  trends: {
    attendanceTrend: number;
    gradeTrend: number;
    completionTrend: number;
  };
  comparisons: {
    schoolAverage: number;
    levelAverage: number;
    previousPeriod: number;
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

export interface ClassAnalyticsState {
  stats: ClassStats | null;
  analytics: ClassAnalytics | null;
  performance: ClassPerformance | null;
  loading: boolean;
  error: string | null;
  filters: ClassAnalyticsParams;
}

// Change ClassFilters to ClassFilter (singular)
export interface ClassFilter {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

// Add ClassFilters type alias for backward compatibility
export type ClassFilters = ClassSearchParams;

export interface ClassAction {
  id: string;
  label: string;
  icon: string;
  action: (classId: number) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ClassExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeFields: string[];
  filters: ClassSearchParams;
  filename?: string;
}

export interface ClassImportOptions {
  file: File;
  mapping: Record<string, string>;
  options: {
    skipDuplicates: boolean;
    validateOnly: boolean;
    updateExisting: boolean;
  };
}

// ======================
// BULK OPERATIONS TYPES
// ======================

export interface BulkAssignTeacherRequest {
  classIds: number[];
  teacherId: number;
}

export interface BulkUpdateCapacityRequest {
  classIds: number[];
  capacity: number;
}

export interface BulkTransferStudentsRequest {
  fromClassId: number;
  toClassId: number;
  studentIds: number[];
}

// ======================
// CACHE MANAGEMENT TYPES
// ======================

export interface CacheStats {
  totalKeys: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

export interface CacheHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  memoryUsage: number;
  keyCount: number;
}

// ======================
// UTILITY TYPES
// ======================

export interface ClassCodeGenerationRequest {
  schoolId: number;
  level: number;
  section?: string;
  format?: string;
}

export interface ClassSectionGenerationRequest {
  schoolId: number;
  level: number;
  sectionCount: number;
  capacity: number;
  startingSection?: string;
}

export interface ClassNameSuggestion {
  name: string;
  code: string;
  score: number;
}

export interface ClassCodeSuggestion {
  code: string;
  available: boolean;
  alternatives?: string[];
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

export const CLASS_INCLUDE_OPTIONS = [
  { value: 'school', label: 'School' },
  { value: 'students', label: 'Students' },
  { value: 'subjects', label: 'Subjects' },
  { value: 'classTeacher', label: 'Class Teacher' },
  { value: 'timetables', label: 'Timetables' },
  { value: 'exams', label: 'Exams' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'attendances', label: 'Attendances' },
  { value: 'sections', label: 'Sections' },
  { value: '_count', label: 'Counts' },
];
