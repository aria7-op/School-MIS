import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FaSchool,
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaDollarSign,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaSitemap,
} from "react-icons/fa";
import superadminService from "../services/superadminService";
import FinancialAnalyticsDashboard from "../components/FinancialAnalyticsDashboard";
import AcademicAnalyticsDashboard from "../components/AcademicAnalyticsDashboard";
import UserAnalyticsDashboard from "../components/UserAnalyticsDashboard";
import SchoolComparisonDashboard from "../components/SchoolComparisonDashboard";
import SystemHealthDashboard from "../components/SystemHealthDashboard";
import ScheduleManagement from "../components/ScheduleManagement";
import SchoolsDetailView from "../components/details/SchoolsDetailView";
import StudentsDetailView from "../components/details/StudentsDetailView";
import TeachersDetailView from "../components/details/TeachersDetailView";
import ProfitDetailView from "../components/details/ProfitDetailView";
import RevenueDetailView from "../components/details/RevenueDetailView";
import ExpensesDetailView from "../components/details/ExpensesDetailView";
import EnrollmentManager from "../../../components/EnrollmentManager";
import HistoricalDataViewer from "../../../components/HistoricalDataViewer";
import SchoolStructureManager from "../components/SchoolStructureManager";
import ManagedEntitiesTab from "../../../components/ManagedEntitiesTab";

export type DashboardTab =
  | "overview"
  | "financial"
  | "academic"
  | "users"
  | "schools"
  | "structure"
  | "system"
  | "schedule"
  | "reports"
  | "bulk-promotions"
  | "historical-data";
type DetailView =
  | "schools"
  | "students"
  | "teachers"
  | "profit"
  | "revenue"
  | "expenses"
  | null;

interface SuperadminDashboardProps {
  initialTab?: DashboardTab;
  showTabs?: boolean;
}

const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({
  initialTab = "overview",
  showTabs = true,
}) => {
  const { t, i18n } = useTranslation();
  const { user, managedContext } = useAuth();
  const managedEntitiesDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [activeDetailView, setActiveDetailView] = useState<DetailView>(null);
  const selectedSchoolId: string | null = managedContext?.schoolId ?? null;
  const selectedBranchId: string | null = managedContext?.branchId ?? null;
  const [managedEntitiesDropdownOpen, setManagedEntitiesDropdownOpen] = useState(false);
  const [isRTL, setIsRTL] = useState(document.documentElement.dir === "rtl");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  // Get schools from managedEntities (same as admin_user)
  const allSchools = Array.isArray(user?.managedEntities?.schools)
    ? user.managedEntities.schools
    : [];

  // Get branches for selected school from managedEntities (optional usage)
  const filteredBranches = selectedSchoolId
    ? (Array.isArray(user?.managedEntities?.branches)
        ? user.managedEntities.branches.filter(
            (b: any) => String(b.branch?.schoolId || b.school?.id || b.schoolId) === String(selectedSchoolId)
          )
        : [])
    : [];

  // Listen for language changes to update RTL state
  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(document.documentElement.dir === "rtl");
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        managedEntitiesDropdownRef.current &&
        !managedEntitiesDropdownRef.current.contains(event.target as Node)
      ) {
        setManagedEntitiesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch overview data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["superadmin-overview", dateRange, selectedSchoolId, selectedBranchId, managedContext?.courseId],
    queryFn: () => superadminService.getOverviewDashboard({
      ...dateRange,
      schoolId: selectedSchoolId || undefined,
      branchId: selectedBranchId || undefined,
      courseId: managedContext?.courseId || undefined,
    }),
  });

  // Fetch real-time metrics
  const { data: realTimeData } = useQuery({
    queryKey: ["real-time-metrics"],
    queryFn: superadminService.getRealTimeMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ["system-health"],
    queryFn: superadminService.getSystemHealth,
    refetchInterval: 60000, // Refetch every minute
  });

  const toNumber = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === "number") return Number.isFinite(val) ? val : 0;
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (amount: number) => {
    const n = toNumber(amount);
    // AFN style formatting used across finance sections
    return `AFN ${Math.round(n).toLocaleString("en-US")}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const renderOverviewTab = () => {
    if (overviewLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Handle both response formats
    const rawData = overviewData?.data || overviewData;
    const rawOverview = rawData?.overview || rawData || {};
    
    // Extract teachers count - try overview first, then byRole array
    let teachersCount = toNumber(rawOverview?.teachers ?? rawOverview?.totalTeachers);
    if (!teachersCount && rawData?.byRole && Array.isArray(rawData.byRole)) {
      const teacherRole = rawData.byRole.find((role: any) => role.role === 'TEACHER');
      teachersCount = toNumber(teacherRole?.count);
    }
    
    console.log('Debug - rawData:', rawData);
    console.log('Debug - rawOverview:', rawOverview);
    console.log('Debug - teachersCount:', teachersCount);
    
    const overview = {
      schools: toNumber(rawOverview?.schools ?? rawOverview?.totalSchools),
      students: toNumber(rawOverview?.students ?? rawOverview?.totalStudents),
      teachers: teachersCount,
      staff: toNumber(
        rawOverview?.staff ??
          rawOverview?.staffMembers ??
          rawOverview?.totalStaff
      ),
      totalRevenue: toNumber(rawOverview?.totalRevenue ?? rawOverview?.revenue),
      totalExpenses: toNumber(
        rawOverview?.totalExpenses ?? rawOverview?.expenses
      ),
      netProfit: toNumber(
        rawOverview?.netProfit ??
          toNumber(rawOverview?.totalRevenue) -
            toNumber(rawOverview?.totalExpenses)
      ),
      profitMargin: (() => {
        const pm = toNumber(rawOverview?.profitMargin);
        if (pm > 0 && pm <= 1) return Math.round(pm * 100);
        if (pm > 1) return Math.round(pm);
        const rev = toNumber(rawOverview?.totalRevenue);
        const exp = toNumber(rawOverview?.totalExpenses);
        if (rev > 0) return Math.round(((rev - exp) / rev) * 100);
        return 0;
      })(),
      activeUsers: toNumber(rawOverview?.activeUsers),
    };
    const recentActivity = (rawData?.recentActivity ||
      rawData?.activity ||
      []) as any[];

    const getActivityAmount = (a: any) =>
      toNumber(a?.amount ?? a?.total ?? a?.value);
    const getActivityDate = (a: any) => {
      const d = a?.date || a?.createdAt || a?.timestamp;
      const dt = d ? new Date(d) : null;
      return dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString() : "—";
    };
    const getActivityStudent = (a: any) =>
      a?.student || a?.studentName || a?.user || "—";
    const getActivitySchool = (a: any) => a?.school || a?.schoolName || "";

    return (
      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
          {/* Total Schools */}
          <div
            onClick={() => setActiveDetailView("schools")}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.totalSchools", "Total Schools")}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview?.schools || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaSchool className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 gap-1">
              <FaCheckCircle className="w-4 h-4" />
              <span>
                {t(
                  "superadmin.overview.activeOperational",
                  "Active & Operational"
                )}
              </span>
            </div>
          </div>

          {/* Total Students */}
          <div
            onClick={() => setActiveDetailView("students")}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.totalStudents", "Total Students")}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview?.students || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUserGraduate className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 gap-1">
              {/* <FaClock className="w-4 h-4" />
              <span>
                {t("superadmin.overview.activeUsers", {
                  count: formatNumber(overview?.activeUsers || 0),
                }) || `${formatNumber(overview?.activeUsers || 0)} active`}
              </span> */}
            </div>
          </div>

          {/* Total Teachers */}
          <div
            onClick={() => setActiveDetailView("teachers")}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.totalTeachers", "Total Teachers")}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatNumber(overview?.teachers || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChalkboardTeacher className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 gap-1">
              <FaUsers className="w-4 h-4" />
              {/* <span>
                {t("superadmin.overview.staffMembers", {
                  count: formatNumber(overview?.staff || 0),
                }) || `${formatNumber(overview?.staff || 0)} staff members`}
              </span> */}
            </div>
          </div>

          {/* Financial Summary */}
          <div
            onClick={() => setActiveDetailView("profit")}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.netProfit", "Net Profit")}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    overview?.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(overview?.netProfit || 0)}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  overview?.netProfit >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <FaDollarSign
                  className={`w-6 h-6 ${
                    overview?.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600 gap-1">
              <FaChartLine className="w-4 h-4" />
              {/* <span>
                {t("superadmin.overview.margin", {
                  percent: overview?.profitMargin || 0,
                }) || `${overview?.profitMargin || 0}% margin`}
              </span> */}
            </div>
          </div>
        </div>

        {/* Revenue & Expenses Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-6">
          <div
            onClick={() => setActiveDetailView("revenue")}
            className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("superadmin.overview.totalRevenue", "Total Revenue")}
              </h3>
              <FaDollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-green-600">
              {formatCurrency(overview?.totalRevenue || 0)}
            </p>
            {/* <p className="text-sm text-gray-600 mt-2">
              {t(
                "superadmin.overview.fromAllSchools",
                "From all schools combined"
              )}
            </p> */}
          </div>

          <div
            onClick={() => setActiveDetailView("expenses")}
            className=" from-orange-50 to-red-50 rounded-lg shadow-sm border border-orange-200 p-6 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("superadmin.overview.totalExpenses", "Total Expenses")}
              </h3>
              <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-orange-600">
              {formatCurrency(overview?.totalExpenses || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {t(
                "superadmin.overview.operationalPayroll",
                "Operational & payroll costs"
              )}
            </p>
          </div>
        </div>

        {/* System Status & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2  gap-1 sm:gap-6">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("superadmin.overview.systemHealth", "System Health")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.status", "Status")}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealth?.data?.status === "healthy"
                      ? "bg-green-100 text-green-700"
                      : systemHealth?.data?.status === "warning"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {systemHealth?.data?.status ||
                    t("superadmin.overview.unknown", "Unknown")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.activeUsersLabel", "Active Users")}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(realTimeData?.data?.metrics?.activeUsers || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.systemLoad", "System Load")}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {realTimeData?.data?.metrics?.systemLoad || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {t("superadmin.overview.uptime", "Uptime")}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.floor((systemHealth?.data?.uptime || 0) / 3600)}h
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("superadmin.overview.recentActivity", "Recent Activity")}
            </h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t(
                    "superadmin.overview.noRecentActivity",
                    "No recent activity"
                  )}
                </p>
              ) : (
                recentActivity
                  .slice(0, 5)
                  .map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getActivityStudent(activity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getActivitySchool(activity)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(getActivityAmount(activity))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getActivityDate(activity)}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {t("superadmin.header.title", "Superadmin Portal")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {t(
                  "superadmin.header.subtitle",
                  "Comprehensive system analytics and reporting"
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
               <div className="flex items-center gap-2">
                 <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                   {t("superadmin.header.from", "From:")}
                 </label>
                 <input
                   type="date"
                   value={dateRange.startDate}
                   onChange={(e) =>
                     setDateRange({ ...dateRange, startDate: e.target.value })
                   }
                   className="flex-1 sm:flex-initial px-3 py-2 border text-gray-600 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>
               <div className="flex items-center gap-2">
                 <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                   {t("superadmin.header.to", "To:")}
                 </label>
                 <input
                   type="date"
                   value={dateRange.endDate}
                   onChange={(e) =>
                     setDateRange({ ...dateRange, endDate: e.target.value })
                   }
                   className="flex-1 sm:flex-initial px-3 py-2 border text-gray-600 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>
             </div>
          </div>

          {/* Tabs */}
          {showTabs && (
            <div className="flex items-center gap-1 mt-6 overflow-x-auto">
              {[
                {
                  id: "overview",
                  label: t("superadmin.tabs.overview", "Overview"),
                  icon: FaChartLine,
                },
                {
                  id: "financial",
                  label: t("superadmin.tabs.financial", "Financial"),
                  icon: FaDollarSign,
                },
                {
                  id: "academic",
                  label: t("superadmin.tabs.academic", "Academic"),
                  icon: FaUserGraduate,
                },
                {
                  id: "users",
                  label: t("superadmin.tabs.users", "Users"),
                  icon: FaUsers,
                },
                {
                  id: "schools",
                  label: t("superadmin.tabs.schools", "Schools"),
                  icon: FaSchool,
                },
                {
                  id: "structure",
                  label: t("superadmin.tabs.structure", "Structure"),
                  icon: FaSitemap,
                },
                {
                  id: "schedule",
                  label: t("superadmin.tabs.schedule", "Schedule"),
                  icon: FaClock,
                },
                {
                  id: "system",
                  label: t("superadmin.tabs.system", "System"),
                  icon: FaCheckCircle,
                },
                {
                  id: "bulk-promotions",
                  label: t("superadmin.tabs.bulkPromotions", "Bulk Promotions"),
                  icon: FaUsers,
                },
                {
                  id: "historical-data",
                  label: t("superadmin.tabs.historicalData", "Historical Data"),
                  icon: FaChartLine,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-1 sm:p-6 mt-1">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "financial" && (
          <FinancialAnalyticsDashboard 
            dateRange={dateRange} 
            selectedSchoolId={selectedSchoolId}
            selectedBranchId={selectedBranchId}
            selectedCourseId={managedContext?.courseId ?? null}
            onProfitClick={() => setActiveDetailView("profit")}
          />
        )}
        {activeTab === "academic" && (
          <AcademicAnalyticsDashboard 
            dateRange={dateRange}
            selectedSchoolId={selectedSchoolId}
            selectedBranchId={selectedBranchId}
          />
        )}
        {activeTab === "users" && (
          <UserAnalyticsDashboard 
            dateRange={dateRange}
            selectedSchoolId={selectedSchoolId}
            selectedBranchId={selectedBranchId}
            selectedCourseId={managedContext?.courseId ?? null}
          />
        )}
        {activeTab === "schools" && (
          <SchoolComparisonDashboard dateRange={dateRange} />
        )}
        {activeTab === "structure" && <SchoolStructureManager />}
        {activeTab === "schedule" && <ScheduleManagement />}
        {activeTab === "system" && <SystemHealthDashboard />}
        {activeTab === "bulk-promotions" && <EnrollmentManager />}
        {activeTab === "historical-data" && <HistoricalDataViewer />}
      </div>

      {/* Detail Views Modals */}
      {activeDetailView === "schools" && (
        <SchoolsDetailView
          dateRange={dateRange}
          selectedSchoolId={selectedSchoolId}
          selectedBranchId={selectedBranchId}
          selectedCourseId={managedContext?.courseId ?? null}
          onClose={() => setActiveDetailView(null)}
        />
      )}
      {activeDetailView === "students" && (
        <StudentsDetailView
          dateRange={dateRange}
          selectedSchoolId={selectedSchoolId}
          selectedBranchId={selectedBranchId}
          selectedCourseId={managedContext?.courseId ?? null}
          onClose={() => setActiveDetailView(null)}
        />
      )}
      {activeDetailView === "teachers" && (
        <TeachersDetailView
          dateRange={dateRange}
          selectedSchoolId={selectedSchoolId}
          selectedBranchId={selectedBranchId}
          selectedCourseId={managedContext?.courseId ?? null}
          onClose={() => setActiveDetailView(null)}
        />
      )}
      {activeDetailView === "profit" && (
        <ProfitDetailView
          dateRange={dateRange}
          selectedSchoolId={selectedSchoolId}
          selectedBranchId={selectedBranchId}
          selectedCourseId={managedContext?.courseId ?? null}
          onClose={() => setActiveDetailView(null)}
        />
      )}
      {activeDetailView === "revenue" && (
        <RevenueDetailView
          dateRange={dateRange}
          selectedSchoolId={selectedSchoolId}
          selectedBranchId={selectedBranchId}
          selectedCourseId={managedContext?.courseId ?? null}
          onClose={() => setActiveDetailView(null)}
        />
      )}
      {activeDetailView === "expenses" && (
        <ExpensesDetailView
          dateRange={dateRange}
          selectedSchoolId={selectedSchoolId}
          selectedBranchId={selectedBranchId}
          selectedCourseId={managedContext?.courseId ?? null}
          onClose={() => setActiveDetailView(null)}
        />
      )}
    </div>
  );
};

export default SuperadminDashboard;
