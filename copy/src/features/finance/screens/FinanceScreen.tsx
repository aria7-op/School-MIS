import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FinanceTab, FinanceFilters } from "../types/finance";
import DateRangeSelector from "../../parentPortal/components/DateRangeSelector";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import {
  shamsiYearRangeToGregorian,
  getCurrentShamsiYear,
} from "../../../utils/shamsi";

import {
  usePayments,
  useExpenses,
  usePayrolls,
  useFinanceStats,
  useUpdateExpense,
  useDeleteExpense,
  useUpdatePayroll,
  useDeletePayroll,
} from "../services/financeService";
import { useAuth } from "../../../contexts/AuthContext";

// Components
import FinanceHeader from "../components/FinanceHeader";
import SegmentedControl from "../components/SegmentedControl";
import EmptyState from "../components/EmptyState";
import FloatingActionButton from "../components/FloatingActionButton";
import AddPaymentModal from "../components/AddPaymentModal";
import AddExpenseModal from "../components/AddExpenseModal";
import AddPayrollModal from "../components/AddPayrollModal";
import ExpensesList from "../components/ExpensesList";
import PayrollList from "../components/PayrollList";
import ClassMonthBillingTab from "../components/ClassMonthBillingTab";

// money formatting utility
const formatMoney = (amount: number | string | undefined): string => {
  const num = Number(amount) || 0;
  return `AFN ${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const FinanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { managedContext, user } = useAuth();

  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showAllPaymentsModal, setShowAllPaymentsModal] = useState(false);
  const [scopeMode, setScopeMode] = useState<"active" | "all">("active");

  //  state variables for Payments tab
  const [paymentsSearchText, setPaymentsSearchText] = useState<string>("");
  const [paymentsViewMode, setPaymentsViewMode] = useState<
    "dashboard" | "table" | "list"
  >("dashboard");
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<
    "all" | "completed" | "pending" | "cancelled"
  >("all");
  const [paymentsMethodFilter, setPaymentsMethodFilter] =
    useState<string>("all");
  const [paymentsSortBy, setPaymentsSortBy] = useState<
    "date" | "amount" | "student"
  >("date");
  const [paymentsSortOrder, setPaymentsSortOrder] = useState<"asc" | "desc">(
    "desc"
  );

  // Initialize date range to a specific Shamsi year (1404)
  const DEFAULT_SHAMSI_YEAR = 1404;
  const getDefaultYearDateRange = () => {
    const { startISO, endISO } =
      shamsiYearRangeToGregorian(DEFAULT_SHAMSI_YEAR);
    return { startDate: startISO, endDate: endISO };
  };

  // Date range filtering state - set to Shamsi 1404 by default
  const [dateRange, setDateRange] = useState(() => getDefaultYearDateRange());

  // Track Persian year; start at 1404 so UI shows 1404 range
  const [currentPersianYear, setCurrentPersianYear] =
    useState<number>(DEFAULT_SHAMSI_YEAR);

  // Update date range when Persian year changes (e.g., when Hamal 1 arrives)
  // Optionally auto-sync to current Shamsi year; keep disabled to lock 1404 range
  // To re-enable, set AUTO_SYNC_YEAR to true
  const AUTO_SYNC_YEAR = false;
  const normalizeScopeId = useCallback((value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    try {
      const str = String(value).trim();
      return str.length ? str : null;
    } catch {
      return null;
    }
  }, []);

  const getManagedEntityName = useCallback(
    (type: "school" | "branch" | "course", value?: string | number | null) => {
      const normalizedId = normalizeScopeId(value);
      if (!normalizedId) return null;
      const managedEntities = user?.managedEntities;
      const collection = Array.isArray(
        type === "school"
          ? managedEntities?.schools
          : type === "branch"
          ? managedEntities?.branches
          : managedEntities?.courses
      )
        ? (type === "school"
            ? managedEntities?.schools
            : type === "branch"
            ? managedEntities?.branches
            : managedEntities?.courses) ?? []
        : [];

      const match = collection.find((entry: any) => {
        return (
          normalizeScopeId(entry?.id) === normalizedId ||
          normalizeScopeId(entry?.uuid) === normalizedId ||
          normalizeScopeId(entry?.code) === normalizedId ||
          normalizeScopeId(entry?.branchId) === normalizedId ||
          normalizeScopeId(entry?.courseId) === normalizedId
        );
      });

      if (!match) {
        return normalizedId;
      }

      return (
        match?.name ||
        match?.title ||
        match?.displayName ||
        match?.label ||
        normalizedId
      );
    },
    [normalizeScopeId, user?.managedEntities]
  );

  useEffect(() => {
    if (!AUTO_SYNC_YEAR) return;
    const checkYearChange = () => {
      const todayPersianYear = getCurrentShamsiYear();
      if (todayPersianYear !== currentPersianYear) {
        setCurrentPersianYear(todayPersianYear);
        const newRange = shamsiYearRangeToGregorian(todayPersianYear);
        setDateRange({
          startDate: newRange.startISO,
          endDate: newRange.endISO,
        });
      }
    };
    checkYearChange();
    const interval = setInterval(checkYearChange, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentPersianYear]);

  // Create filters object for API calls
  const baseFilters = useMemo<FinanceFilters>(() => {
    return {
      dateRange:
        dateRange.startDate && dateRange.endDate
          ? {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            }
          : undefined,
    };
  }, [dateRange]);

  const scopeSignature = useMemo(
    () =>
      JSON.stringify({
        schoolId: managedContext?.schoolId ?? null,
        branchId: managedContext?.branchId ?? null,
        courseId: managedContext?.courseId ?? null,
        mode: scopeMode,
      }),
    [
      managedContext?.branchId,
      managedContext?.courseId,
      managedContext?.schoolId,
      scopeMode,
    ]
  );

  const scopeFilters = useMemo<FinanceFilters>(() => {
    const scoped: FinanceFilters = {
      scopeKey: scopeSignature,
      scopeMode,
    };

    if (scopeMode === "all") {
      return scoped;
    }

    if (managedContext?.schoolId) {
      scoped.schoolId = managedContext.schoolId;
    }
    if (managedContext?.branchId) {
      scoped.branchId = managedContext.branchId;
    }
    if (managedContext?.courseId) {
      scoped.courseId = managedContext.courseId;
    }
    return scoped;
  }, [
    managedContext?.branchId,
    managedContext?.courseId,
    managedContext?.schoolId,
    scopeMode,
    scopeSignature,
  ]);

  const combinedFilters = useMemo<FinanceFilters>(
    () => ({
      ...baseFilters,
      ...scopeFilters,
    }),
    [baseFilters, scopeFilters]
  );

  const handleScopeModeChange = useCallback((mode: "active" | "all") => {
    setScopeMode(mode);
  }, []);

  const activeScopeBadges = useMemo(() => {
    const badges: { label: string; value: string }[] = [];
    if (managedContext?.schoolId) {
      badges.push({
        label: t("finance.scope.school", "School"),
        value:
          getManagedEntityName("school", managedContext.schoolId) ??
          String(managedContext.schoolId),
      });
    }
    if (managedContext?.branchId) {
      badges.push({
        label: t("finance.scope.branch", "Branch"),
        value:
          getManagedEntityName("branch", managedContext.branchId) ??
          String(managedContext.branchId),
      });
    }
    if (managedContext?.courseId) {
      badges.push({
        label: t("finance.scope.course", "Course"),
        value:
          getManagedEntityName("course", managedContext.courseId) ??
          String(managedContext.courseId),
      });
    }
    if (!badges.length) {
      badges.push({
        label: t("finance.scope.scopeLabel", "Scope"),
        value: t("finance.scope.allManaged", "All managed schools"),
      });
    }
    return badges;
  }, [
    getManagedEntityName,
    managedContext?.branchId,
    managedContext?.courseId,
    managedContext?.schoolId,
    t,
  ]);

  const getRecordScopeMeta = useCallback(
    (record: any) => {
      const branchId =
        normalizeScopeId(record?.branchId) ??
        normalizeScopeId(record?.student?.class?.branchId) ??
        normalizeScopeId(record?.class?.branchId) ??
        normalizeScopeId(record?.staff?.branchId) ??
        null;

      if (branchId) {
        return {
          key: `branch:${branchId}`,
          label:
            getManagedEntityName("branch", branchId) ??
            t("finance.scope.unknownBranch", {
              defaultValue: "Branch {{id}}",
              id: branchId,
            }),
          type: "branch" as const,
        };
      }

      const schoolId =
        normalizeScopeId(record?.schoolId) ??
        normalizeScopeId(record?.student?.schoolId) ??
        normalizeScopeId(record?.school?.id) ??
        null;

      if (schoolId) {
        return {
          key: `school:${schoolId}`,
          label:
            getManagedEntityName("school", schoolId) ??
            t("finance.scope.unknownSchool", {
              defaultValue: "School {{id}}",
              id: schoolId,
            }),
          type: "school" as const,
        };
      }

      return null;
    },
    [getManagedEntityName, normalizeScopeId, t]
  );

  // Fetch data with date filters
  const [paymentsPage, setPaymentsPage] = useState<number>(1);
  const paymentsPerPage = 10;

  const paymentsFilters = useMemo(
    () => ({
      ...combinedFilters,
      page: paymentsPage,
      limit: paymentsPerPage,
    }),
    [combinedFilters, paymentsPage, paymentsPerPage]
  );

  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = usePayments(paymentsFilters);
  const {
    data: expensesData,
    isLoading: expensesLoading,
    error: expensesError,
  } = useExpenses(combinedFilters);
  const {
    data: payrollsData,
    isLoading: payrollsLoading,
    error: payrollsError,
  } = usePayrolls(combinedFilters);
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useFinanceStats(combinedFilters);

  // Mutation hooks
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const updatePayrollMutation = useUpdatePayroll();
  const deletePayrollMutation = useDeletePayroll();

  // Extract arrays from responses safely (handle nested/meta structures)
  const allPaymentsArr: any[] = Array.isArray((paymentsData as any)?.data)
    ? (paymentsData as any).data
    : Array.isArray(paymentsData as any)
    ? (paymentsData as any)
    : [];
  const paymentsTotalPages = Number((paymentsData as any)?.totalPages || 1);
  const allExpensesArr: any[] = Array.isArray((expensesData as any)?.data)
    ? (expensesData as any).data
    : Array.isArray(expensesData as any)
    ? (expensesData as any)
    : [];
  const allPayrollsArr: any[] = Array.isArray((payrollsData as any)?.data)
    ? (payrollsData as any).data
    : Array.isArray(payrollsData as any)
    ? (payrollsData as any)
    : [];

  // Client-side date filtering (in case API doesn't support it)
  const payments = useMemo<any[]>(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return allPaymentsArr;
    }

    return allPaymentsArr.filter((payment: any) => {
      const paymentDate = new Date(
        payment.paymentDate || payment.date || payment.createdAt
      );
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }, [allPaymentsArr, dateRange]);

  const expenses = useMemo<any[]>(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return allExpensesArr;
    }

    const filtered = allExpensesArr.filter((expense: any) => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      const isInRange = expenseDate >= startDate && expenseDate <= endDate;

      // console.log("🔍 Expense filtering:", {
      //   expense: expense.id,
      //   expenseDate: expense.date || expense.createdAt,
      //   startDate: dateRange.startDate,
      //   endDate: dateRange.endDate,
      //   isInRange,
      // });

      return isInRange;
    });

    // console.log(
    //   "🔍 Filtered expenses:",
    //   filtered.length,
    //   "out of",
    //   allExpensesArr.length
    // );
    return filtered;
  }, [allExpensesArr, dateRange]);

  const payrolls = useMemo<any[]>(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return allPayrollsArr;
    }

    const filtered = allPayrollsArr.filter((payroll: any) => {
      const payrollDate = new Date(payroll.paymentDate || payroll.createdAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      const isInRange = payrollDate >= startDate && payrollDate <= endDate;

      // console.log("🔍 Payroll filtering:", {
      //   payroll: payroll.id,
      //   payrollDate: payroll.paymentDate || payroll.createdAt,
      //   startDate: dateRange.startDate,
      //   endDate: dateRange.endDate,
      //   isInRange,
      // });

      return isInRange;
    });

    // console.log(
    //   "🔍 Filtered payrolls:",
    //   filtered.length,
    //   "out of",
    //   allPayrollsArr.length
    // );
    return filtered;
  }, [allPayrollsArr, dateRange]);

  // Calculate stats from raw data if API stats are not available
  const calculatedStats = useMemo(() => {
    const totalPayments = payments.reduce((sum, payment) => {
      // Try multiple possible field names and data types for payment amount
      let amount = 0;

      // Check for numeric fields
      const numericFields = [
        "total",
        "amount",
        "paymentAmount",
        "value",
        "sum",
        "totalAmount",
      ];
      for (const field of numericFields) {
        if (payment[field] !== undefined && payment[field] !== null) {
          amount = Number(payment[field]) || 0;
          if (amount > 0) break;
        }
      }

      // If no numeric field found, try to extract from any field that might contain a number
      if (amount === 0) {
        Object.values(payment).forEach((value) => {
          if (typeof value === "number" && value > 0) {
            amount = value;
          } else if (
            typeof value === "string" &&
            !isNaN(Number(value)) &&
            Number(value) > 0
          ) {
            amount = Number(value);
          }
        });
      }

      return sum + amount;
    }, 0);

    const totalExpenses = expenses.reduce((sum, expense) => {
      // Try multiple possible field names and data types for expense amount
      let amount = 0;

      // Check for numeric fields
      const numericFields = [
        "amount",
        "total",
        "expenseAmount",
        "cost",
        "value",
        "sum",
        "totalAmount",
      ];
      for (const field of numericFields) {
        if (expense[field] !== undefined && expense[field] !== null) {
          amount = Number(expense[field]) || 0;
          if (amount > 0) break;
        }
      }

      // If no numeric field found, try to extract from any field that might contain a number
      if (amount === 0) {
        Object.values(expense).forEach((value) => {
          if (typeof value === "number" && value > 0) {
            amount = value;
          } else if (
            typeof value === "string" &&
            !isNaN(Number(value)) &&
            Number(value) > 0
          ) {
            amount = Number(value);
          }
        });
      }

      return sum + amount;
    }, 0);

    const totalPayroll = payrolls.reduce((sum, payroll) => {
      // Try multiple possible field names and data types for payroll amount
      let amount = 0;

      // Check for numeric fields
      const numericFields = [
        "netSalary",
        "amount",
        "total",
        "salary",
        "totalAmount",
        "payrollAmount",
        "grossSalary",
        "value",
        "sum",
      ];
      for (const field of numericFields) {
        if (payroll[field] !== undefined && payroll[field] !== null) {
          amount = Number(payroll[field]) || 0;
          if (amount > 0) break;
        }
      }

      // If no numeric field found, try to extract from any field that might contain a number
      if (amount === 0) {
        Object.values(payroll).forEach((value) => {
          if (typeof value === "number" && value > 0) {
            amount = value;
          } else if (
            typeof value === "string" &&
            !isNaN(Number(value)) &&
            Number(value) > 0
          ) {
            amount = Number(value);
          }
        });
      }

      return sum + amount;
    }, 0);

    const netIncome = totalPayments - totalExpenses - totalPayroll;

    return {
      totalPayments,
      totalExpenses,
      totalPayroll,
      netIncome,
    };
  }, [payments, expenses, payrolls]);

  interface ScopeStat {
    key: string;
    label: string;
    type: "branch" | "school";
    paymentsAmount: number;
    expensesAmount: number;
    payrollAmount: number;
    net: number;
    paymentCount: number;
  }

  const perScopeStats: ScopeStat[] = useMemo(() => {
    if (scopeMode !== "all") {
      return [];
    }

    const map = new Map<string, ScopeStat>();

    const ensureEntry = (
      meta: ReturnType<typeof getRecordScopeMeta> | null | undefined
    ) => {
      if (!meta) return null;
      if (!map.has(meta.key)) {
        map.set(meta.key, {
          key: meta.key,
          label: meta.label,
          type: meta.type,
          paymentsAmount: 0,
          expensesAmount: 0,
          payrollAmount: 0,
          net: 0,
          paymentCount: 0,
        });
      }
      return map.get(meta.key)!;
    };

    const preloadManagedEntries = () => {
      const branchAssignments = Array.isArray(user?.managedEntities?.branches)
        ? user?.managedEntities?.branches
        : [];
      const schoolAssignments = Array.isArray(user?.managedEntities?.schools)
        ? user?.managedEntities?.schools
        : [];

      branchAssignments.forEach((assignment: any) => {
        const branchRef = assignment?.branch ?? assignment;
        const branchId =
          normalizeScopeId(branchRef?.id) ??
          normalizeScopeId(branchRef?.branchId) ??
          normalizeScopeId(branchRef?.uuid);
        if (!branchId) return;
        ensureEntry({
          key: `branch:${branchId}`,
          label:
            getManagedEntityName("branch", branchId) ??
            formatText(branchRef?.name, branchId),
          type: "branch",
        });
      });

      if (!branchAssignments.length) {
        schoolAssignments.forEach((school: any) => {
          const schoolId =
            normalizeScopeId(school?.id) ??
            normalizeScopeId(school?.uuid) ??
            normalizeScopeId(school?.code);
          if (!schoolId) return;
          ensureEntry({
            key: `school:${schoolId}`,
            label:
              getManagedEntityName("school", schoolId) ??
              formatText(school?.name, schoolId),
            type: "school",
          });
        });
      }
    };

    preloadManagedEntries();

    const addAmount = (
      meta: ReturnType<typeof getRecordScopeMeta>,
      field: "paymentsAmount" | "expensesAmount" | "payrollAmount",
      amount: number,
      isPaymentCount = false
    ) => {
      if (!meta) return;
      const entry = ensureEntry(meta);
      if (!entry) return;
      entry[field] += amount;
      entry.net =
        entry.paymentsAmount - entry.expensesAmount - entry.payrollAmount;
      if (isPaymentCount) {
        entry.paymentCount += 1;
      }
    };

    payments.forEach((payment) => {
      const meta = getRecordScopeMeta(payment);
      const amount = Number(
        payment.total ??
          payment.amount ??
          payment.paymentAmount ??
          payment.value ??
          0
      );
      addAmount(meta, "paymentsAmount", amount, true);
    });

    expenses.forEach((expense) => {
      const meta = getRecordScopeMeta(expense);
      const amount = Number(
        expense.amount ??
          expense.total ??
          expense.expenseAmount ??
          expense.value ??
          0
      );
      addAmount(meta, "expensesAmount", amount, false);
    });

    payrolls.forEach((payroll) => {
      const meta = getRecordScopeMeta(payroll);
      const amount = Number(
        payroll.netSalary ??
          payroll.amount ??
          payroll.total ??
          payroll.payrollAmount ??
          0
      );
      addAmount(meta, "payrollAmount", amount, false);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.paymentsAmount !== a.paymentsAmount) {
        return b.paymentsAmount - a.paymentsAmount;
      }
      if (a.type !== b.type) {
        return a.type === "branch" ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  }, [
    expenses,
    getRecordScopeMeta,
    payrolls,
    payments,
    scopeMode,
    user?.managedEntities?.branches,
    user?.managedEntities?.schools,
    normalizeScopeId,
    getManagedEntityName,
  ]);

  // Advance statistics for overview
  const advancedStats = useMemo(() => {
    // Cash Flow Metrics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthPayments = payments.filter((p) => {
      const date = new Date(p.paymentDate || p.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const lastMonthPayments = payments.filter((p) => {
      const date = new Date(p.paymentDate || p.date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === lastMonth && date.getFullYear() === year;
    });

    // Growth Calculations
    const thisMonthRevenue = thisMonthPayments.reduce(
      (sum, p) => sum + (Number(p.total || p.amount) || 0),
      0
    );
    const lastMonthRevenue = lastMonthPayments.reduce(
      (sum, p) => sum + (Number(p.total || p.amount) || 0),
      0
    );

    const monthlyGrowthRate =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Efficiency Metrics
    const totalStudents = new Set(payments.map((p) => p.studentId)).size;
    const revenuePerStudent =
      totalStudents > 0 ? calculatedStats.totalPayments / totalStudents : 0;

    // Collection Efficiency
    const completedPayments = payments.filter(
      (p) => p.status === "completed" || p.status === "paid"
    ).length;
    const collectionRate =
      payments.length > 0 ? (completedPayments / payments.length) * 100 : 0;

    // Expense Categories Analysis
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Outstanding/Pending Analysis
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const totalOutstanding = pendingPayments.reduce(
      (sum, p) => sum + (Number(p.total || p.amount) || 0),
      0
    );

    // Profitability Margins
    const grossProfit =
      calculatedStats.totalPayments - calculatedStats.totalExpenses * 0.6; // Assuming 60% are direct costs
    const grossMargin =
      calculatedStats.totalPayments > 0
        ? (grossProfit / calculatedStats.totalPayments) * 100
        : 0;

    const operatingProfit =
      calculatedStats.totalPayments -
      calculatedStats.totalExpenses -
      calculatedStats.totalPayroll;
    const operatingMargin =
      calculatedStats.totalPayments > 0
        ? (operatingProfit / calculatedStats.totalPayments) * 100
        : 0;

    // Daily Average Calculations
    const dateRangeDays =
      dateRange.startDate && dateRange.endDate
        ? Math.ceil(
            (new Date(dateRange.endDate).getTime() -
              new Date(dateRange.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 30;

    const dailyAverageRevenue =
      dateRangeDays > 0 ? calculatedStats.totalPayments / dateRangeDays : 0;
    const dailyAverageExpense =
      dateRangeDays > 0
        ? (calculatedStats.totalExpenses + calculatedStats.totalPayroll) /
          dateRangeDays
        : 0;

    // Cash Burn Rate (for negative cash flow)
    const monthlyBurnRate =
      calculatedStats.netIncome < 0
        ? Math.abs(calculatedStats.netIncome / 12)
        : 0;

    return {
      monthlyGrowthRate,
      thisMonthRevenue,
      lastMonthRevenue,
      revenuePerStudent,
      totalStudents,
      collectionRate,
      expensesByCategory,
      totalOutstanding,
      pendingCount: pendingPayments.length,
      grossMargin,
      operatingMargin,
      dailyAverageRevenue,
      dailyAverageExpense,
      monthlyBurnRate,
      dateRangeDays,
    };
  }, [payments, expenses, calculatedStats, dateRange]);

  // Always use calculated stats when we have data, as they are more reliable
  const finalStats = useMemo(() => {
    // If we have any data (payments, expenses, or payrolls), use calculated stats
    if (payments.length > 0 || expenses.length > 0 || payrolls.length > 0) {
      // console.log("🔍 Using calculated stats (we have data):", calculatedStats);
      return calculatedStats;
    }

    // Only use API stats if we have no data at all
    // console.log("🔍 Using API stats (no data):", stats);
    return stats || calculatedStats;
  }, [
    stats,
    calculatedStats,
    (payments as any[]).length,
    (expenses as any[]).length,
    (payrolls as any[]).length,
  ]);

  // Debug logging to see what stats are being used
  // console.log("🔍 API Stats:", stats);
  // console.log("🔍 Calculated Stats:", calculatedStats);
  // console.log("🔍 Final Stats being used:", finalStats);

  // Debug data structures
  if (allExpensesArr.length > 0) {
    // console.log("🔍 Sample expense structure:", allExpensesArr[0]);
    // console.log(
    //   "🔍 Expense date fields:",
    //   Object.keys(allExpensesArr[0]).filter(
    //     (key) => key.includes("date") || key.includes("Date")
    //   )
    // );
  }

  if (allPayrollsArr.length > 0) {
    // console.log("🔍 Sample payroll structure:", allPayrollsArr[0]);
    // console.log(
    //   "🔍 Payroll date fields:",
    //   Object.keys(allPayrollsArr[0]).filter(
    //     (key) => key.includes("date") || key.includes("Date")
    //   )
    // );
  }

  // Check if we have any data
  const hasData =
    payments.length > 0 || expenses.length > 0 || payrolls.length > 0;
  const isLoading =
    paymentsLoading || expensesLoading || payrollsLoading || statsLoading;

  const handleSearch = (query: string) => {
    // Implement search functionality
  };

  const handleFilter = () => {
    // Implement filter functionality
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    // console.log("🔍 Date range changed:", { startDate, endDate });
    // console.log("🔍 All payments before filter:", allPaymentsArr.length);
    // console.log("🔍 All expenses before filter:", allExpensesArr.length);
    // console.log("🔍 All payrolls before filter:", allPayrollsArr.length);

    // Clamp selection to current Persian year
    const { startISO: yearStart, endISO: yearEnd } =
      shamsiYearRangeToGregorian(currentPersianYear);
    const s = new Date(startDate);
    const e = new Date(endDate);
    const min = new Date(yearStart);
    const max = new Date(yearEnd);

    const clampedStart = s < min ? min : s > max ? min : s; // if outside, snap to min
    const clampedEnd = e > max ? max : e < min ? max : e; // if outside, snap to max

    setDateRange({
      startDate: clampedStart.toISOString().split("T")[0],
      endDate: clampedEnd.toISOString().split("T")[0],
    });
  };

  const clearDateFilter = () => {
    // Reset to default Shamsi year (1404)
    const defaultRange = getDefaultYearDateRange();
    setDateRange(defaultRange);
    setCurrentPersianYear(DEFAULT_SHAMSI_YEAR);
  };

  // Helpers to safely format dates and numbers from API
  const getNumeric = (val: any): number => {
    if (typeof val === "number") return val;
    if (val && Array.isArray(val.d) && val.d.length > 0)
      return Number(val.d[0]);
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const formatLocalDate = (val: any, fallback?: any): string => {
    const parse = (v: any): Date | null => {
      if (!v) return null;
      if (typeof v === "string" && !isNaN(Date.parse(v))) return new Date(v);
      if (typeof v === "object") {
        const inner = (v as any).date || (v as any).value || undefined;
        if (inner && !isNaN(Date.parse(inner))) return new Date(inner);
      }
      return null;
    };
    const d = parse(val) || parse(fallback) || new Date();
    return d.toLocaleDateString();
    const formattedDate = d.toLocaleDateString();
  };

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Search filter
      const studentName = `${payment.student?.firstName || ""} ${
        payment.student?.lastName || ""
      }`.toLowerCase();
      const matchesSearch =
        studentName.includes(paymentsSearchText.toLowerCase()) ||
        (payment.description?.toLowerCase() || "").includes(
          paymentsSearchText.toLowerCase()
        ) ||
        (payment.remarks?.toLowerCase() || "").includes(
          paymentsSearchText.toLowerCase()
        );

      // Status filter
      const paymentStatus = payment.status?.toLowerCase() || "completed";
      const matchesStatus =
        paymentsStatusFilter === "all" ||
        paymentStatus === paymentsStatusFilter;

      // Method filter
      const matchesMethod =
        paymentsMethodFilter === "all" ||
        payment.method === paymentsMethodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [
    payments,
    paymentsSearchText,
    paymentsStatusFilter,
    paymentsMethodFilter,
  ]);

  // Sort payments
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      let comparison = 0;

      switch (paymentsSortBy) {
        case "date":
          const dateA = new Date(a.paymentDate || a.date || a.createdAt);
          const dateB = new Date(b.paymentDate || b.date || b.createdAt);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case "amount":
          const amountA = Number(a.total || a.amount || 0);
          const amountB = Number(b.total || b.amount || 0);
          comparison = amountA - amountB;
          break;
        case "student":
          const nameA = `${a.student?.firstName || ""} ${
            a.student?.lastName || ""
          }`;
          const nameB = `${b.student?.firstName || ""} ${
            b.student?.lastName || ""
          }`;
          comparison = nameA.localeCompare(nameB);
          break;
      }

      return paymentsSortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredPayments, paymentsSortBy, paymentsSortOrder]);

  // Get unique payment methods for filter
  const paymentMethods = useMemo(() => {
    const methods = new Set(payments.map((p) => p.method || "cash"));
    return ["all", ...Array.from(methods)];
  }, [payments]);

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setPaymentsPage(1);
  }, [
    paymentsSearchText,
    paymentsStatusFilter,
    paymentsMethodFilter,
    paymentsSortBy,
    paymentsSortOrder,
    paymentsViewMode,
    dateRange,
    scopeMode,
    scopeSignature,
  ]);

  const totalPaymentPages = paymentsTotalPages || 1;
  const paginatedPayments = sortedPayments; // server-side pagination already applied

  const renderPaymentsPagination = () =>
    totalPaymentPages > 1 ? (
      <div className="flex items-center justify-center gap-2 p-4">
        <button
          onClick={() => setPaymentsPage(Math.max(1, paymentsPage - 1))}
          className={`px-3 py-1 rounded border ${
            paymentsPage === 1
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
          disabled={paymentsPage === 1}
        >
          {t("finance.payment.prev")}
        </button>
        {Array.from({ length: totalPaymentPages }, (_, i) => i + 1)
          .slice(
            Math.max(0, paymentsPage - 3),
            Math.max(0, paymentsPage - 3) + 5
          )
          .map((n) => (
            <button
              key={n}
              onClick={() => setPaymentsPage(n)}
              className={`px-3 py-1 rounded border ${
                n === paymentsPage
                  ? "bg-purple-600 text-white border-purple-600"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {n}
            </button>
          ))}
        <button
          onClick={() =>
            setPaymentsPage(Math.min(totalPaymentPages, paymentsPage + 1))
          }
          className={`px-3 py-1 rounded border ${
            paymentsPage === totalPaymentPages
              ? "text-gray-400 border-gray-200 cursor-not-allowed"
              : "text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
          disabled={paymentsPage === totalPaymentPages}
        >
          {t("finance.payment.next")}
        </button>
      </div>
    ) : null;

  // Payment bill printing utilities (reuse style from AddPayment)
  const openBillPrintWindow = (contentHtml: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(contentHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  const generatePaymentBillHTML = (p: any) => {
    const formatCurrency = (amount: number) =>
      `AFN ${Number(amount || 0).toLocaleString()}`;
    const formatDate = (dateString: string) =>
      new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    const first = p?.student?.user?.firstName || p?.student?.firstName || "";
    const last = p?.student?.user?.lastName || p?.student?.lastName || "";
    const studentName = `${first} ${last}`.trim() || "Student";
    const className = `${
      p?.student?.class?.name ||
      p?.student?.className ||
      p?.student?.section?.name ||
      ""
    } ${p?.student?.class?.code || ""}`.trim();
    const toNum = (v: any) =>
      typeof v === "number"
        ? v
        : (v && Array.isArray(v.d) ? v.d[0] : Number(v)) || 0;
    const totalFees = toNum(p?.total || p?.amount || 0);
    const paidAmount = toNum(p?.amount || p?.total || 0);
    const discount = toNum(p?.discount || 0);
    const remaining = totalFees - (paidAmount + discount);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Payment Bill</title>
<style>
*{box-sizing:border-box}body{font-family:Arial, sans-serif; color:#000}
.container{width:7.6in; margin:0 auto; padding:0.4in}
.header{text-align:center; margin-bottom:12px}
.table{width:100%; border-collapse:collapse; font-size:14px}
.table th,.table td{border:1px solid #000; padding:6px; text-align:left; white-space:nowrap}
.row{display:flex; justify-content:space-between; font-size:14px; margin:6px 0}
.footer{text-align:center; margin-top:12px; font-size:12px}
@page{size:7.8in 10.11in; margin:0}
@media print{button{display:none}}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h3 style="margin:0">Kawish Educational Complex</h3>
    <div style="margin-top:4px">Student Payment Bill</div>
    <div style="margin-top:4px; font-size:12px">Receipt #: ${
      p?.transactionId || p?.receiptNumber || "N/A"
    }</div>
  </div>
  <div class="row"><div>Student ID: <strong>${
    p?.studentId || "-"
  }</strong></div><div>Date: <strong>${formatDate(
      p?.paymentDate
    )}</strong></div></div>
  <div class="row"><div>Student Name: <strong>${studentName}</strong></div><div>Class: <strong>${
      className || "-"
    }</strong></div></div>
  <br/>
  <table class="table">
    <tr><th>Total Fees</th><th>Paid Amount</th><th>Discount</th></tr>
    <tr><td>${formatCurrency(totalFees)}</td><td>${formatCurrency(
      paidAmount
    )}</td><td>${formatCurrency(discount)}</td></tr>
    <tr><th>Remaining Dues</th><th colspan="2">Total Due = ${formatCurrency(
      remaining
    )}</th></tr>
    <tr><td>${formatCurrency(
      remaining
    )}</td><th colspan="2">Total Paid = ${formatCurrency(paidAmount)}</th></tr>
  </table>
  <p style="text-align:center; margin:12px 0;">${formatCurrency(
    paidAmount
  )} paid by ${studentName}${
      className ? ` for class ${className}` : ""
    }, on ${formatDate(p?.paymentDate)}</p>
  <div class="row" style="margin-top:20px">
    <div style="text-align:center; width:45%"><hr/><div><strong>Received By</strong></div><div>Admin User</div></div>
    <div style="text-align:center; width:45%"><hr/><div><strong>Manager</strong></div><div>Finance</div></div>
  </div>
  <div class="footer">
    <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
    <div>Email: --- , Phone: 0730774777</div>
    <div style="margin-top:4px">Thank you for your payment. The paid fee is not refundable.</div>
  </div>
</div>
</body></html>`;
  };

  const handlePrintPayment = (payment: any) => {
    const html = generatePaymentBillHTML(payment);
    openBillPrintWindow(html);
  };

  const handleExport = async () => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();

      // Create Summary sheet
      const summarySheet = workbook.addWorksheet("📊 Summary");

      // Add summary data
      summarySheet.addRow(["📊 FINANCIAL REPORT"]);
      summarySheet.addRow([]);
      summarySheet.addRow(["Generated On:", new Date().toLocaleString()]);
      summarySheet.addRow([
        "Date Range:",
        dateRange.startDate && dateRange.endDate
          ? `${dateRange.startDate} to ${dateRange.endDate}`
          : "All Time",
      ]);
      summarySheet.addRow([]);
      summarySheet.addRow(["Financial Summary"]);
      summarySheet.addRow([
        "Total Revenue",
        `AFN${((finalStats?.totalPayments || 0) / 1000).toFixed(1)}K`,
      ]);
      summarySheet.addRow([
        "Total Expenses",
        `AFN${((finalStats?.totalExpenses || 0) / 1000).toFixed(1)}K`,
      ]);
      summarySheet.addRow([
        "Total Payroll",
        `AFN${((finalStats?.totalPayroll || 0) / 1000).toFixed(1)}K`,
      ]);
      summarySheet.addRow([
        "Net Income",
        `AFN${((finalStats?.netIncome || 0) / 1000).toFixed(1)}K`,
      ]);
      summarySheet.addRow([]);
      summarySheet.addRow(["Counts"]);
      summarySheet.addRow(["Payments", payments.length]);
      summarySheet.addRow(["Expenses", expenses.length]);
      summarySheet.addRow(["Payroll Records", payrolls.length]);

      // Set column widths
      summarySheet.columns = [{ width: 25 }, { width: 15 }];

      // Merge title cells
      summarySheet.mergeCells("A1:B1");

      // Style title - GREEN BACKGROUND
      const titleCell = summarySheet.getCell("A1");
      titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF22C55E" }, // Green background
      };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      // Style section headers
      const financialSummaryCell = summarySheet.getCell("A6");
      financialSummaryCell.font = {
        bold: true,
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      financialSummaryCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8B5CF6" },
      };

      const countsCell = summarySheet.getCell("A12");
      countsCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      countsCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8B5CF6" },
      };

      // Create Payments sheet
      const paymentsSheet = workbook.addWorksheet("💳 Payments");

      // Add headers
      paymentsSheet.addRow([
        "Date",
        "Student Name",
        "Amount",
        "Status",
        "Method",
        "Description",
      ]);

      // Add data
      payments.forEach((payment) => {
        paymentsSheet.addRow([
          payment.paymentDate || payment.date || payment.createdAt,
          payment.student
            ? `${payment.student.firstName} ${payment.student.lastName}`
            : "N/A",
          payment.total || payment.amount || 0,
          payment.status,
          payment.method,
          payment.remarks || "",
        ]);
      });

      // Set column widths
      paymentsSheet.columns = [
        { width: 20 },
        { width: 25 },
        { width: 15 },
        { width: 12 },
        { width: 12 },
        { width: 30 },
      ];

      // Style headers - GREEN BACKGROUND
      const paymentsHeaderRow = paymentsSheet.getRow(1);
      paymentsHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF22C55E" }, // Green background
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add autofilter
      paymentsSheet.autoFilter = {
        from: "A1",
        to: `F${paymentsSheet.rowCount}`,
      };

      // Freeze header row
      paymentsSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // Format date and amount columns
      for (let i = 2; i <= paymentsSheet.rowCount; i++) {
        const dateCell = paymentsSheet.getCell(`A${i}`);
        dateCell.numFmt = "yyyy-mm-dd";

        const amountCell = paymentsSheet.getCell(`C${i}`);
        amountCell.numFmt = "#,##0.00";
      }

      // Create Expenses sheet
      const expensesSheet = workbook.addWorksheet("💰 Expenses");

      // Add headers
      expensesSheet.addRow([
        "Date",
        "Category",
        "Amount",
        "Description",
        "Status",
      ]);

      // Add data
      expenses.forEach((expense) => {
        expensesSheet.addRow([
          expense.date || expense.createdAt,
          expense.category,
          expense.amount,
          expense.description || expense.remarks || "",
          expense.status,
        ]);
      });

      // Set column widths
      expensesSheet.columns = [
        { width: 20 },
        { width: 18 },
        { width: 14 },
        { width: 40 },
        { width: 14 },
      ];

      // Style headers - GREEN BACKGROUND
      const expensesHeaderRow = expensesSheet.getRow(1);
      expensesHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF22C55E" }, // Green background
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add autofilter
      expensesSheet.autoFilter = {
        from: "A1",
        to: `E${expensesSheet.rowCount}`,
      };

      // Freeze header row
      expensesSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // Format date and amount columns
      for (let i = 2; i <= expensesSheet.rowCount; i++) {
        const dateCell = expensesSheet.getCell(`A${i}`);
        dateCell.numFmt = "yyyy-mm-dd";

        const amountCell = expensesSheet.getCell(`C${i}`);
        amountCell.numFmt = "#,##0.00";
      }

      // Create Payroll sheet
      const payrollSheet = workbook.addWorksheet("👥 Payroll");

      // Add headers
      payrollSheet.addRow([
        "Date",
        "Employee",
        "Basic Salary",
        "Allowances",
        "Deductions",
        "Net Salary",
        "Status",
      ]);

      // Add data
      payrolls.forEach((payroll) => {
        payrollSheet.addRow([
          payroll.paymentDate || payroll.createdAt,
          payroll.employeeName || "N/A",
          payroll.basicSalary || 0,
          payroll.allowances || 0,
          payroll.deductions || 0,
          payroll.netSalary || 0,
          payroll.status,
        ]);
      });

      // Set column widths
      payrollSheet.columns = [
        { width: 20 },
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 12 },
      ];

      // Style headers - GREEN BACKGROUND
      const payrollHeaderRow = payrollSheet.getRow(1);
      payrollHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF22C55E" }, // Green background
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add autofilter
      payrollSheet.autoFilter = {
        from: "A1",
        to: `G${payrollSheet.rowCount}`,
      };

      // Freeze header row
      payrollSheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // Format date and amount columns
      for (let i = 2; i <= payrollSheet.rowCount; i++) {
        const dateCell = payrollSheet.getCell(`A${i}`);
        dateCell.numFmt = "yyyy-mm-dd";

        ["C", "D", "E", "F"].forEach((col) => {
          const cell = payrollSheet.getCell(`${col}${i}`);
          cell.numFmt = "#,##0.00";
        });
      }

      // Generate and download file
      const fileName = `financial-report-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      // console.log("✅ Excel export successful");
    } catch (error) {
      console.error("❌ Excel export failed:", error);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  const handlePrint = () => {
    // Create a print-friendly version of the financial data
    const printWindow = window.open("", "_blank");
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #ddd; padding: 15px; text-align: center; }
            .card h3 { margin: 0 0 10px 0; color: #666; }
            .card .amount { font-size: 24px; font-weight: bold; }
            .section { margin-bottom: 30px; }
            .section h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Financial Report</h1>
            <p>Date Range: ${
              dateRange.startDate && dateRange.endDate
                ? `${new Date(
                    dateRange.startDate
                  ).toLocaleDateString()} - ${new Date(
                    dateRange.endDate
                  ).toLocaleDateString()}`
                : "All Time"
            }</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <div class="card">
              <h3>Total Revenue</h3>
              <div class="amount">AFN${(
                finalStats?.totalPayments || 0
              ).toLocaleString()}</div>
            </div>
            <div class="card">
              <h3>Total Expenses</h3>
              <div class="amount">AFN${(
                finalStats?.totalExpenses || 0
              ).toLocaleString()}</div>
            </div>
            <div class="card">
              <h3>Total Payroll</h3>
              <div class="amount">AFN${(
                finalStats?.totalPayroll || 0
              ).toLocaleString()}</div>
            </div>
            <div class="card">
              <h3>Net Income</h3>
              <div class="amount">AFN${(
                finalStats?.netIncome || 0
              ).toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <h2>Recent Payments (${payments.length} total)</h2>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                ${payments
                  .slice(0, 10)
                  .map(
                    (payment) => `
                  <tr>
                    <td>${payment.student?.firstName} ${
                      payment.student?.lastName || ""
                    }</td>
                    <td>${new Date(
                      payment.paymentDate
                    ).toLocaleDateString()}</td>
                    <td>AFN${(Number(payment.total) || 0).toFixed(0)}</td>
                    <td>${
                      payment.method
                        ? t(
                            `finance.payment.method.${payment.method.toLowerCase()}`
                          )
                        : t("common.na")
                    }</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleTabChange = (tab: string) => {
    // Debug logging
    // console.log("🔍 handleTabChange called with tab:", tab);
    // console.log("🔍 Translated tabs:", {
    //   overview: t("finance.tabs.overview"),
    //   payments: t("finance.tabs.payments"),
    //   expenses: t("finance.tabs.expenses"),
    //   payroll: t("finance.tabs.payroll"),
    //   byClass: t("finance.tabs.byClass"),
    // });

    // Convert display names to internal tab values
    // Check against translated tab names
    if (tab === t("finance.tabs.overview")) {
      // console.log("🔍 Setting active tab to overview");
      setActiveTab("overview");
    } else if (tab === t("finance.tabs.payments")) {
      // console.log("🔍 Setting active tab to payments");
      setActiveTab("payments");
    } else if (tab === t("finance.tabs.expenses")) {
      // console.log("🔍 Setting active tab to expenses");
      setActiveTab("expenses");
    } else if (tab === t("finance.tabs.payroll")) {
      // console.log("🔍 Setting active tab to payroll");
      setActiveTab("payroll");
    } else if (tab === t("finance.tabs.byClass")) {
      // console.log("🔍 Setting active tab to by-class");
      setActiveTab("by-class" as any);
    } else {
      // console.log("🔍 Using fallback mapping for tab:", tab);
      // Fallback to English names for backward compatibility
      const tabMap: { [key: string]: FinanceTab } = {
        Overview: "overview",
        Payments: "payments",
        Expenses: "expenses",
        Payroll: "payroll",
      };
      if (tab === "By Class") {
        setActiveTab("by-class" as any);
      } else {
        setActiveTab(tabMap[tab] || "overview");
      }
    }
  };

  const handleFABClick = () => {
    switch (activeTab) {
      case "overview":
        // setShowPaymentModal(true);
        break;
      case "payments":
        setShowPaymentModal(true);
        break;
      case "expenses":
        setShowExpenseModal(true);
        break;
      case "payroll":
        setShowPayrollModal(true);
        break;
    }
  };

  const handleModalSuccess = () => {
    // Data will be automatically refetched due to React Query invalidation
  };

  const handleEditExpense = (expense: any) => {
    // TODO: Implement edit functionality
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  const handleEditPayroll = (payroll: any) => {
    // TODO: Implement edit functionality
  };

  const handleDeletePayroll = (payrollId: number) => {
    if (
      window.confirm("Are you sure you want to delete this payroll record?")
    ) {
      deletePayrollMutation.mutate(payrollId);
    }
  };

  const getEmptyStateProps = () => {
    switch (activeTab) {
      case "overview":
        return {
          title: t("finance.emptyStates.noFinancialData"),
          description: t("finance.emptyStates.noFinancialDataDesc"),
          actions: [
            {
              label: t("finance.overview.addPayment"),
              onClick: () => setShowPaymentModal(true),
              variant: "primary" as const,
            },
            {
              label: t("finance.payments.addPayment"),
              onClick: () => setShowPaymentModal(true),
              variant: "primary" as const,
            },
            {
              label: t("finance.overview.addExpense"),
              onClick: () => setShowExpenseModal(true),
              variant: "secondary" as const,
            },
            {
              label: t("finance.overview.addPayroll"),
              onClick: () => setShowPayrollModal(true),
              variant: "primary" as const,
            },
          ],
        };
      case "payments":
        return {
          title: t("finance.emptyStates.noPayments"),
          description: t("finance.emptyStates.noPaymentsDesc"),
          actions: [
            {
              label: t("finance.overview.addPayments"),
              onClick: () => setShowPaymentModal(true),
              variant: "secondary" as const,
            },
          ],
        };
      case "expenses":
        return {
          title: t("finance.emptyStates.noExpenses"),
          description: t("finance.emptyStates.noExpensesDesc"),
          actions: [
            {
              label: t("finance.overview.addExpense"),
              onClick: () => setShowExpenseModal(true),
              variant: "secondary" as const,
            },
          ],
        };
      case "payroll":
        return {
          title: t("finance.emptyStates.noPayroll"),
          description: t("finance.emptyStates.noPayrollDesc"),
          actions: [
            {
              label: t("finance.overview.addPayroll"),
              onClick: () => setShowPayrollModal(true),
              variant: "primary" as const,
            },
          ],
        };
      default:
        return {
          title: t("finance.emptyStates.noFinancialData"),
          description: t("finance.emptyStates.noFinancialDataDesc"),
          actions: [],
        };
    }
  };

  const getFABLabel = () => {
    switch (activeTab) {
      // case "overview":
      //   return t("finance.overview.addPayment");
      case "payments":
        return t("finance.overview.addPayment");
      case "expenses":
        return t("finance.overview.addExpense");
      case "payroll":
        return t("finance.overview.addPayroll");
      default:
        return t("common.add");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("finance.loading.loadingData")}
          </h3>
          <p className="text-gray-600 mb-4">
            {t("finance.loading.loadingDesc")}
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Show interface even if there are errors - let individual components handle their own error states

  // Show error state if there are critical errors
  if (paymentsError && expensesError && payrollsError && statsError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {t("finance.errors.loadFailed")}
          </h3>
          <p className="text-gray-600 mb-6">
            {t("finance.errors.loadFailedDesc")}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t("finance.errors.retryLoading")}
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t("finance.errors.addPaymentManually")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // for payments
  // Calculate payments statistics
  const totalPayments = payments?.length || 0;

  const totalAmount =
    payments?.reduce((sum, e) => {
      // Try different possible field names for payments amount
      const amount = e.amount || e.total || e.paymentsAmount || e.cost || 0;
      return sum + (Number(amount) || 0);
    }, 0) || 0;

  const pendingPayments =
    payments?.filter((e) => e.status === "pending").length || 0;
  const pendingAmount =
    payments
      ?.filter((e) => e.status === "pending")
      .reduce((sum, e) => {
        const amount = e.amount || e.total || e.paymentsAmount || e.cost || 0;
        return sum + (Number(amount) || 0);
      }, 0) || 0;

  // Get unique categories
  // const categories = ['all', ...Array.from(new Set(expenses.map(e => e.category)))];

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Finance sub-tabs inside global header (positioned under header with proper stacking) */}
      <div className="px-6 mt-3 relative z-20 flex-shrink-0"></div>
      <div className="flex-1 p-1 sm:p-6">
        {/* Header */}
        <FinanceHeader
          onSearch={handleSearch}
          onFilter={handleFilter}
          onExport={handleExport}
          onPrint={handlePrint}
        />

        {/* Scope selector */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("finance.scope.title", "Data scope")}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {scopeMode === "active"
                    ? t(
                        "finance.scope.activeTitle",
                        "Following your selected school / branch"
                      )
                    : t(
                        "finance.scope.allTitle",
                        "All managed schools & branches"
                      )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {scopeMode === "active"
                    ? t(
                        "finance.scope.activeDescription",
                        "Use the Managed Entities menu in the header to switch schools, branches, or courses."
                      )
                    : t(
                        "finance.scope.allDescription",
                        "Showing consolidated totals for every school and branch you manage."
                      )}
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 text-sm font-medium w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleScopeModeChange("active")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition ${
                    scopeMode === "active"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("finance.scope.selectedButton", "Selected scope")}
                </button>
                <button
                  type="button"
                  onClick={() => handleScopeModeChange("all")}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition ${
                    scopeMode === "all"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("finance.scope.allButton", "All managed")}
                </button>
              </div>
            </div>
            {scopeMode === "active" ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {activeScopeBadges.map((badge) => (
                  <span
                    key={`${badge.label}-${badge.value}`}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-100"
                  >
                    <span className="text-[11px] uppercase tracking-wide text-purple-600">
                      {badge.label}
                    </span>
                    {badge.value}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                  {t(
                    "finance.scope.allBadge",
                    "Combined metrics for all accessible schools"
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("finance.filters.dateRange")}
            </h3>
            {dateRange.startDate && dateRange.endDate && (
              <button
                onClick={clearDateFilter}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {t("finance.filters.clearFilter")}
              </button>
            )}
          </div>
          <div className="max-w-md">
            <DateRangeSelector
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateRangeChange={handleDateRangeChange}
              placeholder={t("finance.filters.selectDateRange")}
              className="w-full"
            />
          </div>
          {dateRange.startDate && dateRange.endDate && (
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">
                {t("finance.filters.activeFilter")}:
              </span>{" "}
              {new Date(dateRange.startDate).toLocaleDateString()} -{" "}
              {new Date(dateRange.endDate).toLocaleDateString()}
              <span className="ml-2 text-purple-600 font-medium">
                ({t("shamsiMonths.hamal")} {currentPersianYear} -{" "}
                {t("shamsiMonths.hoot")} {currentPersianYear})
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <SegmentedControl
            tabs={[
              t("finance.tabs.overview"),
              t("finance.tabs.payments"),
              t("finance.tabs.expenses"),
              t("finance.tabs.payroll"),
              t("finance.tabs.byClass"),
            ]}
            activeTab={
              activeTab === "overview"
                ? t("finance.tabs.overview")
                : activeTab === "payments"
                ? t("finance.tabs.payments")
                : activeTab === "expenses"
                ? t("finance.tabs.expenses")
                : activeTab === "payroll"
                ? t("finance.tabs.payroll")
                : t("finance.tabs.byClass")
            }
            onTabChange={handleTabChange}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          {!hasData ? (
            <EmptyState {...getEmptyStateProps()} />
          ) : (
            <div className="space-y-1 sm:space-y-6">
              {/* Quick Summary */}
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-black shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                  {/* Left Section - Title and Date */}
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                      {t("finance.overview.financialOverview")}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Right Section - Net Income */}
                  <div className="text-left sm:text-right bg-white/10 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none rounded-lg sm:rounded-none p-4 sm:p-0 border border-white/20 sm:border-0">
                    <p className="text-sm sm:text-base text-black mb-1 sm:mb-0.5">
                      {(finalStats?.netIncome || 0) >= 0
                        ? t("finance.stats.netProfit")
                        : t("finance.stats.netLoss")}
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                      AFN {(finalStats?.netIncome || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overview Tab Content */}
              {activeTab === "overview" && (
                <div className="space-y-1 sm:space-y-6">
                  {scopeMode === "all" && perScopeStats.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t(
                              "finance.scope.breakdownTitle",
                              "Breakdown by managed branches / schools"
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t(
                              "finance.scope.breakdownDescription",
                              "Each card shows totals for one branch or school inside the current filters."
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          {t("finance.scope.entitiesCount", {
                            defaultValue: "{{count}} locations",
                            count: perScopeStats.length,
                          })}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {perScopeStats.map((stat) => (
                          <div
                            key={stat.key}
                            className="border border-gray-100 rounded-lg p-4 hover:border-purple-200 transition"
                          >
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              {stat.type === "branch"
                                ? t("finance.scope.branchLabel", "Branch")
                                : t("finance.scope.schoolLabel", "School")}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {stat.label}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">
                                  {t("finance.stats.totalRevenue")}
                                </p>
                                <p className="font-semibold">
                                  {formatMoney(stat.paymentsAmount)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {t("finance.stats.paymentsCount", {
                                    defaultValue: "{{count}} payments",
                                    count: stat.paymentCount,
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">
                                  {t("finance.stats.totalExpenses")}
                                </p>
                                <p className="font-semibold text-red-600">
                                  {formatMoney(stat.expensesAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">
                                  {t("finance.stats.totalPayroll")}
                                </p>
                                <p className="font-semibold text-blue-600">
                                  {formatMoney(stat.payrollAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">
                                  {stat.net >= 0
                                    ? t("finance.stats.netProfit")
                                    : t("finance.stats.netLoss")}
                                </p>
                                <p
                                  className={`font-semibold ${
                                    stat.net >= 0
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatMoney(stat.net)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.stats.totalRevenue")}
                            {!stats && calculatedStats && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {t("finance.stats.calculated")}
                              </span>
                            )}
                          </p>
                          {paymentsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                          ) : (
                            <div>
                              <p className="text-2xl font-semibold text-gray-900">
                                AFN{" "}
                                {(
                                  finalStats?.totalPayments || 0
                                ).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payments.length} {t("finance.stats.payments")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.stats.totalExpenses")}
                            {!stats && calculatedStats && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {t("finance.stats.calculated")}
                              </span>
                            )}
                          </p>
                          {expensesLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                          ) : (
                            <div>
                              <p className="text-2xl font-semibold text-gray-900">
                                AFN{" "}
                                {(
                                  finalStats?.totalExpenses || 0
                                ).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {expenses.length} {t("finance.stats.expenses")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.stats.totalPayroll")}
                            {!stats && calculatedStats && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {t("finance.stats.calculated")}
                              </span>
                            )}
                          </p>
                          {payrollsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                          ) : (
                            <div>
                              <p className="text-2xl font-semibold text-gray-900">
                                AFN{" "}
                                {(
                                  finalStats?.totalPayroll || 0
                                ).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payrolls.length} {t("finance.stats.records")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            (finalStats?.netIncome || 0) >= 0
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <svg
                            className={`w-6 h-6 ${
                              (finalStats?.netIncome || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.stats.netIncome")}
                            {!stats && calculatedStats && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {t("finance.stats.calculated")}
                              </span>
                            )}
                          </p>
                          {paymentsLoading ||
                          expensesLoading ||
                          payrollsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                          ) : (
                            <div>
                              <p
                                className={`text-2xl font-semibold ${
                                  (finalStats?.netIncome || 0) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                AFN{" "}
                                {(finalStats?.netIncome || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(finalStats?.netIncome || 0) >= 0
                                  ? t("finance.stats.netProfit")
                                  : t("finance.stats.netLoss")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Metrics Section - Add after existing stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6 mt-6">
                    {/* Growth Rate Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            advancedStats.monthlyGrowthRate >= 0
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          <svg
                            className={`w-6 h-6 ${
                              advancedStats.monthlyGrowthRate >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                advancedStats.monthlyGrowthRate >= 0
                                  ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                  : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                              }
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.scope.monthlyGrowth")}
                          </p>
                          <p
                            className={`text-2xl font-semibold ${
                              advancedStats.monthlyGrowthRate >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {advancedStats.monthlyGrowthRate >= 0 ? "+" : ""}
                            {advancedStats.monthlyGrowthRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">vs last month</p>
                        </div>
                      </div>
                    </div>

                    {/* Collection Efficiency */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.scope.collectionRate")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {advancedStats.collectionRate.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("finance.scope.successRate")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Outstanding Amount */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.scope.outStanding")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            AFN{" "}
                            {advancedStats.totalOutstanding.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {advancedStats.pendingCount}{" "}
                            {t("finance.scope.pendingPayment")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Revenue per Student */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.scope.revenueStudent")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatMoney(advancedStats.revenuePerStudent)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {advancedStats.totalStudents}{" "}
                            {t("finance.scope.activeStudents")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                        {t("finance.analytics.paymentMethods")}
                      </h3>
                      <div className="space-y-3">
                        {(() => {
                          const methodCounts = payments.reduce(
                            (acc, payment) => {
                              const method =
                                payment.method ||
                                t("finance.payment.method.cash");
                              acc[method] = (acc[method] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>
                          );

                          const totalPayments = (payments as any[]).length;
                          const methods = Object.entries(methodCounts);

                          if (methods.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <p className="text-sm sm:text-base text-gray-500">
                                  No payment data available
                                </p>
                              </div>
                            );
                          }

                          return (methods as Array<[string, number]>).map(
                            ([method, count]) => {
                              const percentage =
                                totalPayments > 0
                                  ? (Number(count) / Number(totalPayments)) *
                                    100
                                  : 0;
                              return (
                                <div
                                  key={method}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
                                >
                                  <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                                      {method}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 sm:space-x-3 pl-5 sm:pl-0">
                                    <div className="flex-1 sm:w-32 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs sm:text-sm text-gray-600 w-10 sm:w-12 text-right font-medium">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          );
                        })()}
                      </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t("finance.analytics.monthlyRevenue")}
                      </h3>
                      <div className="space-y-4">
                        {(() => {
                          // Group payments by month
                          const monthlyData = (payments as any[]).reduce(
                            (acc: any, payment: any) => {
                              const month = new Date(
                                payment.paymentDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                year: "2-digit",
                              });
                              if (!acc[month]) {
                                acc[month] = { count: 0, amount: 0 };
                              }
                              acc[month].count += 1;
                              acc[month].amount += Number(payment.total) || 0;
                              return acc;
                            },
                            {} as Record<
                              string,
                              { count: number; amount: number }
                            >
                          );

                          const months = Object.keys(
                            monthlyData as Record<string, any>
                          ).slice(-6); // Last 6 months
                          const maxAmount = Math.max(
                            ...months.map(
                              (month) =>
                                (monthlyData as Record<string, any>)[month]
                                  ?.amount || 0
                            )
                          );

                          if (months.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <p className="text-gray-500">
                                  No monthly data available
                                </p>
                              </div>
                            );
                          }

                          return months.map((month) => {
                            const data = (monthlyData as Record<string, any>)[
                              month
                            ];
                            const percentage =
                              maxAmount > 0
                                ? (data.amount / maxAmount) * 100
                                : 0;
                            return (
                              <div
                                key={month}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium text-gray-700 w-16">
                                    {month}
                                  </span>
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">
                                    AFN {data.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {data.count} {t("finance.stats.payments")}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                  {/* Financial Health Dashboard */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      {t("finance.scope.financialHealth")}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Gross Margin */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {t("finance.scope.grossMargin")}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              advancedStats.grossMargin >= 50
                                ? "text-green-600"
                                : advancedStats.grossMargin >= 30
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {advancedStats.grossMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              advancedStats.grossMargin >= 50
                                ? "bg-green-500"
                                : advancedStats.grossMargin >= 30
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                advancedStats.grossMargin,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {" "}
                          {t("finance.scope.target")} &gt;50%
                        </p>
                      </div>

                      {/* Operating Margin */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {t("finance.scope.operatingMargin")}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              advancedStats.operatingMargin >= 20
                                ? "text-green-600"
                                : advancedStats.operatingMargin >= 10
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {advancedStats.operatingMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              advancedStats.operatingMargin >= 20
                                ? "bg-green-500"
                                : advancedStats.operatingMargin >= 10
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                Math.max(advancedStats.operatingMargin, 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {t("finance.scope.target")} &gt;20%
                        </p>
                      </div>

                      {/* Daily Cash Flow */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {t("finance.scope.dailyNet")}
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              advancedStats.dailyAverageRevenue -
                                advancedStats.dailyAverageExpense >=
                              0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {advancedStats.dailyAverageRevenue -
                              advancedStats.dailyAverageExpense >=
                            0
                              ? "AFN "
                              : ""}
                            {(
                              advancedStats.dailyAverageRevenue -
                              advancedStats.dailyAverageExpense
                            ).toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>
                            In: AFN{" "}
                            {advancedStats.dailyAverageRevenue.toFixed(0)}
                          </span>
                          <span>
                            Out: AFN{" "}
                            {advancedStats.dailyAverageExpense.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expense Breakdown by Category */}
                  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
                      {t("finance.scope.expenseDistribution")}
                    </h3>

                    <div className="space-y-4 sm:space-y-5">
                      {Object.entries(advancedStats.expensesByCategory)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([category, amount]) => {
                          const percentage =
                            calculatedStats.totalExpenses > 0
                              ? (amount / calculatedStats.totalExpenses) * 100
                              : 0;

                          return (
                            <div key={category} className="space-y-2">
                              {/* Category Name and Amount - Mobile/Desktop */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0" />
                                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                    {category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                    AFN {amount.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-gray-500 w-10 sm:w-12 text-right">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                              </div>

                              {/* Progress Bar - Full Width */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Predictive Analytics & Forecasting */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-black shadow-lg">
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6">
                      {t("finance.scope.financialProjections")}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Next Month Revenue Forecast */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors">
                        <p className="text-gray-900 text-xs sm:text-sm mb-2">
                          {t("finance.scope.nextMonth")}
                        </p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                          {formatMoney(advancedStats.thisMonthRevenue * 1.1)}
                        </p>
                        <p className="text-xs text-gray-900">
                          {t("finance.scope.basedOn")}{" "}
                          {advancedStats.monthlyGrowthRate.toFixed(0)}%
                          {t("finance.scope.growthTrend")}
                        </p>
                      </div>

                      {/* Break-even Point */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors">
                        <p className="text-gray-900 text-xs sm:text-sm mb-2">
                          {t("finance.scope.breakEven")}
                        </p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                          {Math.ceil(
                            calculatedStats.totalExpenses /
                              (advancedStats.revenuePerStudent || 1)
                          )}{" "}
                          <span className="text-base sm:text-lg">students</span>
                        </p>
                        <p className="text-xs text-gray-900"></p>
                      </div>
                      {t("finance.scope.toCover")}

                      {/* Cash Runway */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors sm:col-span-2 lg:col-span-1">
                        <p className="text-gray-900 text-xs sm:text-sm mb-2">
                          {t("finance.scope.cashRunway")}
                        </p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                          {advancedStats.monthlyBurnRate > 0
                            ? `${Math.floor(
                                calculatedStats.netIncome /
                                  advancedStats.monthlyBurnRate
                              )} months`
                            : t("finance.scope.positiveFlow")}
                        </p>
                        <p className="text-xs text-gray-900">
                          {t("finance.scope.currentRate")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Year-over-Year Comparison */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                      {t("finance.scope.period")}
                    </h3>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full px-4 sm:px-0 align-middle">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700">
                                {t("finance.scope.metric")}
                              </th>
                              <th className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700">
                                {t("finance.scope.thisPeriod")}
                              </th>
                              <th className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700">
                                {t("finance.scope.lastPeriod")}
                              </th>
                              <th className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-700">
                                {t("finance.scope.change")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm text-gray-600">
                                {t("finance.scope.revenue")}
                              </td>
                              <td className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                                {formatMoney(
                                  advancedStats.thisMonthRevenue
                                ).toLocaleString()}
                              </td>
                              <td className="text-right py-2 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                {formatMoney(
                                  advancedStats.lastMonthRevenue
                                ).toLocaleString()}
                              </td>
                              <td
                                className={`text-right py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                                  advancedStats.monthlyGrowthRate >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {advancedStats.monthlyGrowthRate >= 0
                                  ? "+"
                                  : ""}
                                {advancedStats.monthlyGrowthRate.toFixed(1)}%
                              </td>
                            </tr>
                            {/* Add more comparison rows as needed */}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  {/* deleted, code available on payments tab */}

                  {/* Insights Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t("finance.analytics.insights")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {t("finance.analytics.averagePayment")}
                        </h4>
                        <p className="text-2xl font-bold text-green-600">
                          {formatMoney(
                            payments.length > 0
                              ? (finalStats?.totalPayments || 0) /
                                  payments.length
                              : "0.00"
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("finance.analytics.perTransaction")}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {t("finance.analytics.expenseRatio")}
                        </h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {(finalStats?.totalPayments || 0) > 0
                            ? (
                                ((finalStats?.totalExpenses || 0) /
                                  (finalStats?.totalPayments || 1)) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("finance.analytics.ofTotalRevenue")}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-6 h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {t("finance.analytics.payrollRatio")}
                        </h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {(finalStats?.totalPayments || 0) > 0
                            ? (
                                ((finalStats?.totalPayroll || 0) /
                                  (finalStats?.totalPayments || 1)) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("finance.analytics.ofTotalRevenue")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* before this are related to overview  */}

              {/* Payments Tab Content */}
              {/* Payments Tab Content */}
              {activeTab === "payments" && (
                <div className="space-y-1 sm:space-y-6">
                  {/* Header with Actions */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {t("finance.payment.title")}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {t("finance.payments.manageAndTrack")}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* View Mode Buttons */}
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                          <button
                            onClick={() => setPaymentsViewMode("dashboard")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                              paymentsViewMode === "dashboard"
                                ? "bg-green-600 text-white shadow-md"
                                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill={
                                paymentsViewMode === "dashboard"
                                  ? "currentColor"
                                  : "none"
                              }
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            {t("finance.payment.dashboard")}
                          </button>
                          <button
                            onClick={() => setPaymentsViewMode("table")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                              paymentsViewMode === "table"
                                ? "bg-green-600 text-white shadow-md"
                                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            {t("finance.payment.table")}
                          </button>
                          <button
                            onClick={() => setPaymentsViewMode("list")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                              paymentsViewMode === "list"
                                ? "bg-green-600 text-white shadow-md"
                                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                              />
                            </svg>
                            {t("finance.payment.list")}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder={t("finance.payment.searchPlaceholder")}
                          value={paymentsSearchText}
                          onChange={(e) =>
                            setPaymentsSearchText(e.target.value)
                          }
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      {/* Status Filter */}
                      <select
                        value={paymentsStatusFilter}
                        onChange={(e) =>
                          setPaymentsStatusFilter(e.target.value as any)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">
                          {t("finance.payment.allStatus")}
                        </option>
                        <option value="paid">
                          {t("finance.payment.paid")}
                        </option>
                        <option value="unpaid">
                          {t("finance.payment.unpaid")}
                        </option>
                        <option value="partially-paid">
                          {t("finance.payment.partially-paid")}
                        </option>
                        <option value="Overdue">
                          {t("finance.payment.overdue")}
                        </option>
                        <option value="void">
                          {t("finance.payment.void")}
                        </option>
                        {/* <option value="completed">
                          {t("finance.payment.completed")}
                        </option>
                        <option value="pending">
                          {t("finance.payment.pending")}
                        </option>
                        <option value="cancelled">
                          {t("finance.payment.cancelled")}
                        </option> */}
                      </select>

                      {/* Payment Method Filter */}
                      <select
                        value={paymentsMethodFilter}
                        onChange={(e) =>
                          setPaymentsMethodFilter(e.target.value)
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {paymentMethods.map((method) => (
                          <option key={method} value={method}>
                            {method === "all"
                              ? t("finance.payment.allMethods")
                              : t(
                                  `finance.payment.method.${method.toLowerCase()}`
                                )}
                          </option>
                        ))}
                      </select>

                      {/* Sort */}
                      <select
                        value={`${paymentsSortBy}-${paymentsSortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split("-");
                          setPaymentsSortBy(field as any);
                          setPaymentsSortOrder(order as any);
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="date-desc">
                          {t("finance.payment.dateNewest")}
                        </option>
                        <option value="date-asc">
                          {t("finance.payment.dateOldest")}
                        </option>
                        <option value="amount-desc">
                          {t("finance.payment.amountHighToLow")}
                        </option>
                        <option value="amount-asc">
                          {t("finance.payment.amountLowToHigh")}
                        </option>
                        <option value="student-asc">
                          {t("finance.payment.studentAZ")}
                        </option>
                        <option value="student-desc">
                          {t("finance.payment.studentZA")}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Statistics Cards - Keep your existing cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-1 sm:gap-6">
                    {/* Your existing statistics cards */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.payment.totalPayments")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {totalPayments}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.payment.totalAmount")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatMoney(totalAmount || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.payment.pending")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {pendingPayments}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">
                            {t("finance.payment.completed")}
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {
                              sortedPayments.filter(
                                (p) => (p.status || "completed") === "completed"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payments Display based on viewMode */}
                  {paymentsViewMode === "dashboard" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {t("finance.payment.paymentsList")} (
                              {sortedPayments.length})
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("finance.analytics.latestActivities")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {sortedPayments.length === 0 ? (
                          <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">
                              💳
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {t("finance.payment.noPaymentsFound")}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {paymentsSearchText ||
                              paymentsStatusFilter !== "all" ||
                              paymentsMethodFilter !== "all"
                                ? t("finance.payment.noPaymentsMatchFilter")
                                : t("finance.payment.startAddingPayments")}
                            </p>
                          </div>
                        ) : (
                          paginatedPayments.map((payment) => (
                            <div
                              key={payment.id}
                              className="p-6 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-5 h-5 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {(() => {
                                        const first =
                                          payment.student?.user?.firstName ||
                                          payment.student?.firstName ||
                                          "";
                                        const last =
                                          payment.student?.user?.lastName ||
                                          payment.student?.lastName ||
                                          "";
                                        const name = `${first} ${last}`.trim();
                                        return `${t("finance.payment.from")} ${
                                          name || t("finance.payment.student")
                                        }`;
                                      })()}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1">
                                      <p className="text-xs text-gray-500">
                                        {formatLocalDate(
                                          payment.paymentDate,
                                          payment.createdAt
                                        )}
                                      </p>
                                      {(() => {
                                        const pm =
                                          payment.paymentMonth ||
                                          (() => {
                                            try {
                                              const r =
                                                typeof payment.remarks ===
                                                "string"
                                                  ? JSON.parse(payment.remarks)
                                                  : payment.remarks;
                                              return (
                                                r?.paymentMonth || r?.Month
                                              );
                                            } catch {
                                              return undefined;
                                            }
                                          })();
                                        return pm ? (
                                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                            {pm}
                                          </span>
                                        ) : null;
                                      })()}
                                      {/* Student class if available */}
                                      {(() => {
                                        const name =
                                          payment.student?.class?.name ||
                                          payment.student?.className ||
                                          payment.student?.section?.name ||
                                          "";
                                        const code =
                                          payment.student?.class?.code || "";
                                        const className =
                                          `${name} ${code}`.trim();
                                        return className ? (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                            {className}
                                          </span>
                                        ) : null;
                                      })()}
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {t(
                                          payment.method
                                            ? `finance.payment.method.${payment.method.toLowerCase()}`
                                            : "finance.payment.method.cash"
                                        )}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          payment.status === "completed"
                                            ? "bg-green-100 text-green-800"
                                            : payment.status === "pending"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {t(
                                          `finance.payment.status.${(
                                            payment.status || "completed"
                                          ).toLowerCase()}`
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-lg font-semibold text-green-600">
                                      +
                                      {formatMoney(
                                        payment.total ||
                                          payment.amount ||
                                          payment.paymentAmount ||
                                          0
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t("finance.payment.received")}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePrintPayment(payment)}
                                    className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-sm"
                                    title={t("finance.actions.print") as string}
                                    aria-label={
                                      t("finance.actions.print") as string
                                    }
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {renderPaymentsPagination()}
                    </div>
                  )}

                  {paymentsViewMode === "table" && (
                    <>
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <div className="p-6 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t("finance.payment.paymentsList")} (
                            {sortedPayments.length})
                          </h3>
                        </div>

                        {sortedPayments.length === 0 ? (
                          <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">
                              💳
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {t("finance.payment.noPaymentsFound")}
                            </h3>
                            <p className="text-gray-600">
                              {t("finance.payment.noPaymentsMatchFilter")}
                            </p>
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.student")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.class")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.date")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.amount")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.methods")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.statuses")}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {t("finance.payment.actions")}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedPayments.map((payment) => (
                                <tr
                                  key={payment.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {payment.student?.firstName}{" "}
                                      {payment.student?.lastName}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {payment.student?.class?.name || "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(
                                      payment.paymentDate || payment.date
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-green-600">
                                      +
                                      {formatMoney(
                                        Number(
                                          payment.total || payment.amount || 0
                                        )
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {t(
                                      `finance.payment.method.${(
                                        payment.method || "cash"
                                      ).toLowerCase()}`
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        payment.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : payment.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {t(
                                        `finance.payment.status.${(
                                          payment.status || "completed"
                                        ).toLowerCase()}`
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                      onClick={() =>
                                        handlePrintPayment(payment)
                                      }
                                      className="text-purple-600 hover:text-purple-900"
                                    >
                                      {t("finance.actions.print")}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      {renderPaymentsPagination()}
                    </>
                  )}

                  {paymentsViewMode === "list" && (
                    <>
                      <div className="space-y-4">
                        {sortedPayments.length === 0 ? (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">
                              💳
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {t("finance.payment.noPaymentsFound")}
                            </h3>
                            <p className="text-gray-600">
                              {t("finance.payment.noPaymentsMatchFilter")}
                            </p>
                          </div>
                        ) : (
                          paginatedPayments.map((payment) => (
                            <div
                              key={payment.id}
                              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-5 h-5 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-lg font-medium text-gray-900">
                                        {payment.student?.firstName}{" "}
                                        {payment.student?.lastName}
                                      </h4>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                        <span>
                                          {new Date(
                                            payment.paymentDate || payment.date
                                          ).toLocaleDateString()}
                                        </span>
                                        {payment.student?.class?.name && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                            {payment.student.class.name}
                                          </span>
                                        )}
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                          {t(
                                            `finance.payment.method.${(
                                              payment.method || "cash"
                                            ).toLowerCase()}`
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-lg font-semibold text-green-600">
                                      +
                                      {formatMoney(
                                        Number(
                                          payment.total || payment.amount || 0
                                        )
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t("finance.payment.received")}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePrintPayment(payment)}
                                    className="w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {renderPaymentsPagination()}
                      </div>
                      {renderPaymentsPagination()}
                    </>
                  )}
                </div>
              )}

              {/* Payments Tab Content */}
              {/* {activeTab === "payments" && (
                <ExpensesList
                  expenses={expenses}
                  onAddExpense={() => setShowExpenseModal(true)}
                  onEditExpense={handleEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  loading={expensesLoading}
                  error={expensesError?.message}
                />
              )} */}
              {/* Expenses Tab Content */}
              {activeTab === "expenses" && (
                <ExpensesList
                  expenses={expenses}
                  onAddExpense={() => setShowExpenseModal(true)}
                  onEditExpense={handleEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  loading={expensesLoading}
                  error={expensesError?.message}
                />
              )}

              {/* Payroll Tab Content */}
              {activeTab === "payroll" && (
                <PayrollList
                  payrolls={payrolls}
                  onAddPayroll={() => setShowPayrollModal(true)}
                  onEditPayroll={handleEditPayroll}
                  onDeletePayroll={handleDeletePayroll}
                  loading={payrollsLoading}
                  error={payrollsError?.message}
                />
              )}

              {/* By Class Tab Content */}
              {activeTab === "by-class" && <ClassMonthBillingTab />}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {activeTab !== "overview" && activeTab !== "by-class" && (
        <FloatingActionButton onClick={handleFABClick} label={getFABLabel()} />
      )}

      {/* Modals */}
      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handleModalSuccess}
      />

      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={handleModalSuccess}
      />

      <AddPayrollModal
        isOpen={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* All Payments Modal */}
      {/* All Payments Modal with Print Functionality */}

      {showAllPaymentsModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full"
            style={{ zIndex: 9999 }}
          >
            <div className="relative top-4 mx-auto p-0 w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-hidden animate-in slide-in-from-top-4 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {t("finance.modals.allPayments")}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {t("finance.modals.allPaymentsDesc")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAllPaymentsModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          {t("finance.stats.totalPayments")}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {sortedPayments.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          {t("finance.analytics.totalAmount")}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatMoney(
                            sortedPayments.reduce(
                              (sum, payment) =>
                                sum + (Number(payment.total) || 0),
                              0
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">
                          {t("finance.analytics.averagePayment")}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatMoney(
                            sortedPayments.length > 0
                              ? sortedPayments.reduce(
                                  (sum, payment) =>
                                    sum + (Number(payment.total) || 0),
                                  0
                                ) / sortedPayments.length
                              : "0.00"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area with Print Buttons */}
              <div className="px-8 py-6 max-h-[50vh] overflow-y-auto">
                {sortedPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("finance.modals.noPaymentsFound")}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {t("finance.modals.noPaymentsDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedPayments.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {payment.student?.firstName}{" "}
                                  {payment.student?.lastName}
                                </h4>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    payment.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : payment.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : payment.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {t(
                                    payment.status
                                      ? `finance.payment.status.${payment.status.toLowerCase()}`
                                      : "finance.payment.status.completed"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {new Date(
                                    payment.paymentDate
                                  ).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                  {t(
                                    payment.method
                                      ? `finance.payment.method.${payment.method.toLowerCase()}`
                                      : "finance.payment.method.cash"
                                  )}
                                </span>
                                {payment.student?.class?.name && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {payment.student.class.name}
                                  </span>
                                )}
                              </div>
                              {payment.description && (
                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-2 rounded-lg">
                                  {payment.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Amount and Print Button */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 mb-1">
                                +{formatMoney(Number(payment.total) || 0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t("finance.payment.received")}
                              </p>
                              {payment.transactionId && (
                                <p className="text-xs text-gray-400 mt-1">
                                  ID: {payment.transactionId}
                                </p>
                              )}
                            </div>

                            {/* Print Button */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handlePrintPayment(payment)}
                                className="inline-flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                                title={t("finance.actions.printBill") as string}
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">
                                  {t("finance.actions.print")}
                                </span>
                              </button>

                              {/* Optional: Add a receipt number if available */}
                              {payment.receiptNumber && (
                                <span className="text-xs text-gray-500 text-center">
                                  Receipt #{payment.receiptNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Print All Option */}
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <span className="text-gray-600">
                      <span className="font-semibold text-gray-900">
                        {sortedPayments.length}
                      </span>{" "}
                      {t("finance.stats.payments")}
                    </span>
                    {(paymentsSearchText ||
                      paymentsStatusFilter !== "all" ||
                      paymentsMethodFilter !== "all") && (
                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
                        Filtered results
                      </span>
                    )}
                    <span className="text-gray-600">
                      {t("finance.modals.lastUpdated")}:{" "}
                      <span className="font-medium">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Optional: Print All Button */}
                    <button
                      onClick={() => {
                        // Create a combined print view for all payments
                        const printWindow = window.open("", "_blank");
                        const html = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>All Payments Report</title>
                        <style>
                          body { font-family: Arial, sans-serif; }
                          .payment { page-break-after: always; padding: 20px; }
                          .payment:last-child { page-break-after: auto; }
                          h2 { color: #333; }
                          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                          th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
                          th { background: #f5f5f5; }
                        </style>
                      </head>
                      <body>
                        <h1>Payment Report - ${new Date().toLocaleDateString()}</h1>
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Student</th>
                              <th>Class</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${sortedPayments
                              .map(
                                (p) => `
                              <tr>
                                <td>${new Date(
                                  p.paymentDate
                                ).toLocaleDateString()}</td>
                                <td>${p.student?.firstName || ""} ${
                                  p.student?.lastName || ""
                                }</td>
                                <td>${p.student?.class?.name || "-"}</td>
                                <td>${formatMoney(Number(p.total) || 0)}</td>
                                <td>${p.method || "Cash"}</td>
                                <td>${p.status || "Completed"}</td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      </body>
                    </html>
                  `;
                        printWindow.document.write(html);
                        printWindow.document.close();
                        printWindow.print();
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                      {t("finance.actions.printAll")}
                    </button>

                    <button
                      onClick={() => setShowAllPaymentsModal(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    >
                      {t("finance.modals.close")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// Error Boundary Component
class FinanceErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("🔍 FinanceScreen Error:", error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Finance Interface Error
            </h2>
            <p className="text-gray-600 mb-4">
              Something went wrong with the finance interface.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                {(this.state as any).error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}

// Wrapped FinanceScreen with Error Boundary
const FinanceScreenWithErrorBoundary = () => (
  <FinanceErrorBoundary>
    <FinanceScreen />
  </FinanceErrorBoundary>
);

export default FinanceScreenWithErrorBoundary;
