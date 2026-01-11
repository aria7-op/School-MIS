import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AdvancedDataTable, QuickActions, StatCard } from "../components";
import { useSuperAdmin } from "../../../contexts/SuperAdminContext";
import { useToast } from "../../../contexts/ToastContext";
import { useThemeContext } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import superadminService from "../../superadmin/services/superadminService";

interface PlatformUserView {
  id: string;
  displayName: string;
  email?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
}

export const UsersAdministration: React.FC = () => {
  const { schools, schoolsQuery, refreshPlatform } = useSuperAdmin();
  const { managedContext } = useAuth();
  const toast = useToast();
  const { mode } = useThemeContext();

  // Generate date range for the last 30 days
  const dateRange = React.useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, []);

  // Fetch dashboard overview data with filters
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['superadmin-dashboard-overview', managedContext.schoolId, managedContext.courseId, dateRange],
    queryFn: async () => {
      const params: Record<string, any> = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      // Add schoolId if selected (from branch/school selector)
      if (managedContext.schoolId) {
        params.schoolId = managedContext.schoolId;
      }

      // Add courseId if selected (from course selector)
      if (managedContext.courseId) {
        params.courseId = managedContext.courseId;
      }

      return await superadminService.getOverviewDashboard(params);
    },
    enabled: true,
    staleTime: 30000, // 30 seconds
  });

  const users: PlatformUserView[] = React.useMemo(
    () =>
      schools.map((school) => ({
        id: `${school.id}-owner`,
        displayName: school.ownerName ?? "School owner",
        email: school.metadata?.ownerEmail as string | undefined,
        role: "SUPER_ADMIN",
        status: school.status,
        lastLoginAt: undefined,
      })),
    [schools]
  );

  // Get total students and teachers counts from fetched dashboard data
  const totalStudents = React.useMemo(() => {
    return dashboardData?.students ?? 0;
  }, [dashboardData]);

  const totalTeachers = React.useMemo(() => {
    return dashboardData?.teachers ?? 0;
  }, [dashboardData]);

  // Combined loading state
  const isLoading = schoolsQuery.isLoading || isDashboardLoading;

  // Enhanced refresh function
  const handleRefresh = async () => {
    await Promise.all([
      refreshPlatform(),
      refetchDashboard(),
    ]);
  };

  return (
    <div className="space-y-6">
      <div
        className={
          mode === "dark"
            ? "rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
            : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={
                mode === "dark"
                  ? "text-lg font-semibold text-slate-100"
                  : "text-lg font-semibold text-slate-900"
              }
            >
              Platform users
            </h1>
            <p
              className={
                mode === "dark"
                  ? "text-sm text-slate-400"
                  : "text-sm text-slate-500"
              }
            >
              Includes school owners and platform operators.
              {(managedContext.schoolId || managedContext.courseId) && (
                <span className="ml-2 text-xs font-medium">
                  {managedContext.schoolId && (
                    <span className={mode === "dark" ? "text-blue-400" : "text-blue-600"}>
                      (Filtered by {managedContext.courseId ? "course" : "school"})
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <QuickActions
            actions={[
              {
                id: "refresh",
                label: "Refresh",
                onClick: handleRefresh,
              },
            ]}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={managedContext.schoolId || managedContext.courseId ? "Filtered Schools" : "Total Schools"}
          value={isLoading ? "..." : schools.length}
          icon={<span className="text-2xl">🏫</span>}
        />
        <StatCard
          title={managedContext.schoolId || managedContext.courseId ? "Filtered Students" : "Total Students"}
          value={isLoading ? "..." : totalStudents}
          icon={<span className="text-2xl">👨‍🎓</span>}
        />
        <StatCard
          title={managedContext.schoolId || managedContext.courseId ? "Filtered Teachers" : "Total Teachers"}
          value={isLoading ? "..." : totalTeachers}
          icon={<span className="text-2xl">👨‍🏫</span>}
        />
        <StatCard
          title="Platform Users"
          value={isLoading ? "..." : users.length}
          icon={<span className="text-2xl">👥</span>}
        />
      </div>

      <AdvancedDataTable<PlatformUserView>
        data={users}
        columns={[
          {
            key: "displayName",
            header: "User",
            accessor: (row) => (
              <div>
                <div
                  className={
                    mode === "dark"
                      ? "font-medium text-slate-100"
                      : "font-medium text-slate-900"
                  }
                >
                  {row.displayName}
                </div>
                <div
                  className={
                    mode === "dark"
                      ? "text-xs text-slate-400"
                      : "text-xs text-slate-500"
                  }
                >
                  {row.email ?? "—"}
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            accessor: (row) => (
              <span
                className={
                  mode === "dark"
                    ? "rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase text-slate-300"
                    : "rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-600"
                }
              >
                {row.role}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            accessor: (row) => (
              <span
                className={`rounded-full px-2 py-0.5 text-xs uppercase ${
                  row.status === "ACTIVE"
                    ? mode === "dark"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-emerald-500/10 text-emerald-600"
                    : mode === "dark"
                    ? "bg-amber-500/10 text-amber-300"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {row.status}
              </span>
            ),
            align: "center",
          },
          {
            key: "lastLoginAt",
            header: "Last login",
            accessor: (row) =>
              row.lastLoginAt
                ? new Date(row.lastLoginAt).toLocaleString()
                : "—",
          },
        ]}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        actions={
          <QuickActions
            actions={[
              {
                id: "reset-password",
                label: "Reset password",
                onClick: () =>
                  toast.info("Password reset", "Flow coming soon."),
              },
            ]}
          />
        }
        emptyState={{
          title: "No users found",
          description: "Provision a school to register its owner.",
        }}
      />
    </div>
  );
};

export default UsersAdministration;
