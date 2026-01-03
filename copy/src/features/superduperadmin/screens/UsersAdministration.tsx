import React from "react";
import { AdvancedDataTable, QuickActions } from "../components";
import { useSuperAdmin } from "../../../contexts/SuperAdminContext";
import { useToast } from "../../../contexts/ToastContext";
import { useThemeContext } from "../../../contexts/ThemeContext";

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
  const toast = useToast();
  const { mode } = useThemeContext();

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
            </p>
          </div>
          <QuickActions
            actions={[
              {
                id: "refresh",
                label: "Refresh",
                onClick: refreshPlatform,
              },
            ]}
          />
        </div>
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
        isLoading={schoolsQuery.isLoading}
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
