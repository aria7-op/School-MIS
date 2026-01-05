import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StudentAnalytics, DashboardFilters } from "../types";
import studentService from "../services/studentService";
import {
  FaUsers,
  FaGraduationCap,
  FaChartLine,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaDownload,
  FaFilter,
  FaSync,
  FaCog,
  FaBell,
  FaSearch,
  FaChartBar,
  FaChartPie,
  FaTable,
  FaList,
  FaTh,
  FaPlus,
  FaFileExport,
  FaCog as FaSettings,
  FaChartArea,
  FaAward,
  FaBookOpen,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSchool,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ReferenceLine,
} from "recharts";

interface DashboardTabProps {
  analytics: StudentAnalytics | null;
  loading: boolean;
  error: string | null;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  analytics,
  loading,
  error,
  filters,
  onFiltersChange,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();
  const iconGap = { marginInlineEnd: "0.5rem" } as React.CSSProperties;
  const a = analytics as any;
  // Zero-data mode: when a scoped selection (school/branch/course) has no students, avoid mock fallbacks
  const isScoped = Boolean(
    (filters as any)?.schoolId ||
      (filters as any)?.branchId ||
      (filters as any)?.courseId
  );
  const zeroDataMode = isScoped && (analytics?.totalStudents ?? 0) === 0;

  // Get filter context display
  const getFilterContextDisplay = () => {
    const parts: string[] = [];
    if ((filters as any)?.schoolId)
      parts.push(`School: ${(filters as any).schoolId}`);
    if ((filters as any)?.branchId)
      parts.push(`Branch: ${(filters as any).branchId}`);
    if ((filters as any)?.courseId)
      parts.push(`Course: ${(filters as any).courseId}`);
    return parts.length > 0 ? parts.join(" • ") : "All Schools";
  };
  // State for enhanced dashboard features
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState(["all"]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedClasses, setSelectedClasses] = useState(["all"]);
  const [selectedGrades, setSelectedGrades] = useState(["all"]);
  const [chartType, setChartType] = useState<"line" | "bar" | "pie" | "area">(
    "line"
  );
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30D");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  // Handle period change
  const handlePeriodChange = (period: string) => {
    const newFilters = { ...filters, period: period as any };
    onFiltersChange(newFilters);
  };

  // Handle date range change
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
    const newFilters = {
      ...filters,
      dateRange: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
    };
    onFiltersChange(newFilters);
  };

  // Handle sync student status
  const handleSyncStatus = async () => {
    if (
      !confirm(
        "This will update the status of all students based on their class assignment. Students with a class will be marked ACTIVE, and students without a class will be marked INACTIVE. Continue?"
      )
    ) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await studentService.syncStudentStatus();
      if (result.success) {
        const { activated, deactivated, unchanged } = result.data;
        alert(
          `Status sync completed!\n\nActivated: ${activated}\nDeactivated: ${deactivated}\nUnchanged: ${unchanged}\n\nTotal students processed: ${
            activated + deactivated + unchanged
          }`
        );
        onRefresh(); // Refresh the dashboard data
      } else {
        alert("Failed to sync student status");
      }
    } catch (error) {
      console.error("Error syncing status:", error);
      alert("Error syncing student status. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language || "en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Dynamic data generation based on analytics
  const generateChartData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();

    return months.map((month, index) => {
      // Use analytics data if available; when scoped and empty, avoid mock fallbacks
      const baseStudents = zeroDataMode ? 0 : analytics?.totalStudents ?? 0;
      const baseAttendance = zeroDataMode ? 0 : a?.attendanceRate ?? 0;
      const baseGrades = zeroDataMode ? 0 : a?.averageGrade ?? 0;

      // Create realistic trends with some variation
      const monthFactor = index <= currentMonth ? 1 : 0.8; // Past months have full data
      const trendFactor = 1 + Math.sin(index * 0.5) * 0.1; // Seasonal variation

      return {
        month,
        students: Math.floor(
          baseStudents * monthFactor * trendFactor * (0.8 + Math.random() * 0.4)
        ),
        attendance: Math.floor(
          baseAttendance *
            monthFactor *
            trendFactor *
            (0.9 + Math.random() * 0.2)
        ),
        grades: Math.floor(
          baseGrades * monthFactor * trendFactor * (0.9 + Math.random() * 0.2)
        ),
        performance: Math.floor(
          baseGrades *
            0.8 *
            monthFactor *
            trendFactor *
            (0.8 + Math.random() * 0.4)
        ),
        revenue: Math.floor(
          baseStudents *
            200 *
            monthFactor *
            trendFactor *
            (0.7 + Math.random() * 0.6)
        ),
      };
    });
  };

  const generateGradeDistribution = () => {
    // Use analytics grade distribution if available, otherwise generate based on performance
    if (!zeroDataMode && a?.gradeDistribution) {
      return Object.entries(a.gradeDistribution).map(
        ([grade, count], index) => ({
          name: grade,
          value: count as number,
          color:
            [
              "#10B981",
              "#34D399",
              "#FBBF24",
              "#F59E0B",
              "#EF4444",
              "#DC2626",
              "#991B1B",
            ][index] || "#6B7280",
        })
      );
    }

    // Generate realistic distribution based on average grade
    const avgGrade = zeroDataMode ? 0 : a?.averageGrade ?? 0;
    const totalStudents = zeroDataMode ? 0 : analytics?.totalStudents ?? 0;

    // Calculate distribution based on performance level
    const highPerformerRatio = avgGrade > 85 ? 0.4 : avgGrade > 75 ? 0.3 : 0.2;
    const mediumPerformerRatio = avgGrade > 75 ? 0.35 : 0.4;
    const lowPerformerRatio = 1 - highPerformerRatio - mediumPerformerRatio;

    return [
      {
        name: "A+",
        value: Math.floor(totalStudents * highPerformerRatio * 0.3),
        color: "#10B981",
      },
      {
        name: "A",
        value: Math.floor(totalStudents * highPerformerRatio * 0.4),
        color: "#34D399",
      },
      {
        name: "B+",
        value: Math.floor(totalStudents * highPerformerRatio * 0.3),
        color: "#FBBF24",
      },
      {
        name: "B",
        value: Math.floor(totalStudents * mediumPerformerRatio * 0.5),
        color: "#F59E0B",
      },
      {
        name: "C+",
        value: Math.floor(totalStudents * mediumPerformerRatio * 0.3),
        color: "#EF4444",
      },
      {
        name: "C",
        value: Math.floor(totalStudents * lowPerformerRatio * 0.6),
        color: "#DC2626",
      },
      {
        name: "D",
        value: Math.floor(totalStudents * lowPerformerRatio * 0.4),
        color: "#991B1B",
      },
    ].filter((item) => item.value > 0);
  };

  const generateClassPerformance = () => {
    // Use analytics class performance if available
    if (!zeroDataMode && a?.classPerformance) {
      return Object.entries(a.classPerformance).map(
        ([className, performance]) => ({
          class: className,
          students: (performance as any).studentCount || 25,
          avgGrade: (performance as any).averageGrade || 85,
          attendance: (performance as any).attendance || 90,
        })
      );
    }

    // Generate dynamic class performance based on analytics
    const baseAttendance = a?.attendanceRate || 94.2;
    const baseGrade = a?.averageGrade || 87.3;
    const totalStudents = analytics?.totalStudents || 245;

    const grades = [
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
    ];
    const studentsPerGrade = Math.floor(totalStudents / grades.length);

    return grades.map((grade, index) => {
      // Create variation between grades
      const gradeVariation = 0.8 + Math.random() * 0.4;
      const attendanceVariation = 0.9 + Math.random() * 0.2;

      return {
        class: grade,
        students: Math.floor(studentsPerGrade * gradeVariation),
        avgGrade: Math.floor(baseGrade * gradeVariation),
        attendance: Math.floor(baseAttendance * attendanceVariation),
      };
    });
  };

  const generateSubjectPerformance = () => {
    const baseGrade = a?.averageGrade || 87.3;
    const totalStudents = analytics?.totalStudents || 245;

    const subjects = [
      { name: "Mathematics", difficulty: 0.9 },
      { name: "English", difficulty: 0.8 },
      { name: "Science", difficulty: 0.85 },
      { name: "History", difficulty: 0.75 },
      { name: "Geography", difficulty: 0.8 },
      { name: "Art", difficulty: 0.7 },
    ];

    return subjects.map((subject) => {
      const score = Math.floor(
        baseGrade * subject.difficulty * (0.9 + Math.random() * 0.2)
      );
      return {
        subject: subject.name,
        score: Math.min(100, Math.max(0, score)),
        students: totalStudents,
      };
    });
  };

  const generateAttendanceTrend = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const baseAttendance = a?.attendanceRate || 94.2;
    const totalStudents = analytics?.totalStudents || 245;

    return days.map((day, index) => {
      // Weekend attendance is typically lower
      const weekendFactor = day === "Sat" || day === "Sun" ? 0.7 : 1;

      // Create realistic daily variation
      const dailyVariation = 0.9 + Math.random() * 0.2;
      const present = Math.floor(
        totalStudents * (baseAttendance / 100) * weekendFactor * dailyVariation
      );
      const absent = Math.floor(totalStudents * 0.05 * (1 + Math.random()));
      const late = Math.floor(totalStudents * 0.03 * (1 + Math.random()));

      return {
        day,
        present: Math.min(totalStudents, present),
        absent: Math.min(totalStudents - present, absent),
        late: Math.min(totalStudents - present - absent, late),
      };
    });
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (isLiveMode) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
        onRefresh(); // Refresh analytics data
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isLiveMode, onRefresh]);

  // Generate dynamic data
  const chartData = generateChartData();
  const gradeDistribution = generateGradeDistribution();
  const classPerformance = generateClassPerformance();
  const subjectPerformance = generateSubjectPerformance();
  const attendanceTrend = generateAttendanceTrend();

  // Enhanced metric card with modern design
  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle: string,
    icon: React.ReactNode,
    color: string,
    trend?: number,
    bgGradient?: string
  ) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 ${
        bgGradient || ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-sm`}
              style={iconGap}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
          {trend !== undefined && (
            <div
              className={`flex items-center text-sm font-medium ${
                trend >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend >= 0 ? (
                <FaArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <FaArrowDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trend)}% {t("students.dashboard.labels.fromLastPeriod")}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render chart card
  const renderChartCard = (title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          {isLiveMode && (
            <div className="flex items-center space-x-1 text-green-600 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          )}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <FaEye className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <FaDownload className="w-4 h-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );

  // Render class performance bar
  const renderClassPerformanceBar = (
    className: string,
    percentage: number,
    studentCount: number,
    maxPercentage: number
  ) => {
    const width = (percentage / maxPercentage) * 100;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{className}</span>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              {percentage}%
            </div>
            <div className="text-xs text-gray-500">{studentCount} students</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${width}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("students.dashboard.loading.title")}
          </h3>
          <p className="text-gray-600">
            {t("students.dashboard.loading.subtitle")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUserTimes className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("students.dashboard.error.title")}
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <FaSync className="w-4 h-4" />
            <span>{t("students.dashboard.buttons.retry")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto scroll-smooth">
      {/* Controls row under global header */}
      <div className="px-4 sm:px-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          {/* Sync Student Status Button */}
          <button
            onClick={handleSyncStatus}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm font-medium"
            title="Sync student status based on class assignment"
          >
            <FaUserCheck
              className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span className="whitespace-nowrap">
              {isSyncing
                ? t("students.dashboard.syncing")
                : t("students.dashboard.sync")}
            </span>
          </button>

          {/* Period Filter */}
          <div className="flex items-center bg-white rounded-lg px-4 py-2.5 border border-gray-300 text-gray-700 hover:border-gray-400 transition-colors shadow-sm">
            <FaCalendarAlt className="w-4 h-4 text-gray-600 mr-2 shrink-0" />
            <select
              value={filters.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="text-sm focus:outline-none bg-transparent w-full sm:w-auto cursor-pointer"
            >
              <option value="7D">
                {t("students.dashboard.filters.last7")}
              </option>
              <option value="30D">
                {t("students.dashboard.filters.last30")}
              </option>
              <option value="90D">
                {t("students.dashboard.filters.last90")}
              </option>
              <option value="1Y">
                {t("students.dashboard.filters.lastYear")}
              </option>
            </select>
          </div>

          {/* Live Mode Toggle */}
          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 border transition-all shadow-sm text-sm font-medium ${
              isLiveMode
                ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveMode ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <span className="whitespace-nowrap">
              {isLiveMode
                ? t("students.dashboard.buttons.liveOn")
                : t("students.dashboard.buttons.liveOff")}
            </span>
          </button>

          {/* Refresh Button */}
          {/* <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
          >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="whitespace-nowrap">
          {t('students.dashboard.buttons.refresh')}
          </span>
          </button> */}
        </div>
      </div>

      {/* Filter Context Display */}
      {isScoped && (
        <div className="px-4 sm:px-8 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <FaFilter className="w-4 h-4 text-blue-600" />
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                Showing data for:
              </span>
              <div className="flex flex-wrap gap-2">
                {(filters as any)?.schoolId && (
                  <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-medium">
                    School ID: {(filters as any).schoolId}
                  </span>
                )}
                {(filters as any)?.branchId && (
                  <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-medium">
                    Branch ID: {(filters as any).branchId}
                  </span>
                )}
                {(filters as any)?.courseId && (
                  <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-medium">
                    Course ID: {(filters as any).courseId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="p-2 sm:p-8 space-y-2 sm:space-y-8 max-h-screen overflow-y-auto">
        {/* Zero Data State for Scoped Filters */}
        {zeroDataMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFilter className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              No Data Available
            </h3>
            <p className="text-yellow-800 mb-4">
              The selected {(filters as any)?.schoolId ? "school" : ""}
              {(filters as any)?.branchId ? ", branch" : ""}
              {(filters as any)?.courseId ? ", or course" : ""} does not have
              any students yet.
            </p>
            <p className="text-sm text-yellow-700">
              Please select different filters or add students to continue.
            </p>
          </div>
        )}

        {/* Enhanced Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
          {renderMetricCard(
            t("students.dashboard.metrics.totalStudents.title"),
            analytics?.totalStudents || 0,
            isScoped
              ? `${t(
                  "students.dashboard.metrics.totalStudents.subtitle"
                )} (Filtered)`
              : t("students.dashboard.metrics.totalStudents.subtitle"),
            <FaUsers className="w-6 h-6 text-blue-600" />,
            "bg-blue-100",
            null,
            null
          )}
          {renderMetricCard(
            t("students.dashboard.metrics.avgGrade.title"),
            a?.averageGrade !== undefined && a?.averageGrade !== null
              ? `${(a.averageGrade as number).toFixed(1)}`
              : "0",
            t("students.dashboard.metrics.avgGrade.subtitle"),
            <FaGraduationCap className="w-6 h-6 text-green-600" />,
            "bg-green-100",
            null,
            null
          )}
          {renderMetricCard(
            t("students.dashboard.metrics.attendanceRate.title"),
            a?.attendanceRate !== undefined && a?.attendanceRate !== null
              ? `${(a.attendanceRate as number).toFixed(1)}%`
              : "0%",
            t("students.dashboard.metrics.attendanceRate.subtitle"),
            <FaUserCheck className="w-6 h-6 text-orange-600" />,
            "bg-orange-100",
            null,
            null
          )}
          {renderMetricCard(
            t("students.dashboard.metrics.completionRate.title"),
            a?.conversionRate !== undefined && a?.conversionRate !== null
              ? `${(a.conversionRate as number).toFixed(1)}%`
              : "0%",
            t("students.dashboard.metrics.completionRate.subtitle"),
            <FaChartLine className="w-6 h-6 text-purple-600" />,
            "bg-purple-100",
            null,
            null
          )}
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
          {renderMetricCard(
            t("students.dashboard.metrics.topPerformers.title"),
            a?.convertedStudents !== undefined
              ? String(a.convertedStudents)
              : "0",
            t("students.dashboard.metrics.topPerformers.subtitle"),
            <FaAward className="w-6 h-6 text-yellow-600" />,
            "bg-yellow-100",
            null,
            null
          )}
          {renderMetricCard(
            t("students.dashboard.metrics.activeClasses.title"),
            a?.classCount !== undefined ? String(a.classCount) : "0",
            t("students.dashboard.metrics.activeClasses.subtitle"),
            <FaSchool className="w-6 h-6 text-indigo-600" />,
            "bg-indigo-100",
            null,
            null
          )}
          {renderMetricCard(
            t("students.dashboard.metrics.teachers.title"),
            a?.teacherCount !== undefined ? String(a.teacherCount) : "0",
            t("students.dashboard.metrics.teachers.subtitle"),
            <FaChalkboardTeacher className="w-6 h-6 text-pink-600" />,
            "bg-pink-100",
            null,
            null
          )}
          {renderMetricCard(
            t("students.dashboard.metrics.subjects.title"),
            a?.subjectCount !== undefined ? String(a.subjectCount) : "0",
            t("students.dashboard.metrics.subjects.subtitle"),
            <FaBookOpen className="w-6 h-6 text-teal-600" />,
            "bg-teal-100",
            null,
            null
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hidden sm:hidden">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200">
              <FaPlus className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Add Student
              </span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-200">
              <FaFileExport className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Export Data
              </span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-200">
              <FaFilter className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Advanced Filters
              </span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors duration-200">
              <FaSettings className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                Settings
              </span>
            </button>
          </div>
        </div>

        {/* Comprehensive Charts Section */}
        <div className="space-y-2 sm:space-y-8">
          {/* Row 1: Performance Trends & Class Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Performance Over Time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 p-2 sm:p-0">
                  {t("students.dashboard.trends.performance")}
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1 text-gray-600"
                  >
                    <option value="line">
                      {t("students.dashboard.charts.line")}
                    </option>
                    <option value="area">
                      {t("students.dashboard.charts.area")}
                    </option>
                    <option value="bar">
                      {t("students.dashboard.charts.bar")}
                    </option>
                  </select>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="students"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        name={t("students.dashboard.legend.students")}
                      />
                      <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke="#10B981"
                        strokeWidth={3}
                        name={t("students.dashboard.legend.attendance")}
                      />
                      <Line
                        type="monotone"
                        dataKey="grades"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        name={t("students.dashboard.legend.avgGrades")}
                      />
                    </LineChart>
                  ) : chartType === "area" ? (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="students"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                        name={t("students.dashboard.legend.students")}
                      />
                      <Area
                        type="monotone"
                        dataKey="attendance"
                        stackId="2"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                        name={t("students.dashboard.legend.attendance")}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="students"
                        fill="#3B82F6"
                        name={t("students.dashboard.legend.students")}
                      />
                      <Bar
                        dataKey="attendance"
                        fill="#10B981"
                        name={t("students.dashboard.legend.attendance")}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Class Performance Comparison */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 p-2 sm:p-0">
                  {t("students.dashboard.trends.classPerformance")}
                </h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <FaChartBar className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={classPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="class" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="avgGrade"
                      fill="#3B82F6"
                      name={t("students.dashboard.legend.avgGrade")}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="attendance"
                      stroke="#10B981"
                      strokeWidth={3}
                      name={t("students.dashboard.legend.attendance")}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      y={85}
                      stroke="#EF4444"
                      strokeDasharray="5 5"
                      label={t("students.dashboard.labels.target")}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Attendance Analysis */}
          <div className="grid grid-cols-1 gap-8">
            {/* Weekly Attendance Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 sm:p-0 p-2">
                  {t("students.dashboard.trends.weeklyAttendance")}
                </h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <FaCalendarAlt className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name={t("students.dashboard.legend.present")}
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stackId="2"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                      name={t("students.dashboard.legend.absent")}
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      stackId="3"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                      name={t("students.dashboard.legend.late")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
