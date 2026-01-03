import secureApiService, { ApiResponse } from '../../../services/secureApiService';
import {
  CreatePlatformSchoolPayload,
  PaginatedResult,
  PlatformAnalyticsFilters,
  PlatformAttendanceAnalytics,
  PlatformBenchmarkingAnalytics,
  PlatformChurnAnalytics,
  PlatformCustomReportMetadata,
  PlatformCustomReportResult,
  PlatformCustomReport,
  PlatformDashboardOverview,
  PlatformFinancialAnalytics,
  PlatformGrowthAnalytics,
  PlatformPackage,
  PlatformPackageFeatures,
  PlatformPackageFeatureValue,
  PlatformPackagePerformanceAnalytics,
  ReportExportJob,
  ReportSchedule,
  PlatformRevenueAnalytics,
  PlatformAuditLogEntry,
  PlatformAuditLogFilters,
  PlatformQueryFilters,
  PlatformReportsSummary,
  PlatformSchoolComparisonEntry,
  PlatformSchoolDetail,
  PlatformSchoolFilters,
  PlatformSchoolSummary,
  PlatformSubscriptionFilters,
  PlatformSubscriptionSummary,
  PlatformLogSummaryAnalytics,
  PlatformLogTimelineResult,
} from '../types';

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'object' && value !== null && Array.isArray((value as any).d)) {
    const [first] = (value as any).d;
    const parsed = Number(first);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

type PlatformLogAnalyticsFilters = PlatformAnalyticsFilters & {
  severity?: 'INFO' | 'WARNING' | 'ERROR';
  action?: string;
  entityType?: string;
  userId?: string | number;
  search?: string;
  isSuccess?: boolean;
  responseStatusFrom?: string | number;
  responseStatusTo?: string | number;
  page?: number;
  limit?: number;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object' && value) {
    const candidate =
      (value as any).date ||
      (value as any).start ||
      (value as any).end ||
      (value as any).value;
    if (candidate) {
      return normalizeDate(candidate);
    }
  }
  return undefined;
};

const extractData = <T>(response: ApiResponse<T> | T): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

const withPagination = <T>(payload: any, fallbackLimit = 25): PaginatedResult<T> => {
  const dataArray: T[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  const meta =
    payload?.pagination ||
    payload?.meta ||
    payload?.data?.pagination ||
    payload?.data?.meta || {};

  return {
    data: dataArray,
    total: normalizeNumber(meta.total, dataArray.length),
    page: normalizeNumber(meta.page, 1),
    limit: normalizeNumber(meta.limit, fallbackLimit),
    totalPages: normalizeNumber(meta.pages ?? meta.totalPages, 1),
  };
};

const mapPackage = (pkg: any): PlatformPackage => ({
  id: pkg.id?.toString?.() ?? pkg.packageId ?? 'unknown',
  name: pkg.name ?? 'Unnamed Package',
  description: pkg.description ?? undefined,
  priceMonthly: normalizeNumber(pkg.priceMonthly ?? pkg.monthlyPrice ?? pkg.price ?? 0),
  priceYearly: normalizeNumber(pkg.priceYearly ?? pkg.annualPrice ?? pkg.yearlyPrice ?? 0),
  isActive: Boolean(pkg.isActive ?? pkg.active ?? true),
  features: normalizePackageFeatures(pkg.features),
  supportLevel: pkg.supportLevel ?? pkg.supportTier,
  createdAt: normalizeDate(pkg.createdAt),
  updatedAt: normalizeDate(pkg.updatedAt),
});

const mapSchool = (school: any): PlatformSchoolSummary => ({
  id: school.id?.toString?.() ?? school.schoolId ?? 'unknown',
  name: school.name ?? 'Unnamed School',
  code: school.code ?? school.slug ?? undefined,
  status: school.status ?? 'ACTIVE',
  tenantId: school.tenantId ?? undefined,
  ownerId: school.ownerId ?? school.owner_id ?? undefined,
  ownerName: school.owner?.name ?? school.ownerName,
  ownerPhone: school.owner?.phone ?? school.ownerPhone,
  country: school.country ?? school.address?.country,
  state: school.state ?? school.address?.state,
  city: school.city ?? school.address?.city,
  address: school.address ?? school.addressLine1 ?? undefined,
  createdAt: normalizeDate(school.createdAt) ?? new Date().toISOString(),
  updatedAt: normalizeDate(school.updatedAt) ?? new Date().toISOString(),
  package: school.subscription?.package ? mapPackage(school.subscription.package) : null,
  subscriptionStatus: school.subscription?.status,
});

const mapSchoolDetail = (payload: any): PlatformSchoolDetail => ({
  school: mapSchool(payload.school ?? payload),
  usage: {
    schools: normalizeNumber(payload.usage?.schools ?? payload.metricSchools),
    students: normalizeNumber(payload.usage?.students ?? payload.metricStudents),
    teachers: normalizeNumber(payload.usage?.teachers ?? payload.metricTeachers),
    staff: normalizeNumber(payload.usage?.staff ?? payload.metricStaff),
    storageGb: normalizeNumber(payload.usage?.storageGb ?? payload.metricStorage),
    lastSyncAt: normalizeDate(payload.usage?.lastSyncAt ?? payload.metricLastSyncAt),
    ...((payload.usage ?? {}) as Record<string, unknown>),
  },
});

const mapSubscription = (subscription: any): PlatformSubscriptionSummary => ({
  id: subscription.id?.toString?.() ?? 'unknown',
  status: subscription.status ?? 'ACTIVE',
  schoolId: subscription.schoolId?.toString?.() ?? subscription.school?.id ?? 'unknown',
  package: subscription.package ? mapPackage(subscription.package) : null,
  startedAt: normalizeDate(subscription.startDate ?? subscription.startedAt),
  expiresAt: normalizeDate(subscription.endDate ?? subscription.expiresAt),
  renewedAt: normalizeDate(subscription.renewedAt),
  autoRenew: Boolean(subscription.autoRenew ?? subscription.auto_renew),
});

const toRecord = (input: any): Record<string, string> => {
  const params: Record<string, string> = {};
  Object.entries(input || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params[key] = String(value);
  });
  return params;
};

type MutablePackageFeatures = Record<string, PlatformPackageFeatureValue>;

export const buildFeatureDefaults = (): PlatformPackageFeatures => ({
  modules_enabled: [],
  max_staff: null,
  max_schools: null,
  max_students: null,
  max_teachers: null,
  max_storage_gb: null,
  max_branches_per_school: null,
});

const normalizeFeaturePayload = (features: unknown): PlatformPackageFeatures => {
  const defaults = buildFeatureDefaults();
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return { ...defaults };
  }

  const normalized: MutablePackageFeatures = { ...defaults };

  Object.entries(features as Record<string, unknown>).forEach(([key, value]) => {
    if (key === 'modules_enabled') {
      if (Array.isArray(value)) {
        normalized.modules_enabled = value.filter((item): item is string => typeof item === 'string');
      }
      return;
    }
    if (typeof value === 'boolean' || typeof value === 'number' || value === null) {
      normalized[key] = value as PlatformPackageFeatureValue;
      return;
    }
    if (Array.isArray(value)) {
      normalized[key] = value.filter((item): item is string => typeof item === 'string') as PlatformPackageFeatureValue;
      return;
    }
    normalized[key] = value as PlatformPackageFeatureValue;
  });

  if (!Array.isArray(normalized.modules_enabled)) {
    normalized.modules_enabled = [];
  }

  return normalized as PlatformPackageFeatures;
};

export const normalizePackageFeatures = (features?: unknown): PlatformPackageFeatures => {
  if (!features) {
    return buildFeatureDefaults();
  }
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return normalizeFeaturePayload(parsed);
    } catch (error) {
      console.warn('Failed to parse package features string. Falling back to defaults.', error);
      return buildFeatureDefaults();
    }
  }
  return normalizeFeaturePayload(features);
};

export const serializePackageFeatures = (features: PlatformPackageFeatures): Record<string, unknown> => {
  const normalized = normalizePackageFeatures(features);
  const serialized: Record<string, unknown> = { ...normalized };

  if (!Array.isArray(serialized.modules_enabled)) {
    serialized.modules_enabled = [];
  }

  return serialized;
};

const mapAuditLogEntry = (entry: any): PlatformAuditLogEntry => ({
  id: entry.id?.toString?.() ?? 'unknown',
  action: entry.action ?? entry.event ?? 'UNKNOWN',
  entityType: entry.entityType ?? entry.resource ?? 'Unknown',
  entityId: entry.entityId?.toString?.() ?? entry.resourceId?.toString?.(),
  tenantId: entry.school?.tenantId ?? entry.tenantId,
  schoolId: entry.school?.id?.toString?.() ?? entry.schoolId?.toString?.(),
  schoolName: entry.school?.name ?? entry.schoolName,
  actorId: entry.user?.id?.toString?.() ?? entry.actorId?.toString?.(),
  actorName: entry.user?.username ?? entry.actorName ?? entry.userName,
  actorRole: entry.user?.role ?? entry.actorRole,
  metadata: entry.metadata ?? entry.details ?? entry.payload,
  createdAt: normalizeDate(entry.createdAt ?? entry.timestamp),
});

const mapLogTimelineEntry = (entry: any) => ({
  id: entry.id?.toString?.() ?? 'unknown',
  action: entry.action ?? 'UNKNOWN',
  entityType: entry.entityType ?? 'Unknown',
  entityId: entry.entityId?.toString?.(),
  schoolId: entry.schoolId?.toString?.() ?? entry.school?.id?.toString?.(),
  school: entry.school
    ? {
        id: entry.school.id?.toString?.() ?? 'unknown',
        name: entry.school.name ?? 'Unknown',
        code: entry.school.code ?? undefined,
      }
    : null,
  userId: entry.userId?.toString?.() ?? entry.user?.id?.toString?.(),
  user: entry.user
    ? {
        id: entry.user.id?.toString?.() ?? 'unknown',
        username: entry.user.username ?? undefined,
        firstName: entry.user.firstName ?? undefined,
        lastName: entry.user.lastName ?? undefined,
        role: entry.user.role ?? undefined,
      }
    : null,
  requestMethod: entry.requestMethod ?? entry.method ?? null,
  requestPath: entry.requestPath ?? entry.path ?? null,
  requestUrl: entry.requestUrl ?? null,
  requestHeaders: entry.requestHeaders ?? null,
  requestQuery: entry.requestQuery ?? null,
  requestBody: entry.requestBody ?? null,
  responseStatus: entry.responseStatus ?? null,
  responseTimeMs: entry.responseTimeMs ?? null,
  isSuccess: entry.isSuccess ?? null,
  errorMessage: entry.errorMessage ?? null,
  ipAddress: entry.ipAddress ?? null,
  userAgent: entry.userAgent ?? null,
  correlationId: entry.correlationId ?? null,
  traceId: entry.traceId ?? null,
  createdAt: normalizeDate(entry.createdAt) ?? new Date().toISOString(),
});

export const platformService = {
  async getDashboardOverview(): Promise<PlatformDashboardOverview> {
    const response = await secureApiService.get('/platform/dashboard/overview');
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    const totals = data?.totals ?? {};
    const recent = Array.isArray(data?.recentSubscriptions) ? data.recentSubscriptions : [];

    return {
      totals: {
        schools: normalizeNumber(totals.schools),
        activeSchools: normalizeNumber(totals.activeSchools),
        subscriptions: normalizeNumber(totals.subscriptions),
        activeSubscriptions: normalizeNumber(totals.activeSubscriptions),
        revenue: normalizeNumber(totals.revenue),
      },
      recentSubscriptions: recent.map((entry: any) => ({
        id: entry.id?.toString?.() ?? 'unknown',
        status: entry.status ?? 'ACTIVE',
        createdAt: normalizeDate(entry.createdAt),
        school: entry.school
          ? {
              id: entry.school.id?.toString?.() ?? 'unknown',
              name: entry.school.name ?? 'Unnamed School',
              code: entry.school.code ?? undefined,
            }
          : null,
        package: entry.package
          ? {
              id: entry.package.id?.toString?.() ?? 'unknown',
              name: entry.package.name ?? 'Package',
            }
          : null,
      })),
    };
  },

  async getFinancialAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformFinancialAnalytics> {
    const response = await secureApiService.get('/platform/analytics/financial', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    return {
      range: (data.range ?? filters?.range ?? '30d') as PlatformFinancialAnalytics['range'],
      revenue: normalizeNumber(data.revenue),
      outstanding: normalizeNumber(data.outstanding),
      overdue: normalizeNumber(data.overdue),
      revenueTrend: data.revenueTrend ?? {},
      cashFlowTrend: data.cashFlowTrend ?? {},
      paymentMethodBreakdown: data.paymentMethodBreakdown ?? {},
      invoiceAging: data.invoiceAging,
      agingBuckets: data.agingBuckets,
      dso: data.dso ?? null,
      averagePaymentDelay: data.averagePaymentDelay ?? null,
      collectionRate: data.collectionRate ?? null,
      invoicesSummary: data.invoicesSummary,
      topOutstandingSchools: data.topOutstandingSchools,
      recentInvoices: data.recentInvoices,
    };
  },

  async getRevenueAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformRevenueAnalytics> {
    const response = await secureApiService.get('/platform/analytics/revenue', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    const totals = data?.totals ?? {};
    return {
      range: (data.range ?? filters?.range ?? '30d') as PlatformRevenueAnalytics['range'],
      startDate: normalizeDate(data.startDate) ?? new Date().toISOString(),
      endDate: normalizeDate(data.endDate) ?? new Date().toISOString(),
      filters: data.filters ?? filters ?? {},
      totals: {
        revenue: normalizeNumber(totals.revenue),
        mrr: normalizeNumber(totals.mrr),
        arr: normalizeNumber(totals.arr),
        arpu: normalizeNumber(totals.arpu),
        averageTransactionValue: normalizeNumber(totals.averageTransactionValue),
        payingSchools: normalizeNumber(totals.payingSchools),
        transactions: normalizeNumber(totals.transactions),
      },
      trend: data.trend ?? {},
      packageBreakdown: data.packageBreakdown ?? {},
    };
  },

  async getGrowthAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformGrowthAnalytics> {
    const response = await secureApiService.get('/platform/analytics/growth', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    const totals = data?.totals ?? {};
    return {
      range: (data.range ?? filters?.range ?? '30d') as PlatformGrowthAnalytics['range'],
      startDate: normalizeDate(data.startDate) ?? new Date().toISOString(),
      endDate: normalizeDate(data.endDate) ?? new Date().toISOString(),
      filters: data.filters ?? filters ?? {},
      totals: {
        newSchools: normalizeNumber(totals.newSchools),
        churnedSchools: normalizeNumber(totals.churnedSchools),
        netGrowth: normalizeNumber(totals.netGrowth),
        activeSchools: normalizeNumber(totals.activeSchools),
        churnRate: normalizeNumber(totals.churnRate),
        retentionRate: normalizeNumber(totals.retentionRate),
      },
      trends: {
        newSchools: data.trends?.newSchools ?? {},
        churnedSchools: data.trends?.churnedSchools ?? {},
      },
    };
  },

  async getPackagePerformanceAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformPackagePerformanceAnalytics> {
    const response = await secureApiService.get('/platform/analytics/packages', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    const totals = data?.totals ?? {};
    return {
      range: (data.range ?? filters?.range ?? '30d') as PlatformPackagePerformanceAnalytics['range'],
      startDate: normalizeDate(data.startDate) ?? new Date().toISOString(),
      endDate: normalizeDate(data.endDate) ?? new Date().toISOString(),
      filters: data.filters ?? filters ?? {},
      totals: {
        packagesTracked: normalizeNumber(totals.packagesTracked),
        activeSchools: normalizeNumber(totals.activeSchools),
        averageArpu: normalizeNumber(totals.averageArpu),
        upgradeRequests: normalizeNumber(totals.upgradeRequests),
        downgradeRequests: normalizeNumber(totals.downgradeRequests),
      },
      packages: Array.isArray(data.packages)
        ? data.packages.map((pkg: any) => ({
            packageId: pkg.packageId ?? 'unknown',
            packageName: pkg.packageName ?? 'Unassigned',
            revenue: normalizeNumber(pkg.revenue),
            transactions: normalizeNumber(pkg.transactions),
            activeSchools: normalizeNumber(pkg.activeSchools),
            arpu: normalizeNumber(pkg.arpu),
          }))
        : [],
      adoptionTrend: Array.isArray(data.adoptionTrend)
        ? data.adoptionTrend.map((entry: any) => ({
            date: entry.date ?? '',
            packages: entry.packages ?? {},
          }))
        : [],
    };
  },

  async getAttendanceAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformAttendanceAnalytics> {
    const response = await secureApiService.get('/platform/analytics/attendance', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    const totals = data?.totals ?? {};
    return {
      range: (data.range ?? filters?.range ?? '30d') as PlatformAttendanceAnalytics['range'],
      startDate: normalizeDate(data.startDate) ?? new Date().toISOString(),
      endDate: normalizeDate(data.endDate) ?? new Date().toISOString(),
      totals: {
        present: normalizeNumber(totals.present),
        absent: normalizeNumber(totals.absent),
        late: normalizeNumber(totals.late),
        excused: normalizeNumber(totals.excused),
        halfDay: normalizeNumber(totals.halfDay),
        averageAttendance: normalizeNumber(totals.averageAttendance),
        lateRate: normalizeNumber(totals.lateRate),
      },
      dailyTrend: Array.isArray(data.dailyTrend)
        ? data.dailyTrend.map((entry: any) => ({
            date: entry.date ?? '',
            present: normalizeNumber(entry.present),
            absent: normalizeNumber(entry.absent),
            late: normalizeNumber(entry.late),
          }))
        : [],
      classLeaders: Array.isArray(data.classLeaders)
        ? data.classLeaders.map((entry: any) => ({
            classId: entry.classId ?? 'unknown',
            className: entry.className ?? 'Class',
            attendancePercent: normalizeNumber(entry.attendancePercent, 0),
          }))
        : [],
      subjectAlerts: Array.isArray(data.subjectAlerts)
        ? data.subjectAlerts.map((entry: any) => ({
            subjectId: entry.subjectId ?? 'unknown',
            subjectName: entry.subjectName ?? 'Subject',
            absenceCount: normalizeNumber(entry.absenceCount),
          }))
        : [],
    };
  },

  async getBenchmarkingAnalytics(filters?: PlatformAnalyticsFilters): Promise<PlatformBenchmarkingAnalytics> {
    const response = await secureApiService.get('/platform/analytics/benchmarking', {
      params: toRecord(filters),
    });
    return extractData(response);
  },

  async getLogSummaryAnalytics(filters?: PlatformLogAnalyticsFilters): Promise<PlatformLogSummaryAnalytics> {
    const response = await secureApiService.get('/platform/analytics/logs/summary', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload ?? {};

    const mapTopEndpoints = (items: any[]) =>
      Array.isArray(items)
        ? items.map((item) => ({
            path: item.path ?? item.requestPath ?? 'Unknown',
            count: normalizeNumber(item.count ?? item._count?._all),
          }))
        : [];

    const mapTopActors = (items: any[]) =>
      Array.isArray(items)
        ? items.map((item) => ({
            userId: item.userId?.toString?.() ?? item.id?.toString?.() ?? 'unknown',
            count: normalizeNumber(item.count ?? item._count?._all),
            user: item.user
              ? {
                  id: item.user.id?.toString?.() ?? 'unknown',
                  username: item.user.username ?? undefined,
                  firstName: item.user.firstName ?? undefined,
                  lastName: item.user.lastName ?? undefined,
                  role: item.user.role ?? undefined,
                }
              : item.user === null
                ? null
                : undefined,
          }))
        : [];

    return {
      range: (data.range ?? filters?.range ?? '30d') as string,
      startDate: normalizeDate(data.startDate) ?? new Date().toISOString(),
      endDate: normalizeDate(data.endDate) ?? new Date().toISOString(),
      totals: {
        totalEvents: normalizeNumber(data.totals?.totalEvents),
        averageLatencyMs:
          data.totals?.averageLatencyMs === null
            ? null
            : normalizeNumber(data.totals?.averageLatencyMs, null),
        infoEvents: normalizeNumber(data.totals?.infoEvents),
        warningEvents: normalizeNumber(data.totals?.warningEvents),
        errorEvents: normalizeNumber(data.totals?.errorEvents),
      },
      severityCounts: {
        info: normalizeNumber(data.severityCounts?.info),
        warning: normalizeNumber(data.severityCounts?.warning),
        error: normalizeNumber(data.severityCounts?.error),
      },
      topActions: Array.isArray(data.topActions)
        ? data.topActions.map((entry: any) => ({
            action: entry.action ?? 'UNKNOWN',
            count: normalizeNumber(entry.count ?? entry._count?._all),
          }))
        : [],
      topEndpoints: mapTopEndpoints(data.topEndpoints),
      topActors: mapTopActors(data.topActors),
      sparkline: Array.isArray(data.sparkline)
        ? data.sparkline.map((point: any) => ({
            date: normalizeDate(point.date) ?? '',
            total: normalizeNumber(point.total),
            errors: normalizeNumber(point.errors),
            warnings: normalizeNumber(point.warnings),
          }))
        : [],
    };
  },

  async getLogTimeline(filters?: PlatformLogAnalyticsFilters): Promise<PlatformLogTimelineResult> {
    const response = await secureApiService.get('/platform/analytics/logs/timeline', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const rows = Array.isArray(payload.data) ? payload.data : [];

    return {
      range: (payload.range ?? filters?.range ?? '30d') as string,
      startDate: normalizeDate(payload.startDate) ?? new Date().toISOString(),
      endDate: normalizeDate(payload.endDate) ?? new Date().toISOString(),
      data: rows.map(mapLogTimelineEntry),
      total: normalizeNumber(payload.total, rows.length),
      page: normalizeNumber(payload.page, filters?.page ?? 1),
      limit: normalizeNumber(payload.limit, filters?.limit ?? (rows.length || 50)),
      totalPages: normalizeNumber(payload.totalPages, 1),
    };
  },

  async getCustomReportMetadata(): Promise<PlatformCustomReportMetadata> {
    const response = await secureApiService.get('/platform/analytics/custom-reports/metadata');
    return extractData(response);
  },

  async listCustomReports(): Promise<PlatformCustomReport[]> {
    const response = await secureApiService.get('/platform/analytics/custom-reports');
    return extractData(response);
  },

  async createCustomReport(payload: {
    name: string;
    description?: string;
    reportKey: string;
    metrics: string[];
    dimensions: string[];
    filters?: Record<string, unknown>;
    visualization?: Record<string, unknown>;
    isShared?: boolean;
  }): Promise<PlatformCustomReport> {
    const response = await secureApiService.post('/platform/analytics/custom-reports', payload);
    return extractData(response);
  },

  async updateCustomReport(reportId: string | number, payload: Partial<{
    name: string;
    description?: string;
    metrics: string[];
    dimensions: string[];
    filters?: Record<string, unknown>;
    visualization?: Record<string, unknown>;
    isShared?: boolean;
  }>): Promise<PlatformCustomReport> {
    const response = await secureApiService.put(`/platform/analytics/custom-reports/${reportId}`, payload);
    return extractData(response);
  },

  async deleteCustomReport(reportId: string | number) {
    const response = await secureApiService.delete(`/platform/analytics/custom-reports/${reportId}`);
    return extractData(response);
  },

  async runCustomReport(payload: {
    reportId?: string | number;
    configuration?: {
      metrics: string[];
      dimensions: string[];
      filters?: Record<string, unknown>;
    };
  }): Promise<PlatformCustomReportResult> {
    const response = await secureApiService.post('/platform/analytics/custom-reports/run', payload);
    return extractData(response);
  },

  async createReportExport(payload: {
    reportKey: string;
    format?: 'CSV' | 'PDF';
    filters?: Record<string, unknown>;
  }): Promise<ReportExportJob> {
    const response = await secureApiService.post('/platform/analytics/exports', payload);
    return extractData(response);
  },

  async listReportExports(params?: {
    status?: ReportExportJob['status'];
    reportKey?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ReportExportJob>> {
    const response = await secureApiService.get('/platform/analytics/exports', {
      params: toRecord(params),
    });
    const payload = extractData(response) as any;
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const pagination = payload?.pagination ?? {};
    return {
      data,
      total: normalizeNumber(pagination.total, data.length),
      page: normalizeNumber(pagination.page, 1),
      limit: normalizeNumber(pagination.limit, data.length),
      totalPages: normalizeNumber(pagination.pages, 1),
    };
  },

  async createReportSchedule(payload: {
    reportKey: string;
    filters?: Record<string, unknown>;
    format?: 'CSV' | 'PDF';
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    cronExpression?: string;
    recipients: string[];
  }): Promise<ReportSchedule> {
    const response = await secureApiService.post('/platform/analytics/schedules', payload);
    return extractData(response);
  },

  async listReportSchedules(params?: {
    status?: ReportSchedule['status'];
    reportKey?: string;
  }): Promise<ReportSchedule[]> {
    const response = await secureApiService.get('/platform/analytics/schedules', {
      params: toRecord(params),
    });
    return extractData(response);
  },

  async updateReportScheduleStatus(scheduleId: string | number, status: ReportSchedule['status']) {
    const response = await secureApiService.patch(`/platform/analytics/schedules/${scheduleId}/status`, {
      status,
    });
    return extractData(response);
  },

  async getReportsSummary(): Promise<PlatformReportsSummary> {
    const response = await secureApiService.get('/platform/reports/summary');
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    const totals = data?.totals ?? {};
    return {
      totals: {
        students: normalizeNumber(totals.students),
        teachers: normalizeNumber(totals.teachers),
        staff: normalizeNumber(totals.staff),
        parents: normalizeNumber(totals.parents),
        schools: normalizeNumber(totals.schools),
        activeSchools: normalizeNumber(totals.activeSchools),
        revenue: normalizeNumber(totals.revenue),
        transactions: normalizeNumber(totals.transactions),
      },
    };
  },

  async getPackages(): Promise<PlatformPackage[]> {
    const response = await secureApiService.get('/platform/packages');
    const payload = extractData(response) as any;
    const collection = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return collection.map(mapPackage);
  },

  async createPackage(payload: Partial<PlatformPackage> & { features?: Record<string, unknown> }): Promise<PlatformPackage> {
    const response = await secureApiService.post('/platform/packages', payload);
    return mapPackage(extractData(response));
  },

  async updatePackage(packageId: string | number, payload: Partial<PlatformPackage>): Promise<PlatformPackage> {
    const response = await secureApiService.put(`/platform/packages/${packageId}`, payload);
    return mapPackage(extractData(response));
  },

  async togglePackageStatus(packageId: string | number, isActive: boolean): Promise<PlatformPackage> {
    const response = await secureApiService.patch(`/platform/packages/${packageId}/status`, { isActive });
    return mapPackage(extractData(response));
  },

  async getSchools(filters?: PlatformSchoolFilters): Promise<PaginatedResult<PlatformSchoolSummary>> {
    const response = await secureApiService.get('/platform/schools', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const dataArray = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const normalized = dataArray.map(mapSchool);
    return {
      ...withPagination<PlatformSchoolSummary>({ ...payload, data: normalized }),
      data: normalized,
    };
  },

  async createSchool(payload: CreatePlatformSchoolPayload): Promise<PlatformSchoolSummary> {
    const response = await secureApiService.post('/platform/schools', payload);
    return mapSchool(extractData(response));
  },

  async updateSchoolStatus(schoolId: string | number, status: 'ACTIVE' | 'INACTIVE'): Promise<PlatformSchoolSummary> {
    const response = await secureApiService.patch(`/platform/schools/${schoolId}/status`, { status });
    return mapSchool(extractData(response));
  },

  async getSchoolAnalytics(schoolId: string | number): Promise<PlatformSchoolDetail> {
    const response = await secureApiService.get(`/platform/schools/${schoolId}/analytics`);
    const payload = extractData(response) as any;
    return mapSchoolDetail(payload?.data ?? payload);
  },

  async listSubscriptions(filters?: PlatformSubscriptionFilters): Promise<PaginatedResult<PlatformSubscriptionSummary>> {
    const response = await secureApiService.get('/platform/subscriptions', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const dataArray = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const normalized = dataArray.map(mapSubscription);
    return {
      ...withPagination<PlatformSubscriptionSummary>({ ...payload, data: normalized }),
      data: normalized,
    };
  },

  async renewSubscription(subscriptionId: string | number, extensionDays: number): Promise<PlatformSubscriptionSummary> {
    const response = await secureApiService.patch(`/platform/subscriptions/${subscriptionId}/renew`, {
      extensionDays,
    });
    return mapSubscription(extractData(response));
  },

  async changeSubscriptionPackage(subscriptionId: string | number, packageId: string | number, autoRenew?: boolean): Promise<PlatformSubscriptionSummary> {
    const response = await secureApiService.patch(`/platform/subscriptions/${subscriptionId}/change-package`, {
      packageId,
      autoRenew,
    });
    return mapSubscription(extractData(response));
  },

  async cancelSubscription(subscriptionId: string | number, payload?: { effectiveDate?: string; reason?: string }): Promise<PlatformSubscriptionSummary> {
    const response = await secureApiService.patch(`/platform/subscriptions/${subscriptionId}/cancel`, payload);
    return mapSubscription(extractData(response));
  },

  async reactivateSubscription(subscriptionId: string | number, payload?: { startDate?: string; durationDays?: number; autoRenew?: boolean }): Promise<PlatformSubscriptionSummary> {
    const response = await secureApiService.patch(`/platform/subscriptions/${subscriptionId}/reactivate`, payload);
    return mapSubscription(extractData(response));
  },

  async getSchoolComparison(metric?: string, limit?: number, status?: string): Promise<PlatformSchoolComparisonEntry[]> {
    const response = await secureApiService.get('/platform/analytics/schools/comparison', {
      params: toRecord({ metric, limit, status }),
    });
    const payload = extractData(response) as any;
    const dataArray = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return dataArray.map((entry: any, index: number) => ({
      schoolId: entry.schoolId?.toString?.() ?? 'unknown',
      schoolName: entry.schoolName ?? entry.name ?? `School ${index + 1}`,
      metric: entry.metric ?? metric ?? 'students',
      value: normalizeNumber(entry.value),
      rank: normalizeNumber(entry.rank ?? index + 1),
    }));
  },

  async getChurnAnalytics(range?: PlatformChurnAnalytics['range']): Promise<PlatformChurnAnalytics> {
    const response = await secureApiService.get('/platform/analytics/churn', {
      params: range ? { range } : undefined,
    });
    const payload = extractData(response) as any;
    const data = payload?.data ?? payload;
    return {
      range: (data.range ?? range ?? '30d') as PlatformChurnAnalytics['range'],
      churnRate: normalizeNumber(data.churnRate),
      cancellations: normalizeNumber(data.cancellations),
      reactivations: normalizeNumber(data.reactivations),
      netChange: normalizeNumber(data.netChange),
      trend: Array.isArray(data.trend)
        ? data.trend.map((entry: any) => ({
            label: entry.label ?? '',
            value: normalizeNumber(entry.value),
          }))
        : [],
    };
  },

  async getAuditLogs(filters?: PlatformAuditLogFilters): Promise<PaginatedResult<PlatformAuditLogEntry>> {
    const response = await secureApiService.get('/platform/audit-logs', {
      params: toRecord(filters),
    });
    const payload = extractData(response) as any;
    const collection = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return withPagination<PlatformAuditLogEntry>({ ...payload, data: collection.map(mapAuditLogEntry) });
  },
};

export default platformService;
