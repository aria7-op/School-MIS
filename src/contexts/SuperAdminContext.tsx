import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import platformService from '../features/superduperadmin/services/platformService';
import { platformQueryKeys } from '../features/superduperadmin/hooks/platformQueryKeys';
import {
  PaginatedResult,
  PlatformDashboardOverview,
  PlatformFinancialAnalytics,
  PlatformPackage,
  PlatformReportsSummary,
  PlatformSchoolDetail,
  PlatformSchoolSummary,
  PlatformSubscriptionSummary,
} from '../features/superduperadmin/types';

type SchoolsResult = PaginatedResult<PlatformSchoolSummary>;
type SubscriptionsResult = PaginatedResult<PlatformSubscriptionSummary>;

export interface SuperAdminContextValue {
  isSuperDuperAdmin: boolean;
  packages: PlatformPackage[];
  packagesQuery: UseQueryResult<PlatformPackage[], unknown>;
  schools: PlatformSchoolSummary[];
  schoolsQuery: UseQueryResult<SchoolsResult, unknown>;
  currentSchoolId: string | null;
  selectSchool: (schoolId: string | null) => void;
  currentSchoolAnalytics: PlatformSchoolDetail | null;
  schoolAnalyticsQuery: UseQueryResult<PlatformSchoolDetail, unknown>;
  subscriptions: PlatformSubscriptionSummary[];
  subscriptionsQuery: UseQueryResult<SubscriptionsResult, unknown>;
  dashboardOverview: PlatformDashboardOverview | null;
  dashboardQuery: UseQueryResult<PlatformDashboardOverview, unknown>;
  financialAnalytics: PlatformFinancialAnalytics | null;
  financialAnalyticsQuery: UseQueryResult<PlatformFinancialAnalytics, unknown>;
  reportsSummary: PlatformReportsSummary | null;
  reportsSummaryQuery: UseQueryResult<PlatformReportsSummary, unknown>;
  refreshPlatform: () => Promise<void>;
  isPlatformBootstrapped: boolean;
}

const SuperAdminContext = createContext<SuperAdminContextValue | undefined>(undefined);

const normalizeRole = (role?: string | null): string | undefined => {
  if (!role) return undefined;
  return role.replace(/\s+/g, '_').replace(/-/g, '_').toUpperCase();
};

export const SuperAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const normalizedRole = normalizeRole(user?.role);
  const isSuperDuperAdmin = normalizedRole === 'SUPER_DUPER_ADMIN';

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const packagesQuery = useQuery({
    queryKey: platformQueryKeys.packages(),
    queryFn: platformService.getPackages,
    enabled: isSuperDuperAdmin,
    staleTime: 10 * 60 * 1000,
  });

  const packages = packagesQuery.data ?? [];

  const dashboardQuery = useQuery({
    queryKey: platformQueryKeys.dashboard(),
    queryFn: platformService.getDashboardOverview,
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const financialAnalyticsQuery = useQuery({
    queryKey: platformQueryKeys.financialAnalytics(),
    queryFn: () => platformService.getFinancialAnalytics('30d'),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const reportsSummaryQuery = useQuery({
    queryKey: platformQueryKeys.reportsSummary(),
    queryFn: platformService.getReportsSummary,
    enabled: isSuperDuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const schoolsQuery = useQuery({
    queryKey: platformQueryKeys.schools(),
    queryFn: () =>
      platformService.getSchools({
        limit: 50,
        page: 1,
      }),
    enabled: isSuperDuperAdmin,
  });

  const schools = schoolsQuery.data?.data ?? [];

  useEffect(() => {
    if (!isSuperDuperAdmin) {
      setSelectedSchoolId(null);
      return;
    }
    if (!selectedSchoolId && schools.length > 0) {
      setSelectedSchoolId(schools[0].id);
    }
  }, [isSuperDuperAdmin, schools, selectedSchoolId]);

  const schoolAnalyticsQuery = useQuery({
    queryKey: selectedSchoolId
      ? platformQueryKeys.schoolDetail(selectedSchoolId)
      : platformQueryKeys.schoolDetail('unknown'),
    queryFn: () => platformService.getSchoolAnalytics(selectedSchoolId as string),
    enabled: isSuperDuperAdmin && Boolean(selectedSchoolId),
    staleTime: 30 * 1000,
  });

  const subscriptionsQuery = useQuery({
    queryKey: selectedSchoolId
      ? platformQueryKeys.subscriptions({ schoolId: selectedSchoolId })
      : platformQueryKeys.subscriptions(),
    queryFn: () =>
      platformService.listSubscriptions({
        schoolId: selectedSchoolId ?? undefined,
        limit: 50,
        page: 1,
      }),
    enabled: isSuperDuperAdmin,
  });

  const selectSchool = useCallback(
    (schoolId: string | null) => {
      setSelectedSchoolId(schoolId);
      if (!schoolId) return;
      queryClient.prefetchQuery({
        queryKey: platformQueryKeys.schoolDetail(schoolId),
        queryFn: () => platformService.getSchoolAnalytics(schoolId),
      });
      queryClient.prefetchQuery({
        queryKey: platformQueryKeys.subscriptions({ schoolId }),
        queryFn: () =>
          platformService.listSubscriptions({
            schoolId,
            limit: 50,
            page: 1,
          }),
      });
    },
    [queryClient],
  );

  const refreshPlatform = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.dashboard() }),
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.financialAnalytics() }),
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.reportsSummary() }),
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.packages() }),
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.schools() }),
      selectedSchoolId
        ? queryClient.invalidateQueries({
            queryKey: platformQueryKeys.schoolDetail(selectedSchoolId),
          })
        : Promise.resolve(),
      selectedSchoolId
        ? queryClient.invalidateQueries({
            queryKey: platformQueryKeys.subscriptions({ schoolId: selectedSchoolId }),
          })
        : Promise.resolve(),
    ]);
  }, [queryClient, selectedSchoolId]);

  const contextValue: SuperAdminContextValue = useMemo(
    () => ({
      isSuperDuperAdmin,
      packages,
      packagesQuery,
      schools,
      schoolsQuery,
      currentSchoolId: selectedSchoolId,
      selectSchool,
      currentSchoolAnalytics: schoolAnalyticsQuery.data ?? null,
      schoolAnalyticsQuery,
      subscriptions: subscriptionsQuery.data?.data ?? [],
      subscriptionsQuery,
      dashboardOverview: dashboardQuery.data ?? null,
      dashboardQuery,
      financialAnalytics: financialAnalyticsQuery.data ?? null,
      financialAnalyticsQuery,
      reportsSummary: reportsSummaryQuery.data ?? null,
      reportsSummaryQuery,
      refreshPlatform,
      isPlatformBootstrapped:
        isSuperDuperAdmin &&
        Boolean(packagesQuery.data) &&
        Boolean(schoolsQuery.data) &&
        Boolean(dashboardQuery.data),
    }),
    [
      dashboardQuery,
      financialAnalyticsQuery,
      isSuperDuperAdmin,
      packages,
      packagesQuery,
      refreshPlatform,
      reportsSummaryQuery,
      schoolAnalyticsQuery,
      schools,
      schoolsQuery,
      selectSchool,
      selectedSchoolId,
      subscriptionsQuery,
    ],
  );

  return (
    <SuperAdminContext.Provider value={contextValue}>{children}</SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = (): SuperAdminContextValue => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

export default SuperAdminContext;

