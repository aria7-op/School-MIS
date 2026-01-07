// ======================
// OVERVIEW TYPES
// ======================
export interface OverviewDashboard {
  overview: {
    schools: number;
    students: number;
    teachers: number;
    staff: number;
    parents: number;
    classes: number;
    activeUsers: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: string;
  };
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: number;
  type: string;
  amount: number;
  student: string;
  school: string;
  date: string;
}

// ======================
// FINANCIAL TYPES
// ======================
export interface FinancialOverview {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: string;
    totalPayments: number;
    totalExpenseTransactions: number;
    totalRefunds: number;
    pendingAmount: number;
    pendingCount: number;
  };
  paymentsByMethod: PaymentByMethod[];
  financialHealth: {
    revenueGrowth: number;
    expenseGrowth: number;
    cashFlow: number;
    profitability: string;
  };
}

export interface PaymentByMethod {
  method: string;
  amount: number;
  count: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByPeriod: PeriodData[];
  trend: {
    direction: string;
    percentage: number;
    change: number;
  };
  topRevenueStreams: RevenueStream[];
  avgTransactionValue: number;
}

export interface PeriodData {
  period: string;
  amount: number;
  count: number;
}

export interface RevenueStream {
  feeItemId: string;
  amount: number;
  count: number;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  expensesByPeriod: PeriodData[];
  expensesByCategory: ExpenseCategory[];
  topExpenses: Expense[];
  avgExpenseValue: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  count: number;
}

export interface Expense {
  amount: number;
  category: string;
  createdAt: string;
  description: string;
  school: { name: string };
}

export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    breakdown: {
      tuitionFees: number;
      otherFees: number;
    };
  };
  costs: {
    total: number;
    breakdown: {
      operationalExpenses: number;
      staffSalaries: number;
    };
  };
  profit: {
    gross: number;
    net: number;
    margin: string;
  };
  analysis: {
    isProfitable: boolean;
    status: string;
    recommendation: string;
  };
}

export interface PaymentTrends {
  byStatus: PaymentStatus[];
  byMethod: PaymentByMethod[];
  completionRate: string;
  monthlyTrends: PeriodData[];
}

export interface PaymentStatus {
  status: string;
  amount: number;
  count: number;
  percentage: string;
}

export interface SchoolFinancialComparison {
  schools: SchoolFinancialData[];
  totals: {
    revenue: number;
    expenses: number;
    netProfit: number;
  };
  rankings: {
    byRevenue: SchoolFinancialData[];
    byProfit: SchoolFinancialData[];
    byEfficiency: SchoolFinancialData[];
  };
}

export interface SchoolFinancialData {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: string;
  studentCount: number;
  revenuePerStudent: string;
}

// ======================
// ACADEMIC TYPES
// ======================
export interface AcademicOverview {
  overview: {
    totalStudents: number;
    totalClasses: number;
    totalSubjects: number;
    totalExams: number;
    averageAttendance: number;
    averageGrade: number;
  };
  performance: {
    excellentStudents: number;
    goodStudents: number;
    averageStudents: number;
    needsAttention: number;
  };
}

export interface StudentPerformanceAnalytics {
  students: StudentPerformanceData[];
  statistics: {
    totalStudents: number;
    excellentPerformers: number;
    goodPerformers: number;
    averagePerformers: number;
    needsAttention: number;
  };
}

export interface StudentPerformanceData {
  studentId: string;
  name: string;
  class: string;
  grade: string;
  averageMarks: string;
  totalAssignments: number;
  performanceLevel: string;
}

export interface AttendanceAnalytics {
  summary: {
    totalStudents: number;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: string;
  };
  trends: AttendanceTrend[];
  topAttendees: any[];
  lowAttendees: any[];
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

// ======================
// USER TYPES
// ======================
export interface UsersOverview {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    activeRate: string;
  };
  byRole: UserRoleData[];
  recentActivity: RecentUser[];
}

export interface UserRoleData {
  role: string;
  count: number;
  percentage: string;
}

export interface RecentUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  lastLogin: string;
}

export interface StudentAnalytics {
  total: number;
  demographics: {
    male: number;
    female: number;
    malePercentage: string;
    femalePercentage: string;
  };
  distribution: {
    byClass: ClassDistribution[];
  };
  enrollmentTrend: PeriodData[];
}

export interface ClassDistribution {
  classId: string;
  count: number;
}

export interface TeacherAnalytics {
  total: number;
  active: number;
  inactive: number;
  distribution: {
    byDepartment: DepartmentDistribution[];
  };
  workload: {
    averageClasses: number;
    mostEngaged: any[];
  };
}

export interface DepartmentDistribution {
  departmentId: string;
  count: number;
}

// ======================
// SCHOOL TYPES
// ======================
export interface SchoolsOverview {
  total: number;
  schools: SchoolData[];
}

export interface SchoolData {
  id: string;
  name: string;
  code: string;
  students: number;
  teachers: number;
  classes: number;
  staff: number;
}

// ======================
// SYSTEM TYPES
// ======================
export interface SystemHealth {
  status: string;
  database: {
    size: any[];
    totalRecords: number;
    connections: number;
  };
  errors: {
    last24Hours: number;
    severity: string;
  };
  uptime: number;
  memory: any;
  lastCheck: string;
}

export interface SystemPerformance {
  cpu: any;
  memory: any;
  uptime: number;
}

export interface RealTimeMetrics {
  timestamp: string;
  metrics: {
    activeUsers: number;
    recentPayments: number;
    recentAttendance: number;
    systemLoad: string;
    status: string;
  };
}

// ======================
// FILTER TYPES
// ======================
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface SchoolFilter extends DateRangeFilter {
  schoolId?: string;
}

export interface AcademicFilter extends DateRangeFilter {
  schoolId?: string;
  classId?: string;
}

export interface GroupByOption {
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

// ======================
// SCHOOL STRUCTURE TYPES
// ======================

export interface SuperadminManagerUser {
  id: string;
  uuid?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export interface SuperadminBranchManagerAssignment {
  id?: string;
  uuid?: string;
  schoolId?: string;
  branchId?: string;
  userId?: string;
  assignedBy?: string | null;
  assignedAt?: string;
  revokedAt?: string | null;
  manager?: SuperadminManagerUser | null;
}

export interface SuperadminBranch {
  id: string;
  uuid?: string;
  name: string;
  code: string;
  shortName?: string | null;
  type?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  isMain: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | string;
  openedDate?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  managerAssignments?: SuperadminBranchManagerAssignment[];
}

export interface SuperadminCourseManagerAssignment {
  id?: string;
  uuid?: string;
  schoolId?: string;
  courseId?: string;
  userId?: string;
  assignedBy?: string | null;
  assignedAt?: string;
  revokedAt?: string | null;
  manager?: SuperadminManagerUser | null;
}

export interface SuperadminCourseClassSummary {
  id: string;
  uuid?: string;
  name: string;
  code: string;
  level?: number | null;
  isActive?: boolean;
}

export interface SuperadminCourse {
  id: string;
  uuid?: string;
  name: string;
  code: string;
  type?: 'CORE' | 'ELECTIVE' | 'ENRICHMENT' | 'REMEDIAL' | 'EXTRACURRICULAR' | 'ONLINE' | string;
  description?: string | null;
  summary?: string | null;
  focusArea?: string | null;
  centerType?: 'ACADEMIC' | 'VOCATIONAL' | 'LANGUAGE' | 'RELIGIOUS' | 'TECHNOLOGY' | 'MIXED' | string;
  targetAudience?: 'PRIMARY' | 'SECONDARY' | 'ADULT' | 'ALL_AGES' | string;
  isActive: boolean;
  isAccredited?: boolean;
  enrollmentOpen?: boolean;
  branchId?: string | null;
  centerManagerId?: string | null;
  operatingHours?: string | null;
  scheduleType?: 'WEEKDAY' | 'WEEKEND' | 'EVENING' | 'FLEXIBLE' | string;
  budget?: number | null;
  resources?: Record<string, unknown> | null;
  policies?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  managerAssignments?: SuperadminCourseManagerAssignment[];
  classes?: SuperadminCourseClassSummary[];
}

export interface SuperadminManagerPayload {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSuperadminBranchPayload {
  name: string;
  code: string;
  shortName?: string | null;
  type?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  isMain?: boolean;
  status?: SuperadminBranch['status'];
  openedDate?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type UpdateSuperadminBranchPayload = Partial<CreateSuperadminBranchPayload>;

export interface AssignSuperadminBranchManagerPayload {
  managerUserId?: string;
  manager?: SuperadminManagerPayload;
  branchIds?: Array<string | number>;
}

export interface CreateSuperadminCoursePayload {
  name: string;
  code: string;
  description?: string | null;
  summary?: string | null;
  focusArea?: string | null;
  centerType?: 'ACADEMIC' | 'VOCATIONAL' | 'LANGUAGE' | 'RELIGIOUS' | 'TECHNOLOGY' | 'MIXED' | string;
  targetAudience?: 'PRIMARY' | 'SECONDARY' | 'ADULT' | 'ALL_AGES' | string;
  isActive?: boolean;
  isAccredited?: boolean;
  enrollmentOpen?: boolean;
  branchId?: string | number | null;
  centerManagerId?: string | number | null;
  operatingHours?: string | null;
  scheduleType?: 'WEEKDAY' | 'WEEKEND' | 'EVENING' | 'FLEXIBLE' | string;
  budget?: number | null;
  resources?: Record<string, unknown> | null;
  policies?: Record<string, unknown> | null;
}

export type UpdateSuperadminCoursePayload = Partial<CreateSuperadminCoursePayload>;

export interface AssignSuperadminCourseManagerPayload {
  managerUserId?: string;
  manager?: SuperadminManagerPayload;
  courseIds?: Array<string | number>;
}

export interface SuperadminQuotaSnapshot {
  limit: number | null;
  used: number;
  remaining: number | null;
  overLimit: boolean;
}

export interface SuperadminStructureQuota {
  schoolId: string;
  branches: SuperadminQuotaSnapshot;
  courses: SuperadminQuotaSnapshot;
  branchManagers: SuperadminQuotaSnapshot;
  courseManagers: SuperadminQuotaSnapshot;
}

