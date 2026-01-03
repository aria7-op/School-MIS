export const platformQueryKeys = {
  all: ['platform'] as const,
  tenants: (filters?: unknown) =>
    filters ? (['platform', 'tenants', filters] as const) : (['platform', 'tenants'] as const),
  tenantDetail: (tenantId: string) =>
    (['platform', 'tenants', tenantId, 'detail'] as const),
  tenantUsage: (tenantId: string) =>
    (['platform', 'tenants', tenantId, 'usage'] as const),
  tenantLimits: (tenantId: string) =>
    (['platform', 'tenants', tenantId, 'limits'] as const),
  packages: () => (['platform', 'packages'] as const),
  packageDetail: (packageId: string) =>
    (['platform', 'packages', packageId] as const),
  subscriptionLedger: (tenantId: string, filters?: unknown) =>
    filters
      ? (['platform', 'tenants', tenantId, 'ledger', filters] as const)
      : (['platform', 'tenants', tenantId, 'ledger'] as const),
  schools: (filters?: unknown) =>
    filters ? (['platform', 'schools', filters] as const) : (['platform', 'schools'] as const),
  platformUsers: (filters?: unknown) =>
    filters ? (['platform', 'users', filters] as const) : (['platform', 'users'] as const),
  events: (filters?: unknown) =>
    filters ? (['platform', 'events', filters] as const) : (['platform', 'events'] as const),
} as const;

export type PlatformQueryKey = ReturnType<(typeof platformQueryKeys)[keyof typeof platformQueryKeys]>;

