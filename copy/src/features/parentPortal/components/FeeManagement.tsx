import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useFinancialSummary,
  useFinancialAnalytics,
  useStudentPayments,
} from "../services/parentPortalService";
import {
  FinancialSummary,
  FinancialAnalytics,
  PaymentRecord,
} from "../types/parentPortal";
import DateRangeSelector from "./DateRangeSelector";
import {
  formatDateByLocale,
  gregorianYearToShamsi,
} from "../../../utils/dateConverter";

interface FeeManagementProps {
  studentId: string;
  parentId?: string;
}

const FeeManagement: React.FC<FeeManagementProps> = ({
  studentId,
  parentId,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "analytics"
  >("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = full year
  const [paymentFilters, setPaymentFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Initialize with current year's date range
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    setSelectedYear(currentYear);
    setSelectedMonth(null); // Default to full year
    setPaymentFilters({
      status: "",
      startDate: startOfYear,
      endDate: endOfYear,
    });
  }, []);

  // Get parent ID from context or props
  const currentParentId = parentId || "1"; // Fallback to 1 for now

  // Custom hook to fetch financial summary from the API
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchFinancialSummary = async () => {
    try {
      setLoadingSummary(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `https://khwanzay.school/api/parents/${currentParentId}/students/${studentId}/financial-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFinancialSummary(data);
    } catch (error) {
      // console.error('Error fetching financial summary:', error);
      setFinancialSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch financial summary when component mounts or student changes
  useEffect(() => {
    fetchFinancialSummary();
  }, [studentId, currentParentId]);

  // Fetch analytics data when component mounts
  useEffect(() => {
    fetchFinancialAnalytics(selectedYear);
  }, [studentId, currentParentId]);

  // Custom hook to fetch financial analytics from the API
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchFinancialAnalytics = async (year: number) => {
    try {
      setLoadingAnalytics(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `https://khwanzay.school/api/parents/${currentParentId}/students/${studentId}/financial-analytics?period=year&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      // console.error('Error fetching financial analytics:', error);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Custom hook to fetch payments from the API
  const fetchPayments = async (filters: any) => {
    try {
      setLoadingPayments(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(
        `https://khwanzay.school/api/parents/${currentParentId}/students/${studentId}/payments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPaymentsData(data);
    } catch (error) {
      // console.error('Error fetching payments:', error);
      setPaymentsData({ success: false, data: [], pagination: { total: 0 } });
    } finally {
      setLoadingPayments(false);
    }
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    // console.log('handleYearChange called with year:', year);
    setSelectedYear(year);
    setSelectedMonth(null); // Reset to full year when year changes
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    // console.log('Setting date range:', startOfYe/ar, 'to', endOfYear);

    setPaymentFilters((prev) => ({
      ...prev,
      startDate: startOfYear,
      endDate: endOfYear,
    }));

    // Fetch analytics data for the selected year
    fetchFinancialAnalytics(year);
  };

  // handle month change
  const handleMonthChange = (month: number | null) => {
    // console.log('handleMonthChange called with month:', month);
    setSelectedMonth(month);

    if (month === null) {
      // Full year selected
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;
      setPaymentFilters((prev) => ({
        ...prev,
        startDate: startOfYear,
        endDate: endOfYear,
      }));
    } else {
      // Specific month selected
      const monthStr = String(month).padStart(2, "0");
      const startOfMonth = `${selectedYear}-${monthStr}-01`;

      // Calculate last day of month
      const lastDay = new Date(selectedYear, month, 0).getDate();
      const endOfMonth = `${selectedYear}-${monthStr}-${String(
        lastDay
      ).padStart(2, "0")}`;

      setPaymentFilters((prev) => ({
        ...prev,
        startDate: startOfMonth,
        endDate: endOfMonth,
      }));
    }
  };

  // debag effect
  useEffect(() => {
    // console.log('Selected month changed to:', selectedMonth);
  }, [selectedMonth]);

  // Debug effect to track state changes
  useEffect(() => {
    // console.log('Selected year changed to:', selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    // console.log('Payment filters changed:', paymentFilters);
  }, [paymentFilters]);

  // Fetch payments when filters change
  useEffect(() => {
    fetchPayments(paymentFilters);
  }, [paymentFilters, studentId, currentParentId]);

  // months names for filtering
  const monthNames =
    i18n.language === "ps-AF" || i18n.language === "fa-AF"
      ? [
          "حمل",
          "ثور",
          "جوزا",
          "سرطان",
          "اسد",
          "سنبله",
          "میزان",
          "عقرب",
          "قوس",
          "جدی",
          "دلو",
          "حوت",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      case "PARTIAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toUpperCase();
    // Return SVG icons instead of emojis
    if (s === "COMPLETED" || s === "PAID") {
      return (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    if (s === "PENDING") {
      return (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    if (s === "OVERDUE") {
      return (
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      );
    }
    if (s === "PARTIAL") {
      return (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      );
    }
    return (
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
          d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateByLocale(dateString, i18n.language);
  };

  // Build a dynamic time series for charts from analytics or payments
  const monthlySeries = React.useMemo(() => {
    // Prefer backend-provided series if available
    let series: { label: string; value: number }[] = [];
    const fromAnalytics =
      analytics?.data?.monthly || analytics?.data?.timeline || [];
    if (Array.isArray(fromAnalytics) && fromAnalytics.length > 0) {
      for (const item of fromAnalytics) {
        const label = item.label || item.month || item.date || "";
        const value = Number(item.total || item.amount || item.value || 0);
        if (label) series.push({ label: String(label), value });
      }
      // Normalize to YYYY-MM format when possible
      return series;
    }

    // Fallback: aggregate payments by month from paymentsData
    const map = new Map<string, number>();
    const payments: any[] = (paymentsData as any)?.data || [];
    for (const p of payments) {
      const d = new Date(p.createdAt || p.date || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      map.set(key, (map.get(key) || 0) + Number(p.amount || 0));
    }
    const entries = Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    series = entries.map(([k, v]) => ({ label: k, value: v }));

    // If still empty, create a baseline for selected year with zeroes
    if (series.length === 0) {
      series = Array.from({ length: 12 }, (_, i) => ({
        label: `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
        value: 0,
      }));
    }
    return series;
  }, [analytics, paymentsData, selectedYear]);

  const isLoading = loadingSummary || loadingAnalytics || loadingPayments;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* Student Info Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-gray-900 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
        <div className="flex items-center justify-between ">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {t("parentPortal.fees.financialOverview")}
            </h2>
            <p className="text-gray-600">
              {financialSummary?.data?.student
                ? `${financialSummary.data.student.name} - ${t(
                    "parentPortal.fees.gradeFormat",
                    {
                      grade: financialSummary.data.student.class,
                      section: financialSummary.data.student.classCode,
                    }
                  )}`
                : t("parentPortal.fees.studentFinancialInfo")}
            </p>
          </div>
        </div>
      </div>

      {/* new */}
      {/* Year and Month Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          {/* Year Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-black">
              {t("parentPortal.fees.academicYear")}:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                const shamsiYear = gregorianYearToShamsi(year);
                const displayYear =
                  i18n.language === "ps-AF" || i18n.language === "fa-AF"
                    ? `${shamsiYear}`
                    : `${year}`;
                return (
                  <option key={year} value={year}>
                    {displayYear}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t("parentPortal.fees.selectedMonth")}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-12 gap-2">
              {/* Full Year Button */}
              <button
                onClick={() => handleMonthChange(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMonth === null
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("parentPortal.fees.fullYear")}
              </button>

              {/* Month Buttons */}
              {monthNames.map((month, index) => (
                <button
                  key={index}
                  onClick={() => handleMonthChange(index + 1)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMonth === index + 1
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {i18n.language === "ps-AF" || i18n.language === "fa-AF"
                    ? month
                    : month.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">
                {t("parentPortal.fees.showingDataFor")}
              </span>{" "}
              {(() => {
                const displayYear =
                  i18n.language === "ps-AF" || i18n.language === "fa-AF"
                    ? gregorianYearToShamsi(selectedYear)
                    : selectedYear;
                return selectedMonth === null
                  ? `${t("parentPortal.fees.fullYear")} ${displayYear}`
                  : `${monthNames[selectedMonth - 1]} ${displayYear}`;
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {financialSummary?.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-6">
          <div className="bg-white rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium mb-1">
                  {t("parentPortal.fees.totalFees")}
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(financialSummary.data.summary.totalFees)}
                </p>
                <p className="text-blue-600 text-xs">
                  {t("parentPortal.fees.academicYear")}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
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
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium mb-1">
                  {t("parentPortal.fees.paidAmount")}
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(financialSummary.data.summary.totalPaid)}
                </p>
                <p className="text-green-600 text-xs">
                  {t("parentPortal.fees.completePercentage", {
                    percentage:
                      financialSummary.data.summary.paymentPercentage.toFixed(
                        1
                      ),
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {[
              {
                id: "overview",
                label: t("parentPortal.fees.overview"),
                icon: (
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
                      d="M11 3v18M3 13h18"
                    />
                  </svg>
                ),
              },
              {
                id: "payments",
                label: t("parentPortal.tabs.payments"),
                icon: (
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
                      d="M3 10h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm0 8h.01"
                    />
                  </svg>
                ),
              },
              {
                id: "analytics",
                label: t("parentPortal.fees.analytics"),
                icon: (
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
                      d="M3 3v18h18M7 13l3 3 7-7"
                    />
                  </svg>
                ),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="inline-flex items-center">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Recent Payments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("parentPortal.fees.recentPayments")}
                </h3>
                <div className="space-y-3">
                  {financialSummary?.data?.recentPayments?.length > 0 ? (
                    financialSummary.data.recentPayments.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {getStatusIcon(payment.status)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {t("parentPortal.fees.payment")} #{payment.id}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {payment.createdAt
                                ? formatDate(payment.createdAt)
                                : t("parentPortal.fees.dateNotAvailable")}{" "}
                              •
                              {payment.dueDate
                                ? ` ${t("parentPortal.fees.due")}: ${formatDate(
                                    payment.dueDate
                                  )}`
                                : ` ${t("parentPortal.fees.noDueDate")}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2 flex items-center justify-center text-blue-600">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm0 8h.01"
                          />
                        </svg>
                      </div>
                      <p>{t("parentPortal.fees.noRecentPayments")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Payments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("parentPortal.fees.upcomingPayments")}
                </h3>
                <div className="space-y-3">
                  {financialSummary?.data?.upcomingPayments?.length > 0 ? (
                    financialSummary.data.upcomingPayments.map(
                      (payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-yellow-100 text-yellow-800">
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {t("parentPortal.fees.payment")} #{payment.id}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {t("parentPortal.fees.due")}:{" "}
                                {payment.dueDate
                                  ? formatDate(payment.dueDate)
                                  : t("parentPortal.fees.noDueDateSet")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              PENDING
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2 flex items-center justify-center text-green-600">
                        <svg
                          className="w-10 h-10"
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
                      <p>{t("parentPortal.fees.noUpcomingPayments")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-1 sm:space-y-6 text-black">
              {/* Year and Payment Filters */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const displayYear =
                        i18n.language === "ps-AF" || i18n.language === "fa-AF"
                          ? gregorianYearToShamsi(selectedYear)
                          : selectedYear;
                      return selectedMonth === null
                        ? `Payments for ${displayYear}`
                        : `Payments for ${
                            monthNames[selectedMonth - 1]
                          } ${displayYear}`;
                    })()}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {t("parentPortal.fees.year")}:
                    </span>
                    <select
                      key={`payments-year-${selectedYear}`}
                      value={selectedYear}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        // console.log('Payments year changed to:', newYear);
                        handleYearChange(newYear);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-black"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        const shamsiYear = gregorianYearToShamsi(year);
                        const displayYear =
                          i18n.language === "ps-AF" || i18n.language === "fa-AF"
                            ? `${shamsiYear}`
                            : `${year}`;
                        return (
                          <option key={year} value={year}>
                            {displayYear}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <select
                    value={paymentFilters.status}
                    onChange={(e) =>
                      setPaymentFilters({
                        ...paymentFilters,
                        status: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t("parentPortal.fees.allStatus")}</option>
                    <option value="PAID">{t("parentPortal.fees.paid")}</option>
                    <option value="PENDING">
                      {t("parentPortal.fees.pending")}
                    </option>
                    <option value="OVERDUE">
                      {t("parentPortal.fees.overdue")}
                    </option>
                  </select>

                  <DateRangeSelector
                    startDate={paymentFilters.startDate}
                    endDate={paymentFilters.endDate}
                    onDateRangeChange={(startDate, endDate) => {
                      setPaymentFilters({
                        ...paymentFilters,
                        startDate,
                        endDate,
                      });
                    }}
                    placeholder="Select date range"
                    className="w-96"
                  />

                  <button
                    onClick={() => {
                      const startOfYear = `${selectedYear}-01-01`;
                      const endOfYear = `${selectedYear}-12-31`;
                      setPaymentFilters({
                        ...paymentFilters,
                        startDate: startOfYear,
                        endDate: endOfYear,
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {t("parentPortal.fees.resetToFullYear")}
                  </button>
                </div>
              </div>

              {/* Payment Summary */}
              {paymentsData?.success && paymentsData?.data?.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        {(() => {
                          const displayYear =
                            i18n.language === "ps-AF" ||
                            i18n.language === "fa-AF"
                              ? gregorianYearToShamsi(selectedYear)
                              : selectedYear;
                          return selectedMonth === null
                            ? `Payment Summary - ${displayYear}`
                            : `Payment Summary - ${
                                monthNames[selectedMonth - 1]
                              } ${displayYear}`;
                        })()}
                      </h3>
                      <p className="text-sm text-blue-700">
                        {t("parentPortal.fees.paymentCount", {
                          count: paymentsData.data.length,
                        })}
                        {paymentFilters.startDate === `${selectedYear}-01-01` &&
                        paymentFilters.endDate === `${selectedYear}-12-31`
                          ? (() => {
                              const displayYear =
                                i18n.language === "ps-AF" ||
                                i18n.language === "fa-AF"
                                  ? gregorianYearToShamsi(selectedYear)
                                  : selectedYear;
                              return ` ${t("parentPortal.fees.forEntireYear", {
                                year: displayYear,
                              })}`;
                            })()
                          : ` ${t("parentPortal.fees.forSelectedRange")}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(
                          paymentsData.data.reduce(
                            (total: number, payment: any) =>
                              total + payment.amount,
                            0
                          )
                        )}
                      </p>
                      <p className="text-sm text-blue-700">
                        {paymentFilters.startDate === `${selectedYear}-01-01` &&
                        paymentFilters.endDate === `${selectedYear}-12-31`
                          ? (() => {
                              const displayYear =
                                i18n.language === "ps-AF" ||
                                i18n.language === "fa-AF"
                                  ? gregorianYearToShamsi(selectedYear)
                                  : selectedYear;
                              return t("parentPortal.fees.totalForYear", {
                                year: displayYear,
                              });
                            })()
                          : t("parentPortal.fees.totalAmount")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment List */}
              <div className="space-y-3">
                {loadingPayments ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">
                      {t("parentPortal.fees.loadingPayments")}
                    </p>
                  </div>
                ) : paymentsData?.success && paymentsData?.data?.length > 0 ? (
                  <>
                    {paymentsData.data.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {getStatusIcon(payment.status)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {payment.feeType ||
                                t("parentPortal.fees.generalFee")}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {payment.feeDescription ||
                                t("parentPortal.fees.paymentForSchoolFees")}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {payment.id} •{" "}
                              {t("parentPortal.fees.created")}:{" "}
                              {payment.createdAt
                                ? formatDate(payment.createdAt)
                                : "N/A"}
                            </p>
                            {payment.dueDate && (
                              <p className="text-xs text-gray-500">
                                {t("parentPortal.fees.due")}:{" "}
                                {formatDate(payment.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Info */}
                    {paymentsData.pagination && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        {t("parentPortal.fees.showingPayments", {
                          count: paymentsData.data.length,
                          total: paymentsData.pagination.total,
                        })}
                        {paymentsData.pagination.pages > 1 && (
                          <span>
                            {" "}
                            •{" "}
                            {t("parentPortal.fees.pageOf", {
                              current: paymentsData.pagination.page,
                              total: paymentsData.pagination.pages,
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2 flex items-center justify-center text-blue-600">
                      <svg
                        className="w-10 h-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1zm0 8h.01"
                        />
                      </svg>
                    </div>
                    <p>{t("parentPortal.fees.noPaymentsFound")}</p>
                    {(paymentFilters.startDate ||
                      paymentFilters.endDate ||
                      paymentFilters.status) && (
                      <p className="text-sm mt-2">
                        {t("parentPortal.fees.tryAdjustingFilters")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee Structure tab removed by request */}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Year Selector */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between ">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const displayYear =
                        i18n.language === "ps-AF" || i18n.language === "fa-AF"
                          ? gregorianYearToShamsi(selectedYear)
                          : selectedYear;
                      return t("parentPortal.fees.analyticsFor", {
                        year: displayYear,
                      });
                    })()}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {t("parentPortal.fees.year")}:
                    </span>
                    <select
                      key={`analytics-year-${selectedYear}`}
                      value={selectedYear}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        // console.log('Analytics year changed to:', newYear);
                        handleYearChange(newYear);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-black"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        const shamsiYear = gregorianYearToShamsi(year);
                        const displayYear =
                          i18n.language === "ps-AF" || i18n.language === "fa-AF"
                            ? `${shamsiYear}`
                            : `${year}`;
                        return (
                          <option key={year} value={year}>
                            {displayYear}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Analytics Summary */}
              {loadingAnalytics ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : analytics?.data ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-green-600 text-sm font-medium">
                      {t("parentPortal.fees.totalPaid")}
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(analytics.data.summary?.totalPaid || 0)}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-yellow-600 text-sm font-medium">
                      {t("parentPortal.fees.pending")}
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {formatCurrency(
                        analytics.data.summary?.totalPending || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-red-600 text-sm font-medium">
                      {t("parentPortal.fees.overdue")}
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                      {formatCurrency(
                        analytics.data.summary?.totalOverdue || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-blue-600 text-sm font-medium">
                      {t("parentPortal.fees.transactions")}
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {analytics.data.summary?.totalTransactions || 0}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2 flex items-center justify-center text-blue-600">
                    <svg
                      className="w-10 h-10"
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
                  <p>
                    {t("parentPortal.fees.noAnalyticsData", {
                      year: selectedYear,
                    })}
                  </p>
                </div>
              )}

              {/* Dynamic Mini Chart (pure CSS) */}
              {monthlySeries && monthlySeries.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                    {t("parentPortal.fees.monthlyPayments")}
                  </h3>
                  <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40 overflow-x-auto pb-2">
                    {monthlySeries.map((p, idx) => {
                      const max =
                        Math.max(...monthlySeries.map((s) => s.value)) || 1;
                      const height = Math.max(
                        4,
                        Math.round((p.value / max) * 140)
                      );
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center justify-end flex-shrink-0"
                        >
                          <div
                            title={`${p.label}: ${formatCurrency(p.value)}`}
                            className="w-4 sm:w-6 bg-blue-500/80 hover:bg-blue-600 transition-colors rounded cursor-pointer"
                            style={{ height }}
                          />
                          <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1 truncate w-6 sm:w-8 text-center">
                            {p.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeManagement;
