
// Attendance Types and Interfaces
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';

export type InTimeStatus = 'ON_TIME' | 'LATE' | 'VERY_LATE';

export type OutTimeStatus = 'EARLY_LEAVE' | 'ON_TIME' | 'OVERTIME';

export type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export type StudentStatus = 'active' | 'inactive' | 'graduated';

export type TeacherStatus = 'active' | 'inactive';

export type AttendanceViewMode = 'list' | 'grid' | 'table' | 'monthly' | 'calendar' | 'analytics';

export type SortOrder = 'asc' | 'desc';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface AttendanceFilters {
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  classId?: string;
  studentId?: string;
  academicSessionId?: string;
  status?: AttendanceStatus;
  searchQuery?: string;
  schoolId?: string;
  branchId?: string;
  courseId?: string;
  teacherId?: string;
}

export interface SortConfig {
  field: keyof AttendanceRecord;
  order: SortOrder;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

export interface AttendanceTableConfig {
  filters: AttendanceFilters;
  sort: SortConfig;
  pagination: PaginationConfig;
  viewMode: AttendanceViewMode;
}

// Core Models
export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Class {
  id: string;
  name: string;
  code?: string;
  grade?: string;
  section?: string;
  teacherId?: string;
  teacherName?: string;
  schedule?: string;
  room?: string;
  totalStudents?: number;
  presentToday?: number;
  absentToday?: number;
  lateToday?: number;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  classId: string;
  className: string;
  schoolId: string;
  status: StudentStatus;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    dariName?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  subjects: string[];
  classes: string[];
  schoolId: string;
  status: TeacherStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  classId: string;
  className: string;
  schoolId: string;
  academicSessionId?: string;
  date: string;
  inTime?: string;
  outTime?: string;
  status: AttendanceStatus;
  inTimeStatus?: InTimeStatus;
  outTimeStatus?: OutTimeStatus;
  remarks?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  date: string;
  classId: string;
  className: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  halfDay: number;
  attendanceRate: number;
  onTimeRate: number;
  lateRate: number;
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  halfDay: number;
  attendanceRate: number;
  students: StudentAttendanceRecord[];
}

export interface StudentAttendanceRecord {
  studentId: string;
  studentName: string;
  studentRollNo: string;
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  remarks?: string;
}

export interface AttendanceStats {
  totalDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  averageAttendanceRate: number;
  totalHours: number;
  dailyTrends: DailyTrend[];
  weeklyPatterns: WeeklyPattern[];
  monthlyTrends: MonthlyTrend[];
  studentStats: StudentAttendanceStats[];
  topStudents: StudentAttendanceStats[];
  bottomStudents: StudentAttendanceStats[];
  timeAnalysis: TimeAnalysis;
  recentTrend: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  insights: AttendanceInsights;
}

export interface DailyTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface WeeklyPattern {
  week: string;
  averageAttendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}

export interface MonthlyTrend {
  month: string;
  averageAttendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
}

export interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  studentRollNo: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
  averageHours: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeAnalysis {
  averageInTime: string;
  averageOutTime: string;
  averageHours: number;
  onTimeRate: number;
  lateRate: number;
  earlyLeaveRate: number;
  overtimeRate: number;
}

export interface AttendanceInsights {
  bestDay: string;
  worstDay: string;
  bestStudent: string;
  worstStudent: string;
  averageAttendanceRate: number;
  improvementAreas: string[];
  recommendations: string[];
}

export interface BulkAttendanceData {
  classId: string;
  date: string;
  records: StudentAttendanceRecord[];
}

export interface AttendanceExportData {
  classId: string;
  className: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  stats: AttendanceStats;
}

// API Response Types
export interface AttendanceApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  success: boolean;
}

export interface PaginatedAttendanceResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  totalPages: number;
}

// Filter Types
export interface AttendanceFilter {
  classId?: string;
  studentId?: string;
  schoolId?: string;
  teacherId?: string;
  academicSessionId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  searchQuery?: string;
  page?: number;
  limit?: number;
  include?: string;
}

// Component Props
export interface AttendanceListProps {
  records: AttendanceRecord[];
  students: Student[];
  onEdit?: (recordId: string) => void;
  onAdd?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onStatusChange?: (recordId: string, status: AttendanceStatus) => void;
}

export interface AttendanceCalendarProps {
  markedDates: { [date: string]: { marked: boolean; dotColor: string } };
  onDayPress?: (date: string) => void;
  selectedDate?: string;
}

export interface AttendanceFiltersProps {
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
  classes: Class[];
  students: Student[];
  onApply: () => void;
  onReset: () => void;
}

export interface AttendanceStatsProps {
  stats: AttendanceStats;
  loading?: boolean;
  onRefresh?: () => void;
}

export interface AttendanceAnalyticsProps {
  data: any;
  loading?: boolean;
  onRefresh?: () => void;
}