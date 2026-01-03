export const platformQueryKeys = {
  all: () => ['platform'] as const,
  dashboard: () => ['platform', 'dashboard', 'overview'] as const,
  financialAnalytics: (filters?: unknown) =>
    filters ? (['platform', 'financial', filters] as const) : (['platform', 'financial'] as const),
  reportsSummary: () => ['platform', 'reports', 'summary'] as const,
  packages: () => ['platform', 'packages'] as const,
  packageDetail: (packageId: string | number) => ['platform', 'packages', packageId] as const,
  schools: (filters?: unknown) =>
    filters ? (['platform', 'schools', filters] as const) : (['platform', 'schools'] as const),
  schoolDetail: (schoolId: string | number) =>
    ['platform', 'schools', schoolId, 'detail'] as const,
  subscriptions: (filters?: unknown) =>
    filters
      ? (['platform', 'subscriptions', filters] as const)
      : (['platform', 'subscriptions'] as const),
  churnAnalytics: (range: string = '30d') => ['platform', 'analytics', 'churn', range] as const,
  revenueAnalytics: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'revenue', filters] as const)
      : (['platform', 'analytics', 'revenue'] as const),
  growthAnalytics: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'growth', filters] as const)
      : (['platform', 'analytics', 'growth'] as const),
  packageAnalytics: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'packages', filters] as const)
      : (['platform', 'analytics', 'packages'] as const),
  attendanceAnalytics: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'attendance', filters] as const)
      : (['platform', 'analytics', 'attendance'] as const),
  benchmarkingAnalytics: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'benchmarking', filters] as const)
      : (['platform', 'analytics', 'benchmarking'] as const),
  logSummaryAnalytics: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'logs', 'summary', filters] as const)
      : (['platform', 'analytics', 'logs', 'summary'] as const),
  logTimeline: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'logs', 'timeline', filters] as const)
      : (['platform', 'analytics', 'logs', 'timeline'] as const),
  customReportMetadata: () => ['platform', 'analytics', 'custom-reports', 'metadata'] as const,
  customReports: () => ['platform', 'analytics', 'custom-reports', 'list'] as const,
  schoolComparison: (filters?: unknown) =>
    filters
      ? (['platform', 'analytics', 'schools', 'comparison', filters] as const)
      : (['platform', 'analytics', 'schools', 'comparison'] as const),
  auditLogs: (filters?: unknown) =>
    filters ? (['platform', 'audit', filters] as const) : (['platform', 'audit'] as const),
} as const;

export type PlatformQueryKey = ReturnType<(typeof platformQueryKeys)[keyof typeof platformQueryKeys]>;

