import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  AdvancedDataTable,
  AdvancedFilters,
  ChartContainer,
  QuickActions,
} from "../components";
import { useSuperAdmin } from "../../../contexts/SuperAdminContext";
import { useThemeContext } from "../../../contexts/ThemeContext";
import platformService from "../services/platformService";
import { platformQueryKeys } from "../hooks/platformQueryKeys";
import {
  PlatformAnalyticsFilters,
  PlatformAttendanceAnalytics,
  PlatformBenchmarkingAnalytics,
  PlatformCustomReport,
  PlatformCustomReportMetadata,
  PlatformCustomReportResult,
  PlatformFinancialAnalytics,
  PlatformGrowthAnalytics,
  PlatformPackagePerformanceAnalytics,
  PlatformRevenueAnalytics,
  PlatformLogSummaryAnalytics,
  PlatformLogTimelineResult,
  PlatformLogTimelineEntry,
} from "../types";

interface ReportRow {
  id: string;
  name: string;
  description: string;
  lastRun: string;
  type: string;
}

const BASE_REPORTS: Omit<ReportRow, "lastRun">[] = [
  {
    id: "revenue",
    name: "Revenue overview",
    description: "MRR, ARR, ARPU, and package-level revenue trends.",
    type: "Revenue",
  },
  {
    id: "growth",
    name: "Growth overview",
    description: "New schools, churn, retention, and net growth.",
    type: "Growth",
  },
  {
    id: "packages",
    name: "Package performance",
    description: "ARPU by package, adoption trend, upgrade/downgrade flow.",
    type: "Packages",
  },
  {
    id: "attendance",
    name: "Attendance quality",
    description: "Average attendance, late arrivals, and subject/class insights.",
    type: "Attendance",
  },
  {
    id: "comparison",
    name: "School comparison",
    description: "Benchmark schools by enrollment, staff, and revenue.",
    type: "Benchmark",
  },
];

const SECTION_TABS = [
  { id: "revenue", label: "Revenue" },
  { id: "growth", label: "Growth" },
  { id: "packages", label: "Packages" },
  { id: "attendance", label: "Attendance" },
  { id: "finance", label: "Finance" },
  { id: "catalog", label: "Report Catalog" },
  { id: "custom", label: "Custom Builder" },
  { id: "benchmarking", label: "Benchmarking" },
  { id: "logs", label: "Log Intelligence (Sprint 6)" },
] as const;

type AnalyticsFilterState = {
  range: string;
  dateFrom: string;
  dateTo: string;
  schoolId: string;
  packageId: string;
  lifecycle: string;
  country: string;
  state: string;
  city: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const percentageFormatter = (value: number) =>
  `${decimalFormatter.format(value * 100)}%`;

const ChartEmptyState: React.FC<{ message?: string }> = ({ message }) => {
  const { mode } = useThemeContext();
  return (
    <div className={clsx("flex h-64 items-center justify-center rounded-lg border border-dashed text-sm", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500')}>
      {message ?? "No data available for the selected filters."}
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  subLabel?: string;
}> = ({ label, value, subLabel }) => {
  const { mode } = useThemeContext();
  return (
    <div className={clsx("rounded-xl border p-4 shadow-sm", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
      <p className={clsx("text-xs uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
        {label}
      </p>
      <p className={clsx("mt-2 text-2xl font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
        {value}
      </p>
      {subLabel && (
        <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{subLabel}</p>
      )}
    </div>
  );
};

const toTrendSeries = (input?: Record<string, number>) =>
  Object.entries(input ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));

const buildGrowthTrendSeries = (
  growth?: PlatformGrowthAnalytics["trends"]
) => {
  if (!growth) return [];
  const newTrend = growth.newSchools ?? {};
  const churnTrend = growth.churnedSchools ?? {};
  const allDates = Array.from(
    new Set([
      ...Object.keys(newTrend ?? {}),
      ...Object.keys(churnTrend ?? {}),
    ])
  ).sort();

  return allDates.map((date) => ({
    date,
    newSchools: newTrend[date] ?? 0,
    churnedSchools: churnTrend[date] ?? 0,
  }));
};

const buildPackageBreakdown = (data?: Record<string, number>) =>
  Object.entries(data ?? {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

const coerceMetricNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const buildFinanceTrendSeries = (
  collected?: Record<string, number>,
  invoiced?: Record<string, number>
) => {
  const collectedEntries = collected ?? {};
  const invoicedEntries = invoiced ?? {};
  const allDates = Array.from(
    new Set([
      ...Object.keys(collectedEntries),
      ...Object.keys(invoicedEntries),
    ])
  ).sort();
  return allDates.map((date) => ({
    date,
    collected: coerceMetricNumber(collectedEntries[date]),
    invoiced: coerceMetricNumber(invoicedEntries[date]),
  }));
};

const DEFAULT_AGING_BUCKETS = {
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90Plus: 0,
  unknown: 0,
};

const FINANCE_AGING_LABELS: Record<
  keyof typeof DEFAULT_AGING_BUCKETS,
  { label: string; description: string }
> = {
  current: { label: "Current", description: "Not yet due" },
  days1to30: { label: "1 – 30 days", description: "Slightly overdue invoices" },
  days31to60: { label: "31 – 60 days", description: "Requires follow-up" },
  days61to90: { label: "61 – 90 days", description: "High-risk outstanding" },
  days90Plus: { label: "90+ days", description: "Critical follow-up required" },
  unknown: { label: "Uncategorized", description: "Missing due dates" },
};

const formatDays = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return `${decimalFormatter.format(value)} days`;
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const getInvoiceStatusBadge = (status?: string, mode?: 'light' | 'dark') => {
  const normalized = (status ?? "unknown").toUpperCase();
  const isDark = mode === 'dark';
  
  if (normalized === "PAID") {
    return {
      label: "Paid",
      className: isDark
        ? "bg-emerald-900/40 text-emerald-300 border border-emerald-300/20"
        : "bg-emerald-50 text-emerald-700 border border-emerald-100",
    };
  }
  if (normalized === "OVERDUE") {
    return {
      label: "Overdue",
      className: isDark
        ? "bg-rose-900/40 text-rose-300 border border-rose-300/20"
        : "bg-rose-50 text-rose-700 border border-rose-100",
    };
  }
  if (normalized === "PARTIALLY_PAID") {
    return {
      label: "Partially paid",
      className: isDark
        ? "bg-amber-900/30 text-amber-200 border border-amber-200/20"
        : "bg-amber-50 text-amber-700 border border-amber-100",
    };
  }
  if (normalized === "UNPAID") {
    return {
      label: "Unpaid",
      className: isDark
        ? "bg-slate-800 text-slate-200 border border-slate-700"
        : "bg-slate-100 text-slate-700 border border-slate-200",
    };
  }
  return {
    label: normalized.replace(/_/g, " "),
    className: isDark
      ? "bg-slate-800 text-slate-300 border border-slate-700"
      : "bg-slate-100 text-slate-600 border border-slate-200",
  };
};

type LogSeverityFilter = "ALL" | "INFO" | "WARNING" | "ERROR";

const LOG_SEVERITY_OPTIONS: Array<{ id: LogSeverityFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "INFO", label: "Info" },
  { id: "WARNING", label: "Warning" },
  { id: "ERROR", label: "Error" },
];

const LOG_SEVERITY_STYLES: Record<Exclude<LogSeverityFilter, "ALL">, string> = {
  INFO: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  WARNING: "bg-amber-50 text-amber-700 border border-amber-100",
  ERROR: "bg-rose-50 text-rose-700 border border-rose-100",
};

const resolveLogSeverity = (status?: number | null, isSuccess?: boolean | null): Exclude<LogSeverityFilter, "ALL"> => {
  if (typeof status === "number") {
    if (status >= 500) return "ERROR";
    if (status >= 400) return "WARNING";
  }
  if (isSuccess === false) {
    return "ERROR";
  }
  return "INFO";
};

const formatLatency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
};

const formatUserDisplay = (user?: { username?: string; firstName?: string; lastName?: string } | null) => {
  if (!user) return "System";
  if (user.username) return user.username;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || "User";
};

const formatJsonBlock = (value?: Record<string, unknown> | null) => {
  if (!value || Object.keys(value).length === 0) {
    return "{ }";
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

export const ReportsAnalytics: React.FC = () => {
  const {
    refreshPlatform,
    packages,
    schools,
    isSuperDuperAdmin,
  } = useSuperAdmin();
  const { mode } = useThemeContext();
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<AnalyticsFilterState>({
    range: "30d",
    dateFrom: "",
    dateTo: "",
    schoolId: "",
    packageId: "",
    lifecycle: "",
    country: "",
    state: "",
    city: "",
  });
  const [activeTab, setActiveTab] = useState<(typeof SECTION_TABS)[number]["id"]>(
    SECTION_TABS[0].id
  );
  const [customConfig, setCustomConfig] = useState({
    name: "",
    description: "",
    metrics: ["totalRevenue"],
    dimensions: ["package"],
    share: false,
  });
  const [customReportResult, setCustomReportResult] = useState<PlatformCustomReportResult | null>(null);

  const normalizedFilters = useMemo<PlatformAnalyticsFilters>(() => {
    const payload: PlatformAnalyticsFilters = {};
    if (filters.range && filters.range !== "custom") {
      payload.range = filters.range as PlatformAnalyticsFilters["range"];
    }
    if (filters.dateFrom) payload.dateFrom = filters.dateFrom;
    if (filters.dateTo) payload.dateTo = filters.dateTo;
    if (filters.schoolId) payload.schoolId = filters.schoolId;
    if (filters.packageId) payload.packageId = filters.packageId;
    if (filters.lifecycle) {
      payload.lifecycle = filters.lifecycle as
        | "ACTIVE"
        | "INACTIVE"
        | "SUSPENDED";
    }
    if (filters.country) payload.country = filters.country;
    if (filters.state) payload.state = filters.state;
    if (filters.city) payload.city = filters.city;
    return payload;
  }, [filters]);
  const builderFilters = normalizedFilters as Record<string, unknown>;
  const [logControls, setLogControls] = useState<{ severity: LogSeverityFilter; search: string }>({
    severity: "ALL",
    search: "",
  });
  const [logPage, setLogPage] = useState(1);
  const [selectedLogEntry, setSelectedLogEntry] = useState<PlatformLogTimelineEntry | null>(null);
  const logFilterParams = useMemo(() => {
    // For logs, we want to show all schools by default unless explicitly filtered
    // So we exclude schoolId from normalizedFilters and only include date range
    const payload: Record<string, unknown> = {
      range: normalizedFilters.range || filters.range || "30d",
    };
    if (normalizedFilters.dateFrom) payload.dateFrom = normalizedFilters.dateFrom;
    if (normalizedFilters.dateTo) payload.dateTo = normalizedFilters.dateTo;
    // Only include schoolId if explicitly set for logs (we can add a school filter later)
    // For now, show all schools
    if (logControls.severity && logControls.severity !== "ALL") {
      payload.severity = logControls.severity;
    }
    if (logControls.search.trim().length > 0) {
      payload.search = logControls.search.trim();
    }
    return payload;
  }, [normalizedFilters, filters.range, logControls]);
  const logFilterKey = useMemo(() => JSON.stringify(logFilterParams), [logFilterParams]);

  const revenueQuery = useQuery<PlatformRevenueAnalytics>({
    queryKey: platformQueryKeys.revenueAnalytics(normalizedFilters),
    queryFn: () => platformService.getRevenueAnalytics(normalizedFilters),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const growthQuery = useQuery<PlatformGrowthAnalytics>({
    queryKey: platformQueryKeys.growthAnalytics(normalizedFilters),
    queryFn: () => platformService.getGrowthAnalytics(normalizedFilters),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const packageAnalyticsQuery = useQuery<PlatformPackagePerformanceAnalytics>({
    queryKey: platformQueryKeys.packageAnalytics(normalizedFilters),
    queryFn: () => platformService.getPackagePerformanceAnalytics(normalizedFilters),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const attendanceAnalyticsQuery = useQuery<PlatformAttendanceAnalytics>({
    queryKey: platformQueryKeys.attendanceAnalytics(normalizedFilters),
    queryFn: () => platformService.getAttendanceAnalytics(normalizedFilters),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const financeAnalyticsQuery = useQuery<PlatformFinancialAnalytics>({
    queryKey: platformQueryKeys.financialAnalytics(normalizedFilters),
    queryFn: () => platformService.getFinancialAnalytics(normalizedFilters as any),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const customReportMetadataQuery = useQuery<PlatformCustomReportMetadata>({
    queryKey: platformQueryKeys.customReportMetadata(),
    queryFn: platformService.getCustomReportMetadata,
    enabled: isSuperDuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const customReportsQuery = useQuery<PlatformCustomReport[]>({
    queryKey: platformQueryKeys.customReports(),
    queryFn: platformService.listCustomReports,
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const benchmarkingQuery = useQuery<PlatformBenchmarkingAnalytics>({
    queryKey: platformQueryKeys.benchmarkingAnalytics(normalizedFilters),
    queryFn: () => platformService.getBenchmarkingAnalytics(normalizedFilters),
    enabled: isSuperDuperAdmin,
    staleTime: 60 * 1000,
  });

  const logSummaryQuery = useQuery<PlatformLogSummaryAnalytics>({
    queryKey: platformQueryKeys.logSummaryAnalytics(logFilterParams),
    queryFn: () => platformService.getLogSummaryAnalytics(logFilterParams as any),
    enabled: isSuperDuperAdmin && activeTab === "logs",
    staleTime: 30 * 1000,
  });

  const logTimelineQuery = useQuery<PlatformLogTimelineResult>({
    queryKey: platformQueryKeys.logTimeline({ ...logFilterParams, page: logPage }),
    queryFn: () =>
      platformService.getLogTimeline({
        ...(logFilterParams as any),
        page: logPage,
        limit: 25,
      }),
    enabled: isSuperDuperAdmin && activeTab === "logs",
    placeholderData: (previousData) => previousData,
  });

  const revenueData = revenueQuery.data;
  const growthData = growthQuery.data;
  const packageData = packageAnalyticsQuery.data;
  const attendanceData = attendanceAnalyticsQuery.data;
  const financeData = financeAnalyticsQuery.data;
  const customReportMetadata = customReportMetadataQuery.data;
  const customReports = customReportsQuery.data ?? [];
  const benchmarkingData = benchmarkingQuery.data;
  const logSummary = logSummaryQuery.data;
  const logTimeline = logTimelineQuery.data;
  const logRows = logTimeline?.data ?? [];
  const financeTrendSeries = useMemo(
    () => buildFinanceTrendSeries(financeData?.revenueTrend, financeData?.cashFlowTrend),
    [financeData]
  );
  const paymentMethodEntries = useMemo(() => {
    const breakdown = financeData?.paymentMethodBreakdown ?? {};
    return Object.entries(breakdown)
      .map(([method, amount]) => ({
        method,
        amount: coerceMetricNumber(amount),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [financeData]);
  const paymentMethodTotal = paymentMethodEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0
  );
  const financeAgingBuckets = financeData?.agingBuckets ?? DEFAULT_AGING_BUCKETS;
  const financeOutstanding = financeData?.topOutstandingSchools ?? [];
  const financeRecentInvoices = financeData?.recentInvoices ?? [];
  const financeCollectionRate =
    financeData && typeof financeData.collectionRate === "number"
      ? percentageFormatter(financeData.collectionRate)
      : "—";
  const financeDso = formatDays(financeData?.dso);
  const financeAvgDelay = formatDays(financeData?.averagePaymentDelay);
  useEffect(() => {
    setLogPage(1);
    setSelectedLogEntry(null);
  }, [logFilterKey]);

  useEffect(() => {
    if (logRows.length === 0) {
      setSelectedLogEntry(null);
    }
  }, [logRows]);
  const metricOptions = customReportMetadata?.metrics ?? [];
  const dimensionOptions = customReportMetadata?.dimensions ?? [];
  const metricLabelLookup = useMemo(
    () =>
      metricOptions.reduce<Record<string, string>>((acc, metric) => {
        acc[metric.id] = metric.label;
        return acc;
      }, {}),
    [metricOptions]
  );
  const dimensionLabelLookup = useMemo(
    () =>
      dimensionOptions.reduce<Record<string, string>>((acc, dimension) => {
        acc[dimension.id] = dimension.label;
        return acc;
      }, {}),
    [dimensionOptions]
  );

  const runCustomReportMutation = useMutation({
    mutationFn: platformService.runCustomReport,
    onSuccess: (data) => {
      setCustomReportResult(data);
    },
  });

  const saveCustomReportMutation = useMutation({
    mutationFn: platformService.createCustomReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.customReports() });
    },
  });
  const isRunningCustomReport = runCustomReportMutation.isPending;
  const isSavingCustomReport = saveCustomReportMutation.isPending;
  const builderDisabled = metricOptions.length === 0;

  const toggleMetric = (metricId: string) => {
    setCustomConfig((prev) => {
      const exists = prev.metrics.includes(metricId);
      if (exists && prev.metrics.length === 1) {
        return prev;
      }
      const nextMetrics = exists ? prev.metrics.filter((id) => id !== metricId) : [...prev.metrics, metricId];
      return { ...prev, metrics: nextMetrics };
    });
  };

  const toggleDimension = (dimensionId: string) => {
    setCustomConfig((prev) => {
      const exists = prev.dimensions.includes(dimensionId);
      const nextDimensions = exists ? prev.dimensions.filter((id) => id !== dimensionId) : [...prev.dimensions, dimensionId];
      return { ...prev, dimensions: nextDimensions };
    });
  };

  const handleRunCustomReport = () => {
    if (!customConfig.metrics.length) {
      alert("Select at least one metric to run the report.");
      return;
    }
    runCustomReportMutation.mutate({
      configuration: {
        metrics: customConfig.metrics,
        dimensions: customConfig.dimensions,
        filters: builderFilters,
      },
    });
  };

  const handleSaveCustomReport = () => {
    if (!customConfig.name.trim()) {
      alert("Provide a name before saving the report.");
      return;
    }
    saveCustomReportMutation.mutate({
      name: customConfig.name.trim(),
      description: customConfig.description?.trim(),
      reportKey: "CUSTOM_PAYMENTS",
      metrics: customConfig.metrics,
      dimensions: customConfig.dimensions,
      filters: builderFilters,
      visualization: { type: "table" },
      isShared: customConfig.share,
    });
  };

  const handleRunSavedReport = (reportId: string) => {
    runCustomReportMutation.mutate({ reportId });
  };

  const handleLoadSavedReport = (report: PlatformCustomReport) => {
    setCustomConfig({
      name: report.name,
      description: report.description ?? "",
      metrics: report.metrics,
      dimensions: report.dimensions,
      share: report.isShared,
    });
    setCustomReportResult(null);
  };

  const revenueTrend = useMemo(
    () => toTrendSeries(revenueData?.trend),
    [revenueData?.trend]
  );

  const packageBreakdown = useMemo(
    () => buildPackageBreakdown(revenueData?.packageBreakdown),
    [revenueData?.packageBreakdown]
  );

  const growthTrend = useMemo(
    () => buildGrowthTrendSeries(growthData?.trends),
    [growthData?.trends]
  );

  const topPackageNames = useMemo(() => {
    if (!packageData?.packages) return [];
    return packageData.packages.map((pkg) => pkg.packageName).slice(0, 3);
  }, [packageData?.packages]);

  const packageTrendSeries = useMemo(() => {
    if (!packageData?.adoptionTrend || topPackageNames.length === 0) return [];
    return packageData.adoptionTrend.map((entry) => {
      const row: Record<string, number | string> = { date: entry.date };
      topPackageNames.forEach((name) => {
        row[name] = entry.packages?.[name] || 0;
      });
      return row;
    });
  }, [packageData?.adoptionTrend, topPackageNames]);

  const attendanceTrend = useMemo(
    () => attendanceData?.dailyTrend ?? [],
    [attendanceData?.dailyTrend]
  );
  const customReportDimensionHeaders = customReportResult?.dimensionsUsed ?? [];
  const customReportMetricHeaders = customReportResult?.metricsUsed ?? [];
  const benchmarkingSummary = benchmarkingData?.summary;

  const reportRows: ReportRow[] = useMemo(
    () =>
      BASE_REPORTS.map((report) => {
        let lastRun = "—";
        if (report.id === "revenue" && revenueData) {
          lastRun = new Date(revenueData.endDate).toLocaleDateString();
        } else if (report.id === "growth" && growthData) {
          lastRun = new Date(growthData.endDate).toLocaleDateString();
        } else if (report.id === "packages" && packageAnalyticsQuery.data) {
          lastRun = new Date(packageAnalyticsQuery.data.endDate).toLocaleDateString();
        } else if (report.id === "attendance" && attendanceAnalyticsQuery.data) {
          lastRun = new Date(attendanceAnalyticsQuery.data.endDate).toLocaleDateString();
        }
        return {
          ...report,
          lastRun,
        };
      }),
    [attendanceAnalyticsQuery.data, growthData, packageAnalyticsQuery.data, revenueData]
  );

  const revenueTotals = revenueData?.totals;
  const growthTotals = growthData?.totals;

  const renderRevenueChart = () => {
    if (revenueTrend.length === 0) {
      if (revenueQuery.isLoading) {
        return <ChartEmptyState message="Loading revenue analytics…" />;
      }
      return <ChartEmptyState />;
    }
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={revenueTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderPackageChart = () => {
    if (packageBreakdown.length === 0) {
      return <ChartEmptyState message="No package breakdown data yet." />;
    }
    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={packageBreakdown}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderGrowthChart = () => {
    if (growthTrend.length === 0) {
      if (growthQuery.isLoading) {
        return <ChartEmptyState message="Loading growth analytics…" />;
      }
      return <ChartEmptyState />;
    }
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={growthTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="newSchools"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="New schools"
          />
          <Line
            type="monotone"
            dataKey="churnedSchools"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="Churned schools"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderSectionContent = () => {
    switch (activeTab) {
      case "revenue":
        return (
      <ChartContainer
            title="Revenue overview"
            description="High-level revenue KPIs with daily trend and package breakdown."
            type="line"
        toolbar={
              <button
                type="button"
                onClick={() => revenueQuery.refetch()}
                className={clsx(
                  "rounded-lg border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                  mode === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                Refresh
              </button>
            }
            footer={
          <button
            type="button"
            onClick={refreshPlatform}
                 className={clsx("text-xs font-medium hover:underline", mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600')}
               >
                Sync platform data
              </button>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <MetricCard
                  label="Total revenue"
                  value={
                    revenueTotals
                      ? currencyFormatter.format(revenueTotals.revenue)
                      : "—"
                  }
                  subLabel="Sum of paid invoices in the selected window"
                />
                <MetricCard
                  label="Monthly recurring revenue"
                  value={
                    revenueTotals ? currencyFormatter.format(revenueTotals.mrr) : "—"
                  }
                />
                <MetricCard
                  label="Annual recurring revenue"
                  value={
                    revenueTotals ? currencyFormatter.format(revenueTotals.arr) : "—"
                  }
                />
                <MetricCard
                  label="ARPU"
                  value={
                    revenueTotals ? currencyFormatter.format(revenueTotals.arpu) : "—"
                  }
                  subLabel={`${revenueTotals?.payingSchools ?? 0} paying schools`}
                />
                <MetricCard
                  label="Avg. transaction"
                  value={
                    revenueTotals
                      ? currencyFormatter.format(
                          revenueTotals.averageTransactionValue
                        )
                      : "—"
                  }
                />
                <MetricCard
                  label="Transactions"
                  value={revenueTotals ? `${revenueTotals.transactions}` : "—"}
                />
              </div>
              {renderRevenueChart()}
              <div className="pt-4">
                <h4 className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  Revenue by package
                </h4>
                <div className="mt-3">{renderPackageChart()}</div>
              </div>
            </div>
          </ChartContainer>
        );
      case "growth":
        return (
          <ChartContainer
            title="Growth & churn overview"
            description="Track new school activations, churn, and retention."
            type="line"
            toolbar={
              <button
                type="button"
                onClick={() => growthQuery.refetch()}
                className={clsx(
                  "rounded-lg border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                  mode === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                Refresh
            </button>
            }
      >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="New schools"
                  value={growthTotals ? `${growthTotals.newSchools}` : "—"}
                />
                <MetricCard
                  label="Churned schools"
                  value={growthTotals ? `${growthTotals.churnedSchools}` : "—"}
                />
                <MetricCard
                  label="Net growth"
                  value={
                    growthTotals
                      ? `${growthTotals.netGrowth >= 0 ? "+" : ""}${
                          growthTotals.netGrowth
                        }`
                      : "—"
                  }
                />
                <MetricCard
                  label="Churn rate"
                  value={
                    growthTotals
                      ? percentageFormatter(growthTotals.churnRate)
                      : "—"
                  }
                  subLabel={`Retention ${
                    growthTotals ? percentageFormatter(growthTotals.retentionRate) : "—"
                  }`}
                />
              </div>
              {renderGrowthChart()}
            </div>
          </ChartContainer>
        );
      case "packages":
        return (
          <ChartContainer
            title="Package performance"
            description="Track ARPU and adoption trend by package tier."
            type="stacked"
            toolbar={
              <button
                type="button"
                onClick={() => packageAnalyticsQuery.refetch()}
                className={clsx(
                  "rounded-lg border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                  mode === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                Refresh
              </button>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Packages tracked"
                  value={
                    packageData
                      ? decimalFormatter.format(packageData.totals.packagesTracked)
                      : "—"
                  }
                />
                <MetricCard
                  label="Active schools"
                  value={
                    packageData
                      ? decimalFormatter.format(packageData.totals.activeSchools)
                      : "—"
                  }
                />
                <MetricCard
                  label="Avg. ARPU"
                  value={
                    packageData
                      ? currencyFormatter.format(packageData.totals.averageArpu)
                      : "—"
                  }
                />
                <MetricCard
                  label="Upgrade / Downgrade"
                  value={
                    packageData
                      ? `${packageData.totals.upgradeRequests} / ${packageData.totals.downgradeRequests}`
                      : "—"
                  }
                />
              </div>
              {packageTrendSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={packageTrendSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {topPackageNames.map((name, index) => (
                      <Bar
                        key={name}
                        dataKey={name}
                        stackId="packages"
                        fill={["#6366F1", "#F97316", "#10B981"][index % 3]}
                        radius={
                          index === topPackageNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmptyState message="No package adoption data yet." />
              )}
              <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                <div className={clsx("flex items-center justify-between border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                  <span>Top packages</span>
                  <span>ARPU</span>
                </div>
                <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                  {(packageData?.packages ?? []).slice(0, 5).map((pkg) => (
                    <div
                      key={pkg.packageId}
                      className={clsx("flex items-center justify-between px-4 py-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                    >
                      <div>
                        <p className="font-medium">{pkg.packageName}</p>
                        <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                          {pkg.activeSchools} active • {currencyFormatter.format(pkg.revenue)}{" "}
                          revenue
                        </p>
                      </div>
                      <span className="font-semibold">
                        {currencyFormatter.format(pkg.arpu)}
                      </span>
                    </div>
                  ))}
                  {(packageData?.packages ?? []).length === 0 && (
                    <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                      No package data yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ChartContainer>
        );
      case "attendance":
        return (
          <ChartContainer
            title="Attendance quality"
            description="Average attendance, late arrivals, and class/subject insights."
            type="area"
            toolbar={
              <button
                type="button"
                onClick={() => attendanceAnalyticsQuery.refetch()}
                className={clsx(
                  "rounded-lg border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                  mode === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                )}
              >
                Refresh
              </button>
            }
            >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Average attendance"
                  value={
                    attendanceData
                      ? percentageFormatter(attendanceData.totals.averageAttendance)
                      : "—"
                  }
                  subLabel={`Late rate ${
                    attendanceData ? percentageFormatter(attendanceData.totals.lateRate) : "—"
                  }`}
                />
                <MetricCard
                  label="Present / Absent"
                  value={
                    attendanceData
                      ? `${attendanceData.totals.present} / ${attendanceData.totals.absent}`
                      : "—"
                  }
                />
                <MetricCard
                  label="Late arrivals"
                  value={attendanceData ? `${attendanceData.totals.late}` : "—"}
                />
                <MetricCard
                  label="Excused / Half-day"
                  value={
                    attendanceData
                      ? `${attendanceData.totals.excused} / ${attendanceData.totals.halfDay}`
                      : "—"
                  }
                />
              </div>
              {attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B98155"
                      name="Present"
                    />
                    <Area
                      type="monotone"
                      dataKey="absent"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF444455"
                      name="Absent"
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="#F59E0B55"
                      name="Late"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmptyState message="No attendance data for this window." />
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                  <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                    Top classes
                  </div>
                  <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                    {(attendanceData?.classLeaders ?? []).map((cls) => (
                      <div
                        key={cls.classId}
                        className={clsx("flex items-center justify-between px-4 py-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                      >
                        <span>{cls.className}</span>
                        <span className="font-semibold">
                          {percentageFormatter(cls.attendancePercent)}
                        </span>
                      </div>
                    ))}
                    {(attendanceData?.classLeaders ?? []).length === 0 && (
                      <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        No class data yet.
                      </div>
                    )}
                  </div>
                </div>
                <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                  <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                    Subject alerts
                  </div>
                  <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                    {(attendanceData?.subjectAlerts ?? []).map((subject) => (
                      <div
                        key={subject.subjectId}
                        className={clsx("flex items-center justify-between px-4 py-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                      >
                        <span>{subject.subjectName}</span>
                        <span className="font-semibold text-rose-500">
                          {subject.absenceCount} absences
                        </span>
                      </div>
                    ))}
                    {(attendanceData?.subjectAlerts ?? []).length === 0 && (
                      <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        No subject alerts yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ChartContainer>
        );
      case "finance":
        return (
          <div className="space-y-6">
            <ChartContainer
              title="Finance intelligence"
              description="Monitor collected revenue, outstanding balances, and payment health."
              type="area"
              toolbar={
                <button
                  type="button"
                  onClick={() => financeAnalyticsQuery.refetch()}
                  className={clsx(
                    "rounded-lg border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  Refresh
                </button>
              }
            >
              {financeAnalyticsQuery.isLoading ? (
                <ChartEmptyState message="Loading finance analytics..." />
              ) : financeData ? (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <MetricCard
                      label="Collected revenue"
                      value={currencyFormatter.format(financeData.revenue)}
                      subLabel={`${financeData.range?.toUpperCase() ?? "Range"}`}
                    />
                    <MetricCard
                      label="Outstanding"
                      value={currencyFormatter.format(financeData.outstanding)}
                      subLabel="Still to be collected"
                    />
                    <MetricCard
                      label="Overdue"
                      value={currencyFormatter.format(financeData.overdue)}
                      subLabel="Past the due date"
                    />
                    <MetricCard
                      label="Collection rate"
                      value={financeCollectionRate}
                      subLabel="Paid vs invoiced"
                    />
                    <MetricCard
                      label="DSO"
                      value={financeDso}
                      subLabel="Days sales outstanding"
                    />
                    <MetricCard
                      label="Avg. payment delay"
                      value={financeAvgDelay}
                      subLabel="From due to paid"
                    />
                  </div>
                  <div className="space-y-3">
                    <p className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                      Collected vs invoiced
                    </p>
                    {financeTrendSeries.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={financeTrendSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="collected"
                            stackId="1"
                            stroke="#6366F1"
                            fill="#6366F144"
                            name="Collected"
                          />
                          <Area
                            type="monotone"
                            dataKey="invoiced"
                            stackId="1"
                            stroke="#F97316"
                            fill="#F9731633"
                            name="Invoiced"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartEmptyState message="No finance activity for the selected filters." />
                    )}
                  </div>
                </div>
              ) : (
                <ChartEmptyState message="No finance analytics available yet." />
              )}
            </ChartContainer>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartContainer
                title="Payment method mix"
                description="Share of collected revenue by payment method."
                type="bar"
              >
                {paymentMethodEntries.length === 0 ? (
                  <ChartEmptyState message="No payment method data for this window." />
                ) : (
                  <div className="space-y-4">
                    {paymentMethodEntries.map((entry) => {
                      const pct =
                        paymentMethodTotal > 0 ? entry.amount / paymentMethodTotal : 0;
                      return (
                        <div key={entry.method} className="space-y-2">
                          <div className={clsx("flex items-center justify-between text-sm font-medium", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                            <span>{entry.method}</span>
                            <span>{currencyFormatter.format(entry.amount)}</span>
                          </div>
                          <div className={clsx("h-2 rounded-full", mode === 'dark' ? 'bg-slate-800' : 'bg-slate-100')}>
                            <div
                              className="h-2 rounded-full bg-indigo-500"
                              style={{ width: `${Math.min(100, pct * 100)}%` }}
                            />
                          </div>
                          <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                            {percentageFormatter(pct || 0)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ChartContainer>

              <ChartContainer
                title="Outstanding aging"
                description="Breakdown of open invoices by days past due."
                type="bar"
              >
                <div className="space-y-3">
                  {(
                    Object.keys(FINANCE_AGING_LABELS) as Array<
                      keyof typeof FINANCE_AGING_LABELS
                    >
                  ).map((bucket) => {
                    const meta = FINANCE_AGING_LABELS[bucket];
                    const amount = financeAgingBuckets[bucket] ?? 0;
                    return (
                      <div
                        key={bucket}
                        className={clsx("rounded-lg border p-3", mode === 'dark' ? 'border-slate-800' : 'border-slate-200')}
                      >
                        <div className={clsx("flex items-center justify-between text-sm font-semibold", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                          <span>{meta.label}</span>
                          <span>{currencyFormatter.format(amount)}</span>
                        </div>
                        <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                          {meta.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ChartContainer>
            </div>

            <ChartContainer
              title="Top outstanding schools"
              description="Schools with the highest outstanding and overdue balances."
              type="bar"
            >
              {financeOutstanding.length === 0 ? (
                <ChartEmptyState message="No outstanding balances for this window." />
              ) : (
                <div className={clsx("overflow-x-auto rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                  <table className={clsx("min-w-full divide-y text-sm", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                    <thead className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500')}>
                      <tr>
                        <th className="px-3 py-2 text-left">School</th>
                        <th className="px-3 py-2 text-right">Outstanding</th>
                        <th className="px-3 py-2 text-right">Overdue</th>
                      </tr>
                    </thead>
                    <tbody className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                       {financeOutstanding.map((entry) => (
                         <tr key={entry.schoolId}>
                           <td className="px-3 py-2">
                             <p className={clsx("font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-800')}>
                               {entry.schoolName}
                             </p>
                             {entry.schoolCode && (
                               <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                                 {entry.schoolCode}
                               </p>
                             )}
                           </td>
                           <td className={clsx("px-3 py-2 text-right font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
                             {currencyFormatter.format(entry.outstandingAmount)}
                           </td>
                           <td className={clsx("px-3 py-2 text-right", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                             {currencyFormatter.format(entry.overdueAmount)}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
              )}
            </ChartContainer>

            <ChartContainer
              title="Recent invoices"
              description="Latest invoices with due dates and payment status."
              type="line"
            >
              {financeRecentInvoices.length === 0 ? (
                <ChartEmptyState message="No invoices recorded for this window." />
              ) : (
                <div className={clsx("overflow-x-auto rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                  <table className={clsx("min-w-full divide-y text-sm", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                    <thead className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500')}>
                      <tr>
                        <th className="px-3 py-2 text-left">Invoice</th>
                        <th className="px-3 py-2 text-left">School</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 text-left">Due date</th>
                        <th className="px-3 py-2 text-left">Paid date</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                      {financeRecentInvoices.slice(0, 10).map((invoice) => {
                        const badge = getInvoiceStatusBadge(invoice.status, mode);
                        return (
                          <tr key={invoice.id}>
                            <td className={clsx("px-3 py-2 font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-800')}>
                              #{invoice.id}
                            </td>
                            <td className="px-3 py-2">
                              <p className={clsx(mode === 'dark' ? 'text-slate-100' : 'text-slate-800')}>
                                {invoice.school?.name ?? "—"}
                              </p>
                              {invoice.school?.code && (
                                <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                                  {invoice.school.code}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {currencyFormatter.format(invoice.total)}
                            </td>
                            <td className="px-3 py-2">{formatDateLabel(invoice.dueDate)}</td>
                            <td className="px-3 py-2">
                              {invoice.paymentDate ? formatDateLabel(invoice.paymentDate) : "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartContainer>
          </div>
        );
      case "catalog":
        return (
          <div
            className={
              mode === "dark"
                ? "rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
                : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            }
          >
      <AdvancedDataTable<ReportRow>
              data={reportRows}
        columns={[
          {
            key: "name",
            header: "Report",
            accessor: (row) => (
              <div>
                <div
                  className={
                    mode === "dark"
                      ? "font-medium text-slate-100"
                      : "font-medium text-slate-900"
                  }
                >
                  {row.name}
                </div>
                <div
                  className={
                    mode === "dark"
                      ? "text-xs text-slate-400"
                      : "text-xs text-slate-500"
                  }
                >
                  {row.description}
                </div>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            accessor: (row) => (
              <span
                className={
                  mode === "dark"
                    ? "rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase text-slate-300"
                    : "rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-600"
                }
              >
                {row.type}
              </span>
            ),
            align: "center",
          },
          {
            key: "lastRun",
            header: "Last run",
            accessor: (row) => row.lastRun,
          },
        ]}
        pageSize={5}
        getRowId={(row) => row.id}
        actions={
          <QuickActions
            actions={[
              {
                id: "schedule",
                label: "Schedule export",
                onClick: () => console.log("schedule export"),
              },
              {
                id: "run-now",
                label: "Run report",
                onClick: () => console.log("run report"),
                badge: "Beta",
              },
            ]}
          />
        }
      />
          </div>
        );
      case "custom":
        return (
          <ChartContainer
            title="Custom report builder"
            description="Assemble ad-hoc revenue reports, preview data, and save reusable templates."
            footer={
              customReportResult && (
                <div>
                  Summary:{" "}
                  {currencyFormatter.format(customReportResult.summary.totalRevenue)} across{" "}
                  {customReportResult.summary.transactionCount} transactions.
                </div>
              )
            }
          >
            {builderDisabled ? (
              <ChartEmptyState message="Preparing metrics and dimensions metadata..." />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className={clsx("mb-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                      Metrics
                    </p>
                    <div className="space-y-2">
                      {metricOptions.map((metric) => (
                        <label
                          key={metric.id}
                          className={clsx("flex items-start gap-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                        >
                          <input
                            type="checkbox"
                            checked={customConfig.metrics.includes(metric.id)}
                            onChange={() => toggleMetric(metric.id)}
                            className={clsx("mt-1 rounded text-indigo-600 focus:ring-indigo-500", mode === 'dark' ? 'border-slate-700' : 'border-slate-300')}
                          />
                          <span>
                            <span className="font-medium">{metric.label}</span>
                            <span className={clsx("block text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                              {metric.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={clsx("mb-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                      Dimensions
                    </p>
                    <div className="space-y-2">
                      {dimensionOptions.map((dimension) => (
                        <label
                          key={dimension.id}
                          className={clsx("flex items-start gap-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                        >
                          <input
                            type="checkbox"
                            checked={customConfig.dimensions.includes(dimension.id)}
                            onChange={() => toggleDimension(dimension.id)}
                            className={clsx("mt-1 rounded text-indigo-600 focus:ring-indigo-500", mode === 'dark' ? 'border-slate-700' : 'border-slate-300')}
                          />
                          <span>
                            <span className="font-medium">{dimension.label}</span>
                            <span className={clsx("block text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                              {dimension.description}
                            </span>
                          </span>
                        </label>
                      ))}
                      {dimensionOptions.length === 0 && (
                        <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                          No dimensions available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                      Report name
                    </label>
                    <input
                      type="text"
                      className={clsx(
                        "w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                        mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 text-slate-700'
                      )}
                      placeholder="e.g. Revenue by package"
                      value={customConfig.name}
                      onChange={(event) =>
                        setCustomConfig((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                      Description
                    </label>
                    <input
                      type="text"
                      className={clsx(
                        "w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                        mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 text-slate-700'
                      )}
                      placeholder="Optional description"
                      value={customConfig.description}
                      onChange={(event) =>
                        setCustomConfig((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <label className={clsx("flex items-center gap-2 text-xs font-medium", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                    <input
                      type="checkbox"
                      checked={customConfig.share}
                      onChange={(event) =>
                        setCustomConfig((prev) => ({
                          ...prev,
                          share: event.target.checked,
                        }))
                      }
                      className={clsx("rounded text-indigo-600 focus:ring-indigo-500", mode === 'dark' ? 'border-slate-700' : 'border-slate-300')}
                    />
                    Share with all super admins
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRunCustomReport}
                    disabled={isRunningCustomReport}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunningCustomReport ? "Running..." : "Run custom report"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomReport}
                    disabled={isSavingCustomReport || !customConfig.name.trim()}
                    className={clsx(
                      "rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60",
                      mode === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {isSavingCustomReport ? "Saving..." : "Save custom report"}
                  </button>
                </div>

                {customReportResult ? (
                   <div className="space-y-3">
                     <div className={clsx("overflow-auto rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                       <table className={clsx("min-w-full divide-y text-sm", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                         <thead className={clsx("", mode === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50')}>
                           <tr>
                             {customReportDimensionHeaders.map((dimension) => (
                               <th
                                 key={dimension}
                                 className={clsx("px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}
                               >
                                 {dimensionLabelLookup[dimension] ?? dimension}
                               </th>
                             ))}
                             {customReportMetricHeaders.map((metric) => (
                               <th
                                 key={metric}
                                 className={clsx("px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}
                               >
                                 {metricLabelLookup[metric] ?? metric}
                               </th>
                             ))}
                           </tr>
                         </thead>
                         <tbody className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                           {customReportResult.rows.map((row, index) => (
                             <tr
                               key={`${row.dimensions?.package ?? "row"}-${index}`}
                               className={mode === 'dark' ? 'bg-slate-900' : 'bg-white'}
                             >
                               {customReportDimensionHeaders.map((dimension) => (
                                 <td key={dimension} className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                  {row.dimensions[dimension] ?? "N/A"}
                                </td>
                              ))}
                              {customReportMetricHeaders.map((metric) => (
                                <td key={metric} className={clsx("px-3 py-2", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                                  {metric === "totalRevenue"
                                    ? currencyFormatter.format(row.metrics.totalRevenue)
                                    : row.metrics.transactionCount}
                                </td>
                              ))}
                              </tr>
                              ))}
                              {customReportResult.rows.length === 0 && (
                              <tr>
                              <td
                                colSpan={
                                  customReportDimensionHeaders.length + customReportMetricHeaders.length || 1
                                }
                                className={clsx("px-3 py-6 text-center text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}
                              >
                                No rows found for the selected configuration.
                              </td>
                              </tr>
                              )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <ChartEmptyState message="Run the custom report to preview data." />
                )}

                <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                  <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                    Saved custom reports
                  </div>
                  <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                    {customReports.length === 0 && (
                      <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        No saved custom reports yet.
                      </div>
                    )}
                    {customReports.map((report) => (
                      <div
                        key={report.id}
                        className={clsx("flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                      >
                        <div>
                          <p className="font-semibold">{report.name}</p>
                          {report.description && (
                            <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>{report.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedReport(report)}
                            className={clsx(
                              "rounded-full border px-3 py-1 text-xs font-medium transition",
                              mode === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            )}
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunSavedReport(report.id)}
                            className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
                          >
                            Run
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ChartContainer>
        );
      case "benchmarking":
        return (
          <ChartContainer
            title="Benchmarking insights"
            description="Compare revenue performance across packages and regions."
            footer={
              benchmarkingData && (
                <div>
                  Time window {benchmarkingData.startDate.slice(0, 10)} →{" "}
                  {benchmarkingData.endDate.slice(0, 10)}
                </div>
              )
            }
          >
            {benchmarkingQuery.isLoading ? (
              <ChartEmptyState message="Loading benchmarking analytics..." />
            ) : benchmarkingData ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    label="Benchmark revenue"
                    value={currencyFormatter.format(benchmarkingSummary?.totalRevenue ?? 0)}
                    subLabel="Aggregated across selected filters"
                  />
                  <MetricCard
                    label="Transactions"
                    value={`${benchmarkingSummary?.transactionCount ?? 0}`}
                    subLabel="Paid invoices in the window"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                    <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                      Top packages
                    </div>
                    <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                      {benchmarkingData.topPackages.length === 0 && (
                        <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                          No package data.
                        </div>
                      )}
                      {benchmarkingData.topPackages.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between px-4 py-2 text-sm"
                        >
                          <span className={clsx("", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>{entry.name}</span>
                          <span className={clsx("font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                            {currencyFormatter.format(entry.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                    <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                      Top countries
                    </div>
                    <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                      {benchmarkingData.topCountries.length === 0 && (
                        <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                          No country data.
                        </div>
                      )}
                      {benchmarkingData.topCountries.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between px-4 py-2 text-sm"
                        >
                          <span className={clsx("", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>{entry.name}</span>
                          <span className={clsx("font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                            {currencyFormatter.format(entry.revenue)}
                          </span>
                          </div>
                          ))}
                          </div>
                          </div>
                          </div>
              </div>
            ) : (
              <ChartEmptyState message="No benchmarking data found for the selected filters." />
            )}
          </ChartContainer>
        );
      case "logs":
        return (
          <div className="space-y-6">
            <ChartContainer
              title="Log intelligence overview"
              description="Per-school audit activity, severity breakdown, and top actors."
              type="line"
            >
              {logSummaryQuery.isLoading ? (
                <ChartEmptyState message="Loading log analytics..." />
              ) : logSummaryQuery.error ? (
                <ChartEmptyState 
                  message={`Error loading log analytics: ${logSummaryQuery.error instanceof Error ? logSummaryQuery.error.message : 'Unknown error'}`}
                />
              ) : logSummary ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {LOG_SEVERITY_OPTIONS.map((option) => {
                      const isActive = logControls.severity === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setLogControls((prev) => ({
                              ...prev,
                              severity: option.id,
                            }))
                          }
                          className={clsx(
                            "rounded-full px-3 py-1 text-xs font-semibold transition",
                            isActive
                              ? "bg-indigo-600 text-white shadow-sm"
                              : mode === 'dark'
                              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                    <div className="relative ml-auto w-full max-w-xs">
                      <input
                        type="search"
                        value={logControls.search}
                        onChange={(event) =>
                          setLogControls((prev) => ({
                            ...prev,
                            search: event.target.value,
                          }))
                        }
                        placeholder="Search path, action, entity..."
                        className={clsx(
                          "w-full rounded-full border bg-white pl-10 pr-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                          mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 text-slate-700'
                        )}
                      />
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Total events"
                      value={logSummary.totals.totalEvents.toLocaleString()}
                    />
                    <MetricCard
                      label="Errors"
                      value={logSummary.totals.errorEvents.toLocaleString()}
                    />
                    <MetricCard
                      label="Warnings"
                      value={logSummary.totals.warningEvents.toLocaleString()}
                    />
                    <MetricCard
                      label="Average latency"
                      value={formatLatency(logSummary.totals.averageLatencyMs)}
                    />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <p className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Severity trend
                      </p>
                      {logSummary.sparkline.length === 0 ? (
                        <ChartEmptyState message="No log activity for this window." />
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={logSummary.sparkline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="total"
                              stackId="1"
                              stroke="#6366F1"
                              fill="#6366F155"
                              name="Total"
                            />
                            <Area
                              type="monotone"
                              dataKey="warnings"
                              stackId="1"
                              stroke="#F59E0B"
                              fill="#F59E0B55"
                              name="Warnings"
                            />
                            <Area
                              type="monotone"
                              dataKey="errors"
                              stackId="1"
                              stroke="#EF4444"
                              fill="#EF444455"
                              name="Errors"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                        <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                          Top actions
                        </div>
                        <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                          {logSummary.topActions.length === 0 && (
                            <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                              No actions recorded.
                            </div>
                          )}
                          {logSummary.topActions.map((entry) => (
                            <div
                              key={entry.action}
                              className={clsx("flex items-center justify-between px-4 py-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                            >
                              <span>{entry.action}</span>
                              <span className="font-semibold">{entry.count.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                        <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                          Top endpoints
                        </div>
                        <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                          {logSummary.topEndpoints.length === 0 && (
                            <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                              No endpoint activity yet.
                            </div>
                          )}
                          {logSummary.topEndpoints.map((entry) => (
                            <div
                              key={entry.path}
                              className={clsx("flex items-center justify-between px-4 py-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                            >
                              <span className="truncate">{entry.path}</span>
                              <span className="font-semibold">{entry.count.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={clsx("rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                    <div className={clsx("border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500')}>
                      Top actors
                    </div>
                    <div className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                      {logSummary.topActors.length === 0 && (
                        <div className={clsx("px-4 py-3 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                          No actor activity available.
                        </div>
                      )}
                      {logSummary.topActors.map((entry) => (
                        <div
                          key={entry.userId}
                          className={clsx("flex items-center justify-between px-4 py-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}
                        >
                          <div>
                            <p className="font-semibold">
                              {entry.user ? formatUserDisplay(entry.user) : "Unknown"}
                            </p>
                            <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                              {entry.user?.role ?? "—"}
                            </p>
                          </div>
                          <span className="font-semibold">{entry.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <ChartEmptyState message="No log data found for the selected filters." />
              )}
            </ChartContainer>

            <ChartContainer
              title="Detailed log timeline"
              description="Inspect individual events with request context and response status."
              type="line"
            >
              {logTimelineQuery.isLoading ? (
                <ChartEmptyState message="Loading log timeline..." />
              ) : logTimelineQuery.error ? (
                <ChartEmptyState 
                  message={`Error loading log timeline: ${logTimelineQuery.error instanceof Error ? logTimelineQuery.error.message : 'Unknown error'}`}
                />
              ) : logRows.length === 0 ? (
                <ChartEmptyState message="No log entries match the selected filters." />
              ) : (
                <div className="space-y-4">
                  <div className={clsx("overflow-x-auto rounded-lg border", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}>
                    <table className={clsx("min-w-full divide-y text-sm", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                      <thead className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500')}>
                        <tr>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">School</th>
                          <th className="px-3 py-2 text-left">Actor</th>
                          <th className="px-3 py-2 text-left">Action</th>
                          <th className="px-3 py-2 text-left">Endpoint</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Latency</th>
                        </tr>
                      </thead>
                      <tbody className={clsx("divide-y", mode === 'dark' ? 'divide-slate-800' : 'divide-slate-100')}>
                        {logRows.map((entry) => {
                          const isSelected = selectedLogEntry?.id === entry.id;
                          const severity = resolveLogSeverity(entry.responseStatus, entry.isSuccess);
                          return (
                            <tr
                              key={entry.id}
                              onClick={() => setSelectedLogEntry(entry)}
                              className={clsx("cursor-pointer", mode === 'dark' ? 'bg-slate-900 hover:bg-slate-800/60' : 'bg-white hover:bg-indigo-50/60', isSelected ? (mode === 'dark' ? 'ring-2 ring-indigo-500/60' : 'ring-2 ring-indigo-200') : '')}
                            >
                              <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                                {new Date(entry.createdAt).toLocaleString()}
                              </td>
                              <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                {entry.school?.name ?? "—"}
                              </td>
                              <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                {formatUserDisplay(entry.user)}
                              </td>
                              <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                <div className="flex items-center gap-2">
                                  <span>{entry.action}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LOG_SEVERITY_STYLES[severity]}`}
                                  >
                                    {severity}
                                  </span>
                                </div>
                                <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                                  {entry.entityType}
                                  {entry.entityId ? ` • ${entry.entityId}` : ""}
                                </p>
                                </td>
                                <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                <div className="truncate">{entry.requestPath ?? entry.requestUrl ?? "—"}</div>
                                <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                                  {entry.requestMethod ?? "—"}
                                </p>
                                </td>
                                <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                {entry.responseStatus ?? "—"}
                                </td>
                                <td className={clsx("px-3 py-2", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                                {formatLatency(entry.responseTimeMs)}
                                </td>
                                </tr>
                                );
                                })}
                                </tbody>
                                </table>
                                </div>
                                <div className={clsx("flex flex-wrap items-center justify-between gap-3 text-sm", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                    <p>
                      Page {logTimeline?.page ?? logPage} of {logTimeline?.totalPages ?? 1} •{" "}
                      {logTimeline?.total.toLocaleString()} events
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLogPage((prev) => Math.max(1, prev - 1))}
                        disabled={logPage === 1 || logTimelineQuery.isFetching}
                        className={clsx("rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60", mode === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLogPage((prev) => {
                            const maxPages = logTimeline?.totalPages ?? Number.MAX_SAFE_INTEGER;
                            return Math.min(maxPages, prev + 1);
                          })
                        }
                        disabled={
                          logPage >= (logTimeline?.totalPages ?? 1) || logTimelineQuery.isFetching
                        }
                        className={clsx("rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60", mode === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </ChartContainer>

            <div className={clsx("rounded-xl border p-4 shadow-sm", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={clsx("text-xs font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                    Log details
                  </p>
                  <p className={clsx("text-sm", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                    Inspect headers, payloads, and metadata for a single request.
                  </p>
                </div>
                {selectedLogEntry && (
                  <button
                    type="button"
                    onClick={() => setSelectedLogEntry(null)}
                    className={clsx("rounded-full border px-3 py-1 text-xs font-semibold transition", mode === 'dark' ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {selectedLogEntry ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className={clsx("text-xs uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Request
                      </p>
                      <p className={clsx("text-sm font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                        {selectedLogEntry.requestMethod ?? "—"} {selectedLogEntry.requestPath ?? "—"}
                      </p>
                      <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        {selectedLogEntry.requestUrl ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className={clsx("text-xs uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Status
                      </p>
                      <p className={clsx("text-sm font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                        {selectedLogEntry.responseStatus ?? "—"}
                      </p>
                      <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        {formatLatency(selectedLogEntry.responseTimeMs)}
                      </p>
                    </div>
                    <div>
                      <p className={clsx("text-xs uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Actor
                      </p>
                      <p className={clsx("text-sm font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                        {formatUserDisplay(selectedLogEntry.user)}
                      </p>
                      <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        {selectedLogEntry.user?.role ?? "—"} • {selectedLogEntry.school?.name ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={clsx("rounded-lg border p-3 text-xs font-mono", mode === 'dark' ? 'border-slate-800 bg-slate-900/50 text-slate-300' : 'border-slate-100 bg-slate-50/60 text-slate-700')}>
                      <p className={clsx("mb-2 text-[11px] font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Request headers
                      </p>
                      <pre className="max-h-64 overflow-auto text-[11px] leading-relaxed">
                        {formatJsonBlock(selectedLogEntry.requestHeaders)}
                      </pre>
                    </div>
                    <div className={clsx("rounded-lg border p-3 text-xs font-mono", mode === 'dark' ? 'border-slate-800 bg-slate-900/50 text-slate-300' : 'border-slate-100 bg-slate-50/60 text-slate-700')}>
                      <p className={clsx("mb-2 text-[11px] font-semibold uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Request query / body
                      </p>
                      <pre className="max-h-64 overflow-auto text-[11px] leading-relaxed">
                        {formatJsonBlock(selectedLogEntry.requestQuery ?? selectedLogEntry.requestBody)}
                      </pre>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className={clsx("text-xs uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Metadata
                      </p>
                      <div className={clsx("mt-2 space-y-1 text-xs", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                        <p>IP: {selectedLogEntry.ipAddress ?? "—"}</p>
                        <p>User Agent: {selectedLogEntry.userAgent ?? "—"}</p>
                        <p>Correlation: {selectedLogEntry.correlationId ?? "—"}</p>
                        <p>Trace: {selectedLogEntry.traceId ?? "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className={clsx("text-xs uppercase tracking-wide", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        Error message
                      </p>
                      <p className={clsx("mt-2 text-xs", mode === 'dark' ? 'text-rose-300' : 'text-rose-500')}>
                        {selectedLogEntry.errorMessage ?? "No error message"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={clsx("mt-4 text-sm", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                  Select any row in the log timeline to inspect the full request and response context.
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
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
        <h1
          className={
            mode === "dark"
              ? "text-lg font-semibold text-slate-100"
              : "text-lg font-semibold text-slate-900"
          }
        >
          Reports & analytics
        </h1>
        <p
          className={
            mode === "dark"
              ? "text-sm text-slate-400"
              : "text-sm text-slate-500"
          }
        >
          Build custom reporting intervals, run comparative analytics, and
          schedule exports.
        </p>
      </div>

      <AdvancedFilters<AnalyticsFilterState>
        filters={filters}
        onChange={setFilters}
        config={[
          {
            id: "range",
            label: "Range",
            type: "select",
            options: [
              { label: "Last 7 days", value: "7d" },
              { label: "Last 30 days", value: "30d" },
              { label: "Last 90 days", value: "90d" },
              { label: "Last year", value: "1y" },
              { label: "Custom", value: "custom" },
            ],
          },
          {
            id: "dateFrom",
            label: "Start date",
            type: "date",
          },
          {
            id: "dateTo",
            label: "End date",
            type: "date",
          },
          {
            id: "schoolId",
            label: "School",
            type: "select",
            options: schools.map((school) => ({
              label: school.name,
              value: school.id,
            })),
          },
          {
            id: "packageId",
            label: "Package",
            type: "select",
            options: packages.map((pkg) => ({
              label: pkg.name,
              value: pkg.id,
            })),
          },
          {
            id: "lifecycle",
            label: "Lifecycle",
            type: "select",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Suspended", value: "SUSPENDED" },
            ],
          },
          {
            id: "country",
            label: "Country",
            type: "search",
            placeholder: "Filter by country",
          },
          {
            id: "state",
            label: "State / Province",
            type: "search",
            placeholder: "Filter by state",
          },
          {
            id: "city",
            label: "City",
            type: "search",
            placeholder: "Filter by city",
          },
        ]}
        className={
          mode === "dark"
            ? "rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
            : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        }
      />
      <div
        className={
          mode === "dark"
            ? "rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-sm"
            : "rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        }
      >
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          {SECTION_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx("rounded-full px-4 py-2 text-sm font-medium transition", isActive ? "bg-indigo-600 text-white shadow" : (mode === 'dark' ? "bg-slate-800 text-white hover:bg-slate-700" : "text-slate-600 hover:bg-white/60"))}
                aria-pressed={isActive}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">{renderSectionContent()}</div>
    </div>
  );
};

export default ReportsAnalytics;
