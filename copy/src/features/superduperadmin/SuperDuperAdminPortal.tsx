import React from "react";
import clsx from "clsx";
import {
  DashboardOverview,
  SchoolsManagement,
  PackagesManagement,
  SubscriptionsBilling,
  UsersAdministration,
  ReportsAnalytics,
  SettingsScreen,
  ActivityLogs,
} from "./screens";
import { useSuperAdmin } from "../../contexts/SuperAdminContext";
import SchoolSwitcher from "./components/TenantSwitcher";
import { EmptyState } from "./components/infrastructure";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuth } from "../../contexts/AuthContext";
import { FiLogOut } from "react-icons/fi";
import {
  HomeIcon,
  BuildingOffice2Icon,
  CubeIcon,
  CreditCardIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type PortalView =
  | "dashboard"
  | "schools"
  | "packages"
  | "subscriptions"
  | "users"
  | "reports"
  | "settings"
  | "activity";

const NAV_ITEMS: Array<{
  id: PortalView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}> = [
  { id: "dashboard", label: "Overview", icon: HomeIcon },
  { id: "schools", label: "Schools", icon: BuildingOffice2Icon },
  { id: "packages", label: "Packages", icon: CubeIcon },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCardIcon },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "reports", label: "Reports", icon: ChartBarIcon },
  { id: "settings", label: "Settings", icon: Cog6ToothIcon },
  { id: "activity", label: "Activity logs", icon: DocumentTextIcon },
];

const renderView = (view: PortalView) => {
  switch (view) {
    case "dashboard":
      return <DashboardOverview />;
    case "schools":
      return <SchoolsManagement />;
    case "packages":
      return <PackagesManagement />;
    case "subscriptions":
      return <SubscriptionsBilling />;
    case "users":
      return <UsersAdministration />;
    case "reports":
      return <ReportsAnalytics />;
    case "settings":
      return <SettingsScreen />;
    case "activity":
      return <ActivityLogs />;
    default:
      return null;
  }
};

export const SuperDuperAdminPortal: React.FC = () => {
  const {
    isSuperDuperAdmin,
    schools,
    schoolsQuery,
    currentSchoolId,
    selectSchool,
  } = useSuperAdmin();
  const { logout } = useAuth();
  const [view, setView] = React.useState<PortalView>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!isSuperDuperAdmin) {
      setView("dashboard");
    }
  }, [isSuperDuperAdmin]);

  if (!isSuperDuperAdmin) {
    return (
      <div className="p-8">
        <EmptyState
          title="Restricted area"
          description="Only SUPER_DUPER_ADMIN users can view the platform control portal."
        />
      </div>
    );
  }

  const asideClassName = clsx(
    "relative lg:sticky lg:top-[88px] flex h-full flex-col rounded-2xl border transition-all duration-300",
    sidebarCollapsed ? "lg:w-20 p-2" : "lg:w-72 p-4",
    "border-slate-200 bg-white text-slate-700"
  );

  return (
    <div
      className="superduperadmin-portal min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200"
    >
      <header
        className="sticky top-0 z-40 border-b transition-colors border-slate-200 bg-white/90 backdrop-blur"
      >
        <div className="flex w-full flex-col gap-4 px-4 py-3 sm:gap-2 sm:px-6 sm:py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold sm:text-2xl text-slate-900">
              Super Duper Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Operate the entire SaaS platform, manage schools, and view
              real-time analytics.
            </p>
          </div>
          <div className="flex flex-row gap-2 sm:flex-row sm:items-center">
            <div className="">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-6 lg:h-[calc(100vh-72px)] lg:overflow-hidden">
        <div className="flex flex-col gap-6 lg:h-full lg:flex-row">
          <aside className={asideClassName}>
            {/* Collapse Button - Top Right when expanded */}
            {!sidebarCollapsed && (
              <div className="hidden lg:flex items-center justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  title="Collapse sidebar"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* School Switcher - Hidden when collapsed */}
            {!sidebarCollapsed && (
              <SchoolSwitcher
                schools={schools}
                currentSchoolId={currentSchoolId}
                onSchoolChange={selectSchool}
                isLoading={schoolsQuery.isLoading}
                className="rounded-2xl px-4 py-5"
              />
            )}

            <nav
              className={clsx(
                "flex-1 space-y-1.5 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto",
                sidebarCollapsed ? "mt-2" : "mt-6"
              )}
            >
              {/* Collapse Button - First item when collapsed */}
              {sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 px-2 py-3 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  title="Expand sidebar"
                >
                  <ChevronRightIcon className="h-5 w-5 flex-shrink-0" />
                </button>
              )}
              {NAV_ITEMS.map((item) => {
                const isActive = view === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={clsx(
                      "flex w-full items-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      sidebarCollapsed
                        ? "justify-center px-2 py-3"
                        : "justify-start gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={clsx(
                        "flex-shrink-0",
                        sidebarCollapsed ? "h-5 w-5" : "h-5 w-5"
                      )}
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                           <span
                             className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", isActive ? "bg-indigo-500/30 text-white" : "bg-indigo-500/10 text-indigo-600")}
                           >
                             {item.badge}
                           </span>
                         )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={logout}
              className={clsx(
                "mt-4 inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                sidebarCollapsed ? "px-2 py-3" : "px-3 py-2.5",
                "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300"
              )}
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <FiLogOut className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </aside>

          <main className="flex-1 lg:h-full lg:overflow-y-auto lg:pl-2">
            {renderView(view)}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SuperDuperAdminPortal;
