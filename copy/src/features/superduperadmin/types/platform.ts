export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PlatformPackageFeatureValue = boolean | number | null | string[] | undefined;

export interface PlatformPackageFeatures {
  modules_enabled?: string[];
  [featureKey: string]: PlatformPackageFeatureValue;
}

export interface PlatformPackage {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  features: PlatformPackageFeatures;
  supportLevel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformAuditLogFilters {
  tenantId?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface PlatformAuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  tenantId?: string;
  schoolId?: string;
  schoolName?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  metadata?: unknown;
  createdAt?: string;
}

export interface PlatformSchoolSummary {
  id: string;
  name: string;
  code?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'DEACTIVATED' | string;
  tenantId?: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  package?: PlatformPackage | null;
  subscriptionStatus?: string;
}

export interface PlatformSchoolUsage {
  schools?: number;
  students?: number;
  teachers?: number;
  staff?: number;
  storageGb?: number;
  lastSyncAt?: string;
  [key: string]: unknown;
}

export interface PlatformSchoolDetail {
  school: PlatformSchoolSummary;
  usage: PlatformSchoolUsage;
}

export interface PlatformSubscriptionSummary {
  id: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | string;
  schoolId: string;
  package: PlatformPackage | null;
  startedAt?: string;
  expiresAt?: string;
  renewedAt?: string;
  autoRenew?: boolean;
}

export interface PlatformDashboardOverview {
  totals: {
    schools: number;
    activeSchools: number;
    subscriptions: number;
    activeSubscriptions: number;
    revenue: number;
  };
  recentSubscriptions: Array<{
    id: string;
    status: string;
    createdAt?: string;
    school?: {
      id: string;
      name: string;
      code?: string;
    } | null;
    package?: Pick<PlatformPackage, 'id' | 'name'> | null;
  }>;
}

export type PlatformAnalyticsRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface PlatformAnalyticsFilters {
  range?: PlatformAnalyticsRange;
  dateFrom?: string;
  dateTo?: string;
  schoolId?: string | number;
  packageId?: string | number;
  country?: string;
  state?: string;
  city?: string;
  lifecycle?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface PlatformFinancialAnalytics {
  range: PlatformAnalyticsRange;
  revenue: number;
  outstanding: number;
  overdue: number;
  revenueTrend: Record<string, number>;
  cashFlowTrend: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  invoiceAging?: Record<string, number>;
  agingBuckets?: Record<string, number>;
  dso: number | null;
  averagePaymentDelay: number | null;
  collectionRate: number | null;
  invoicesSummary?: Array<{
    id?: string;
    schoolName?: string;
    amount?: number;
    dueDate?: string;
    status?: string;
    agingBucket?: string;
  }>;
  topOutstandingSchools?: Array<{
    schoolId?: string;
    schoolName?: string;
    outstanding?: number;
    overdue?: number;
  }>;
  recentInvoices?: Array<{
    id?: string;
    schoolName?: string;
    amount?: number;
    dueDate?: string;
    status?: string;
  }>;
}

export interface PlatformRevenueAnalytics {
  range: PlatformAnalyticsRange;
  startDate: string;
  endDate: string;
  filters?: Record<string, unknown>;
  totals: {
    revenue: number;
    mrr: number;
    arr: number;
    arpu: number;
    averageTransactionValue: number;
    payingSchools: number;
    transactions: number;
  };
  trend: Record<string, number>;
  packageBreakdown: Record<string, number>;
}

export interface PlatformGrowthAnalytics {
  range: PlatformAnalyticsRange;
  startDate: string;
  endDate: string;
  filters?: Record<string, unknown>;
  totals: {
    newSchools: number;
    churnedSchools: number;
    netGrowth: number;
    activeSchools: number;
    churnRate: number;
    retentionRate: number;
  };
  trends: {
    newSchools: Record<string, number>;
    churnedSchools: Record<string, number>;
  };
}

export interface PlatformPackagePerformanceAnalytics {
  range: PlatformAnalyticsRange;
  startDate: string;
  endDate: string;
  filters?: Record<string, unknown>;
  totals: {
    packagesTracked: number;
    activeSchools: number;
    averageArpu: number;
    upgradeRequests: number;
    downgradeRequests: number;
  };
  packages: Array<{
    packageId: string;
    packageName: string;
    revenue: number;
    transactions: number;
    activeSchools: number;
    arpu: number;
  }>;
  adoptionTrend: Array<{
    date: string;
    packages: Record<string, number>;
  }>;
}

export interface PlatformAttendanceAnalytics {
  range: PlatformAnalyticsRange;
  startDate: string;
  endDate: string;
  totals: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    halfDay: number;
    averageAttendance: number;
    lateRate: number;
  };
  dailyTrend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
  classLeaders: Array<{
    classId: string;
    className: string;
    attendancePercent: number;
  }>;
  subjectAlerts: Array<{
    subjectId: string;
    subjectName: string;
    absenceCount: number;
  }>;
}

export interface ReportExportJob {
  id: string;
  reportKey: string;
  filters: Record<string, unknown>;
  format: 'CSV' | 'PDF';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  resultUrl?: string | null;
  errorMessage?: string | null;
  requestedAt: string;
  completedAt?: string | null;
  expiresAt?: string | null;
}

export interface ReportSchedule {
  id: string;
  reportKey: string;
  filters: Record<string, unknown>;
  format: 'CSV' | 'PDF';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  cronExpression?: string | null;
  recipients: string[];
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
  exports?: ReportExportJob[];
}

export interface PlatformCustomReport {
  id: string;
  uuid: string;
  name: string;
  description?: string | null;
  reportKey: string;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, unknown>;
  visualization: Record<string, unknown>;
  isShared: boolean;
  createdBy?: string | null;
  schoolId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCustomReportMetadata {
  metrics: Array<{
    id: string;
    label: string;
    description: string;
    type: string;
  }>;
  dimensions: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

export interface PlatformCustomReportResult {
  range: string;
  startDate: string;
  endDate: string;
  rows: Array<{
    dimensions: Record<string, string>;
    metrics: {
      totalRevenue: number;
      transactionCount: number;
    };
  }>;
  summary: {
    totalRevenue: number;
    transactionCount: number;
  };
  dimensionsUsed: string[];
  metricsUsed: string[];
}

export interface PlatformBenchmarkingAnalytics {
  range: string;
  startDate: string;
  endDate: string;
  summary: {
    totalRevenue: number;
    transactionCount: number;
  };
  topPackages: Array<{ name: string; revenue: number }>;
  topCountries: Array<{ name: string; revenue: number }>;
}

export interface PlatformLogSummaryAnalytics {
  range: string;
  startDate: string;
  endDate: string;
  totals: {
    totalEvents: number;
    averageLatencyMs: number | null;
    infoEvents: number;
    warningEvents: number;
    errorEvents: number;
  };
  severityCounts: {
    info: number;
    warning: number;
    error: number;
  };
  topActions: Array<{ action: string; count: number }>;
  topEndpoints: Array<{ path: string; count: number }>;
  topActors: Array<{
    userId: string;
    count: number;
    user: {
      id: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
    } | null;
  }>;
  sparkline: Array<{
    date: string;
    total: number;
    errors: number;
    warnings: number;
  }>;
}

export interface PlatformLogTimelineEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  schoolId?: string;
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  userId?: string;
  user?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  requestMethod?: string | null;
  requestPath?: string | null;
  requestUrl?: string | null;
  requestHeaders?: Record<string, unknown> | null;
  requestQuery?: Record<string, unknown> | null;
  requestBody?: Record<string, unknown> | null;
  responseStatus?: number | null;
  responseTimeMs?: number | null;
  isSuccess?: boolean | null;
  errorMessage?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  traceId?: string | null;
  createdAt: string;
}

export interface PlatformLogTimelineResult extends PaginatedResult<PlatformLogTimelineEntry> {
  range: string;
  startDate: string;
  endDate: string;
}

export interface PlatformReportsSummary {
  totals: {
    students: number;
    teachers: number;
    staff: number;
    parents: number;
    schools: number;
    activeSchools: number;
    revenue: number;
    transactions: number;
  };
}

export interface PlatformChurnAnalytics {
  range: '7d' | '30d' | '90d' | '1y';
  churnRate: number;
  cancellations: number;
  reactivations: number;
  netChange: number;
  trend: Array<{ label: string; value: number }>;
}

export interface PlatformSchoolComparisonEntry {
  schoolId: string;
  schoolName: string;
  metric: string;
  value: number;
  rank: number;
}

export interface PlatformManagerUser {
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

export interface PlatformBranchManagerAssignment {
  id?: string;
  uuid?: string;
  schoolId?: string;
  branchId?: string;
  userId?: string;
  assignedBy?: string | null;
  assignedAt?: string;
  revokedAt?: string | null;
  manager?: PlatformManagerUser | null;
}

export interface PlatformBranch {
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
  managerAssignments?: PlatformBranchManagerAssignment[];
}

export interface PlatformCourseManagerAssignment {
  id?: string;
  uuid?: string;
  schoolId?: string;
  courseId?: string;
  userId?: string;
  assignedBy?: string | null;
  assignedAt?: string;
  revokedAt?: string | null;
  manager?: PlatformManagerUser | null;
}

export interface PlatformCourseClassSummary {
  id: string;
  uuid?: string;
  name: string;
  code: string;
  level?: number | null;
  isActive?: boolean;
}

export interface PlatformCourse {
  id: string;
  uuid?: string;
  name: string;
  code: string;
  type: 'CORE' | 'ELECTIVE' | 'ENRICHMENT' | 'REMEDIAL' | 'EXTRACURRICULAR' | 'ONLINE' | string;
  description?: string | null;
  summary?: string | null;
  objectives?: unknown;
  creditHours?: number | null;
  level?: number | null;
  durationWeeks?: number | null;
  deliveryMode?: string | null;
  language?: string | null;
  isActive: boolean;
  isPublished: boolean;
  enrollmentCap?: number | null;
  departmentId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  managerAssignments?: PlatformCourseManagerAssignment[];
  classes?: PlatformCourseClassSummary[];
}

export interface PlatformManagerPayload {
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

export interface CreatePlatformBranchPayload {
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
  status?: PlatformBranch['status'];
  openedDate?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type UpdatePlatformBranchPayload = Partial<CreatePlatformBranchPayload>;

export interface AssignBranchManagerPayload {
  managerUserId?: string;
  manager?: PlatformManagerPayload;
  branchIds?: Array<string | number>;
}

export interface CreatePlatformCoursePayload {
  name: string;
  code: string;
  type: PlatformCourse['type'];
  description?: string | null;
  summary?: string | null;
  objectives?: unknown;
  creditHours?: number | null;
  level?: number | null;
  durationWeeks?: number | null;
  deliveryMode?: string | null;
  language?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  enrollmentCap?: number | null;
  departmentId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type UpdatePlatformCoursePayload = Partial<CreatePlatformCoursePayload>;

export interface AssignCourseManagerPayload {
  managerUserId?: string;
  manager?: PlatformManagerPayload;
  courseIds?: Array<string | number>;
}

export interface CreatePlatformSchoolPayload {
  owner: {
    id?: string;
    name?: string;
    phone?: string;
    password?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    timezone?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
  };
  superAdmin: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    timezone?: string;
    locale?: string;
    metadata?: Record<string, unknown>;
  };
  school: {
    name: string;
    code: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    address: string;
    postalCode?: string;
    timezone?: string;
    locale?: string;
    description?: string;
    website?: string;
    metadata?: Record<string, unknown>;
  };
  packageId: string | number;
  subscription?: {
    durationDays?: number;
    startDate?: string;
    autoRenew?: boolean;
  };
}

export interface PlatformSubscriptionFilters {
  status?: string;
  packageId?: string;
  schoolId?: string;
  page?: number;
  limit?: number;
}

export interface PlatformSchoolFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PlatformQueryFilters {
  search?: string;
  status?: string;
  packageId?: string;
  page?: number;
  limit?: number;
}
