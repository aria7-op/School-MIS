export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  qualification: string;
  degree: string;
  experience: number;
  department: string;
  subject: string;
  salary: number;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  hireDate: string;
  photo?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents: TeacherDocument[];
  schedule: TeacherSchedule[];
  performance: TeacherPerformance[];
  attendance: TeacherAttendance[];
  createdAt: string;
  updatedAt: string;
}

export interface TeacherDocument {
  id: string;
  teacherId: string;
  type: 'ID' | 'Certificate' | 'Contract' | 'Photo' | 'Other';
  name: string;
  url: string;
  uploadedAt: string;
}

export interface TeacherSchedule {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  classId: string;
  room: string;
}

export interface TeacherPerformance {
  id: string;
  teacherId: string;
  period: string;
  attendanceRate: number;
  studentSatisfaction: number;
  academicResults: number;
  overallRating: number;
  comments: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Leave';
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface TeachersResponse {
  success: boolean;
  message: string;
  data: Teacher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TeacherResponse {
  success: boolean;
  message: string;
  data: Teacher;
}

export interface TeacherStats {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  newTeachersThisMonth: number;
  averageExperience: number;
  averageSalary: number;
  departmentDistribution: {
    department: string;
    count: number;
    percentage: number;
  }[];
  qualificationDistribution: {
    qualification: string;
    count: number;
    percentage: number;
  }[];
}

export interface TeacherAnalytics {
  period: string;
  attendanceTrend: AttendanceTrend[];
  performanceTrend: PerformanceTrend[];
  salaryTrend: SalaryTrend[];
  studentSatisfactionTrend: SatisfactionTrend[];
  departmentPerformance: DepartmentPerformance[];
  topPerformers: TopPerformer[];
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    leave: number;
  };
  performanceSummary: {
    excellent: number;
    good: number;
    average: number;
    belowAverage: number;
  };
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
}

export interface PerformanceTrend {
  period: string;
  averageRating: number;
  studentSatisfaction: number;
  academicResults: number;
  attendanceRate: number;
}

export interface SalaryTrend {
  month: string;
  totalSalary: number;
  averageSalary: number;
  bonus: number;
}

export interface SatisfactionTrend {
  period: string;
  averageSatisfaction: number;
  totalResponses: number;
}

export interface DepartmentPerformance {
  department: string;
  averageRating: number;
  totalTeachers: number;
  topPerformer: string;
}

export interface TopPerformer {
  teacherId: string;
  teacherName: string;
  department: string;
  rating: number;
  achievements: string[];
}

export interface TeacherFilters {
  department?: string;
  status?: string;
  experience?: string;
  qualification?: string;
  salaryRange?: [number, number];
  gender?: string;
  hireDateRange?: {
    start: string;
    end: string;
  };
}

export interface TeacherSearchParams {
  query?: string;
  filters?: TeacherFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include?: string[];
}

export interface TeacherSortOptions {
  field: 'name' | 'email' | 'department' | 'salary' | 'experience' | 'hireDate';
  order: 'asc' | 'desc';
}

export interface BulkCreateRequest {
  teachers: Partial<Teacher>[];
  validateOnly?: boolean;
}

export interface BulkUpdateRequest {
  updates: Array<{
    id: string;
    data: Partial<Teacher>;
  }>;
  validateOnly?: boolean;
}

export interface BulkDeleteRequest {
  teacherIds: string[];
  softDelete?: boolean;
}

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
}

export interface ExportRequest {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  filters?: TeacherFilters;
  fields?: string[];
  includeDocuments?: boolean;
}

export interface ImportRequest {
  file: File;
  format: 'csv' | 'xlsx' | 'json';
  mapping?: Record<string, string>;
  validateOnly?: boolean;
}

export interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  results: Array<{
    row: number;
    success: boolean;
    data?: Teacher;
    error?: string;
  }>;
}

export interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  lastCleared: string;
}

export interface CacheWarmRequest {
  patterns: string[];
  ttl?: number;
}

export interface DepartmentStats {
  department: string;
  count: number;
  percentage: number;
  averageSalary: number;
  averageExperience: number;
}

export interface ExperienceStats {
  range: string;
  count: number;
  percentage: number;
}

export interface TeacherInsights {
  teacherId: string;
  insights: string[];
  trends: {
    positive: number;
    negative: number;
  };
  recommendations: string[];
  predictions: {
    retention: number;
    performance: number;
    satisfaction: number;
  };
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    action?: string;
  }>;
}

export interface PerformancePrediction {
  teacherId: string;
  period: string;
  predictedRating: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
}

export interface BehavioralAnalysis {
  teacherId: string;
  patterns: Array<{
    pattern: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
}

export interface TeacherNotification {
  id: string;
  teacherId: string;
  type: 'attendance' | 'performance' | 'salary' | 'schedule' | 'evaluation' | 'achievement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  qualification: string;
  degree: string;
  experience: number;
  department: string;
  subject: string;
  salary: number;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  hireDate: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface TeacherValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  qualification?: string;
  degree?: string;
  experience?: string;
  department?: string;
  subject?: string;
  salary?: string;
  status?: string;
  hireDate?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

// Hook return types
export interface UseTeacherListReturn {
  teachers: Teacher[];
  filteredTeachers: Teacher[];
  selectedTeachers: Set<string>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  searchQuery: string;
  filters: TeacherFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  selectedCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<TeacherFilters>) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  toggleTeacherSelection: (teacherId: string) => void;
  selectAllTeachers: () => void;
  clearSelection: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  bulkDelete: () => Promise<BulkOperationResult>;
  bulkActivate: () => Promise<BulkOperationResult>;
  bulkDeactivate: () => Promise<BulkOperationResult>;
  bulkExport: (format: string) => Promise<void>;
  bulkUpdate: (updates: any[]) => Promise<BulkOperationResult>;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}

export interface UseTeacherAnalyticsReturn {
  analytics: TeacherAnalytics | null;
  performanceMetrics: TeacherPerformance | null;
  departmentStats: DepartmentStats[] | null;
  realTimeUpdates: any | null;
  aiInsights: TeacherInsights | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchAnalytics: (dateRange?: { start: Date; end: Date }) => Promise<void>;
  fetchMetrics: () => Promise<void>;
  fetchDepartmentStats: () => Promise<void>;
  fetchPerformanceData: (teacherId?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  exportAnalytics: (format: string) => Promise<void>;
  generateReport: (type: string) => Promise<void>;
  subscribeToRealTimeUpdates: () => void;
  unsubscribeFromRealTimeUpdates: () => void;
}

export interface UseTeacherBulkOperationsReturn {
  selectedTeachers: Set<string>;
  bulkOperationProgress: number;
  loading: boolean;
  error: string | null;
  results: BulkOperationResult | null;
  currentOperation: string | null;
  selectTeacher: (teacherId: string) => void;
  deselectTeacher: (teacherId: string) => void;
  selectAll: (teachers: Teacher[]) => void;
  deselectAll: () => void;
  toggleSelection: (teacherId: string) => void;
  bulkCreate: (data: BulkCreateRequest) => Promise<BulkOperationResult>;
  bulkUpdate: (data: BulkUpdateRequest) => Promise<BulkOperationResult>;
  bulkDelete: (data: BulkDeleteRequest) => Promise<BulkOperationResult>;
  bulkUpdateStatus: (teacherIds: string[], status: string) => Promise<BulkOperationResult>;
  exportSelected: (format: string) => Promise<void>;
  exportFiltered: (format: string) => Promise<void>;
  importTeachers: (data: ImportRequest) => Promise<ImportResult>;
  clearResults: () => void;
  clearErrors: () => void;
}
