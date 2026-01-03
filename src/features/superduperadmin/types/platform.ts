export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlatformPackage {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  features: Record<string, unknown>;
  supportLevel?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface PlatformFinancialAnalytics {
  range: '7d' | '30d' | '90d' | '1y';
  revenue: number;
  outstanding: number;
  revenueTrend: Record<string, number>;
  monthlyRevenue: Record<string, number>;
  uniquePayingSchools: number;
  mrr: number;
  arr: number;
  averageRevenuePerSchool: number;
  averageTransactionValue: number;
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

