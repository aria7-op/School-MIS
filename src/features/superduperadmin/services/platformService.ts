import secureApiService, { ApiResponse } from '../../../services/secureApiService';
import {
  CreatePlatformSchoolPayload,
  PaginatedResult,
  PlatformChurnAnalytics,
  PlatformDashboardOverview,
  PlatformFinancialAnalytics,
  PlatformPackage,
  PlatformQueryFilters,
  PlatformReportsSummary,
  PlatformSchoolComparisonEntry,
  PlatformSchoolDetail,
  PlatformSchoolFilters,
  PlatformSchoolSummary,
  PlatformSubscriptionFilters,
  PlatformSubscriptionSummary,
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
  features: typeof pkg.features === 'object' && pkg.features !== null ? pkg.features : {},
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

export const platformService = {
  async getDashboardOverview(): Promise<PlatformDashboardOverview> {
    const response = await secureApiService.get('/platform/dashboard/overview');
    const payload = extractData(response);
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

  async getFinancialAnalytics(range?: PlatformFinancialAnalytics['range']): Promise<PlatformFinancialAnalytics> {
    const response = await secureApiService.get('/platform/financial/analytics', {
      params: range ? { range } : undefined,
    });
    const payload = extractData(response);
    const data = payload?.data ?? payload;
    return {
      range: (data.range ?? range ?? '30d') as PlatformFinancialAnalytics['range'],
      revenue: normalizeNumber(data.revenue),
      outstanding: normalizeNumber(data.outstanding),
      revenueTrend: data.revenueTrend ?? {},
      monthlyRevenue: data.monthlyRevenue ?? {},
      uniquePayingSchools: normalizeNumber(data.uniquePayingSchools),
      mrr: normalizeNumber(data.mrr),
      arr: normalizeNumber(data.arr),
      averageRevenuePerSchool: normalizeNumber(data.averageRevenuePerSchool),
      averageTransactionValue: normalizeNumber(data.averageTransactionValue),
    };
  },

  async getReportsSummary(): Promise<PlatformReportsSummary> {
    const response = await secureApiService.get('/platform/reports/summary');
    const payload = extractData(response);
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
    const payload = extractData(response);
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
    const payload = extractData(response);
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
    const payload = extractData(response);
    return mapSchoolDetail(payload?.data ?? payload);
  },

  async listSubscriptions(filters?: PlatformSubscriptionFilters): Promise<PaginatedResult<PlatformSubscriptionSummary>> {
    const response = await secureApiService.get('/platform/subscriptions', {
      params: toRecord(filters),
    });
    const payload = extractData(response);
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

  async getChurnAnalytics(range?: PlatformChurnAnalytics['range']): Promise<PlatformChurnAnalytics> {
    const response = await secureApiService.get('/platform/analytics/churn', {
      params: range ? { range } : undefined,
    });
    const payload = extractData(response);
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

  async getSchoolComparison(metric?: string, limit?: number, status?: string): Promise<PlatformSchoolComparisonEntry[]> {
    const response = await secureApiService.get('/platform/analytics/schools/comparison', {
      params: toRecord({ metric, limit, status }),
    });
    const payload = extractData(response);
    const dataArray = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return dataArray.map((entry: any, index: number) => ({
      schoolId: entry.schoolId?.toString?.() ?? 'unknown',
      schoolName: entry.schoolName ?? entry.name ?? `School ${index + 1}`,
      metric: entry.metric ?? metric ?? 'students',
      value: normalizeNumber(entry.value),
      rank: normalizeNumber(entry.rank ?? index + 1),
    }));
  },
};

export default platformService;

