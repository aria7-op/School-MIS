import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Payroll } from "../types/finance";
import Tooltip from "./Tooltip";

interface PayrollListProps {
  payrolls: Payroll[];
  onAddPayroll?: () => void;
  onEditPayroll?: (payroll: Payroll) => void;
  onDeletePayroll?: (payrollId: number) => void;
  loading?: boolean;
  error?: string | null;
}

const PayrollList: React.FC<PayrollListProps> = ({
  payrolls,
  onAddPayroll,
  onEditPayroll,
  onDeletePayroll,
  loading = false,
  error = null,
}) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState<string>("");
  const [viewMode, setViewMode] = useState<"dashboard" | "table" | "list">(
    "dashboard"
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "completed" | "pending" | "cancelled"
  >("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1); // Reset to the first page when filters or sorting change
  }, [searchText, selectedFilter, selectedMonth, sortBy, sortOrder]);

  // Helper function to parse decimal format from API
  const parseDecimalValue = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    if (
      value &&
      typeof value === "object" &&
      value.d &&
      Array.isArray(value.d)
    ) {
      // Handle decimal format: {s: 1, e: 4, d: [11111]}
      // s: sign (0 = negative, 1 = positive)
      // e: decimal places, but for large numbers like salary, treat as whole number
      // d: array of digits
      const digits = value.d.join("");
      const sign = value.s === 1 ? 1 : -1; // s=1 means positive, s=0 means negative
      const decimalPlaces = value.e || 0;
      const number = parseFloat(digits);

      // Special handling for salary amounts - if the number is large (>= 1000), treat as whole number
      // This handles basicSalary and netSalary which should be 11111, not 1.1111
      if (number >= 1000) {
        return sign * number;
      }

      // For smaller amounts, use decimal places
      if (decimalPlaces === 0) {
        return sign * number;
      }

      // Apply decimal places for smaller amounts
      return (sign * number) / Math.pow(10, decimalPlaces);
    }
    return 0;
  };

  // Helper function to format date
  const formatDate = (dateValue: any): string => {
    if (
      !dateValue ||
      (typeof dateValue === "object" && Object.keys(dateValue).length === 0)
    ) {
      return "N/A";
    }
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Helper function to format salary month
  const formatSalaryMonth = (salaryMonth: any): string => {
    if (
      !salaryMonth ||
      (typeof salaryMonth === "object" && Object.keys(salaryMonth).length === 0)
    ) {
      return "N/A/N/A";
    }
    try {
      const date = new Date(salaryMonth);
      if (isNaN(date.getTime())) return "N/A/N/A";
      return `${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch {
      return "N/A/N/A";
    }
  };

  // Filter and search payrolls
  const filteredPayrolls = payrolls.filter((payroll) => {
    // Handle different possible field names for employee name
    const employeeName =
      payroll.employeeName ||
      payroll.name ||
      payroll.staffName ||
      payroll.teacherName ||
      t("finance.payroll.unknownEmployee");
    const employeeId =
      payroll.employeeId || payroll.id || payroll.staffId || "";

    const matchesSearch =
      employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
      (employeeId &&
        employeeId.toString().toLowerCase().includes(searchText.toLowerCase()));
    const matchesFilter =
      selectedFilter === "all" || payroll.status === selectedFilter;
    const matchesMonth =
      selectedMonth === "all" ||
      `${payroll.month || "N/A"}/${payroll.year || "N/A"}` === selectedMonth;

    return matchesSearch && matchesFilter && matchesMonth;
  });

  // Sort payrolls
  const sortedPayrolls = [...filteredPayrolls].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case "amount":
        const amountA = parseDecimalValue(a.netSalary);
        const amountB = parseDecimalValue(b.netSalary);
        comparison = amountA - amountB;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedPayrolls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedPayrolls.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get unique months
  const months = [
    "all",
    ...Array.from(
      new Set(
        payrolls
          .map((p) => `${p.month || "N/A"}/${p.year || "N/A"}`)
          .filter((month) => month !== "N/A/N/A")
      )
    ),
  ];

  // Calculate statistics
  const totalPayrolls = payrolls?.length || 0;

  const totalAmount =
    payrolls?.reduce((sum, p) => {
      return sum + parseDecimalValue(p.netSalary);
    }, 0) || 0;

  const pendingPayrolls =
    payrolls?.filter((p) => p.status === "pending").length || 0;
  const pendingAmount =
    payrolls
      ?.filter((p) => p.status === "pending")
      .reduce((sum, p) => {
        return sum + parseDecimalValue(p.netSalary);
      }, 0) || 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return { bg: "bg-green-100", text: "text-green-800" };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800" };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800" };
    }
  };

  // Map status values to translation keys
  const getStatusTranslationKey = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "paid";
      case "pending":
        return "pending";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  };

  // Human-friendly payment method label with graceful fallback
  const getMethodLabel = (method?: string) => {
    if (!method) return "Bank Transfer";
    const key = method.toLowerCase();
    const map: Record<string, string> = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      banktransfer: "Bank Transfer",
      check: "Check",
      cheque: "Check",
    };
    return map[key] || method;
  };

  const getSafeRemarks = (remarks: any): string | null => {
    if (!remarks) return null;
    if (typeof remarks === "string") {
      const trimmed = remarks.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const obj = JSON.parse(trimmed);
          // If only technical fields present, skip showing
          const keys = Object.keys(obj || {});
          if (
            keys.length === 0 ||
            (keys.length === 1 &&
              keys[0].toLowerCase().includes("recipientuserid"))
          ) {
            return null;
          }
          return trimmed; // show raw JSON if it has meaningful content
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }
    return null;
  };

  // Derive employee display name from multiple possible sources
  const getEmployeeName = (p: any): string => {
    const fromProp = p.employeeName || p.name || p.staffName || p.teacherName;
    const fromUser = p.user
      ? `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim()
      : "";
    const fromStaffUser =
      p.staff && p.staff.user
        ? `${p.staff.user.firstName || ""} ${
            p.staff.user.lastName || ""
          }`.trim()
        : "";
    const fromCreator = p.createdByUser
      ? `${p.createdByUser.firstName || ""} ${
          p.createdByUser.lastName || ""
        }`.trim()
      : "";
    const candidate = fromProp || fromUser || fromStaffUser || fromCreator;
    return candidate && candidate.trim().length > 0
      ? candidate
      : t("finance.payroll.unknownEmployee");
  };

  // Print a single payroll record in a new window (same behavior as submit print)
  const handlePrintPayroll = (payroll: Payroll) => {
    const employeeName =
      (payroll as any).employeeName ||
      (payroll as any).name ||
      (payroll as any).staffName ||
      (payroll as any).teacherName ||
      t("finance.payroll.unknownEmployee");
    const net = parseDecimalValue((payroll as any).netSalary).toFixed(2);
    const basic = parseDecimalValue((payroll as any).basicSalary).toFixed(2);
    const allow = parseDecimalValue((payroll as any).allowances).toFixed(2);
    const ded = parseDecimalValue((payroll as any).deductions).toFixed(2);
    const payDate = formatDate((payroll as any).paymentDate);
    const month = (payroll as any).month || "N/A";
    const year = (payroll as any).year || "N/A";

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Payroll Slip</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            .muted { color: #6B7280; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; }
            .total { font-size: 18px; font-weight: 700; color: #047857; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Payroll Slip</h1>
          <div class="muted">${new Date().toLocaleString()}</div>
          <div class="box">
            <div class="row"><div>Employee</div><div><strong>${employeeName}</strong></div></div>
            <div class="row"><div>Month/Year</div><div>${month}/${year}</div></div>
            <div class="row"><div>Payment Date</div><div>${payDate}</div></div>
            <div class="row"><div>Basic Salary</div><div>AFN ${basic}</div></div>
            <div class="row"><div>Allowances</div><div>AFN ${allow}</div></div>
            <div class="row"><div>Deductions</div><div>-AFN ${ded}</div></div>
            <div class="row"><div class="total">Net Salary</div><div class="total">AFN ${net}</div></div>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {t("finance.payroll.loadingPayrolls")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("finance.payroll.errorLoading")}
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // ... just before the final return statement ...

  const PaginationControls = () => {
    if (totalPages <= 1) {
      return null;
    }

    const getPageNumbers = () => {
      const pageNeighbours = 1;
      const totalNumbers = pageNeighbours * 2 + 3;
      const totalBlocks = totalNumbers + 2;

      if (totalPages > totalBlocks) {
        const startPage = Math.max(2, currentPage - pageNeighbours);
        const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
        let pages: (number | string)[] = [1];

        if (startPage > 2) {
          pages.push("...");
        }

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }

        if (endPage < totalPages - 1) {
          pages.push("...");
        }

        pages.push(totalPages);
        return pages;
      }
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    };

    return (
      <div className="flex items-center justify-center border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t("pagination.previous", "Previous")}
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t("pagination.next", "Next")}
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:flex-col sm:items-center sm:justify-center sm:gap-2">
          <div className="text-center">
            <p className="text-sm text-gray-700">
              {t("pagination.showing", "Showing")}{" "}
              <span className="font-medium">
                {sortedPayrolls.length > 0 ? startIndex + 1 : 0}
              </span>{" "}
              {t("pagination.to", "to")}{" "}
              <span className="font-medium">
                {Math.min(endIndex, sortedPayrolls.length)}
              </span>{" "}
              {t("pagination.of", "of")}{" "}
              <span className="font-medium">{sortedPayrolls.length}</span>{" "}
              {t("pagination.results", "results")}
            </p>
          </div>
          <div className="flex justify-center">
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">
                  {t("pagination.previous", "Previous")}
                </span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {getPageNumbers().map((page, index) =>
                typeof page === "string" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === page
                        ? "z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">{t("pagination.next", "Next")}</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("finance.payroll.title")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("finance.payroll.subtitle")}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                  viewMode === "dashboard"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
                title={t("finance.payroll.dashboard")}
              >
                {viewMode === "dashboard" ? (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                )}
                <span className="hidden sm:inline">
                  {t("finance.payroll.dashboard")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                  viewMode === "table"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
                title={t("finance.payroll.table")}
              >
                {viewMode === "table" ? (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                )}
                <span className="hidden sm:inline">
                  {t("finance.payroll.table")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                  viewMode === "list"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
                title={t("finance.payroll.list")}
              >
                {viewMode === "list" ? (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
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
                )}
                <span className="hidden sm:inline">
                  {t("finance.payroll.list")}
                </span>
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
              placeholder={t("finance.payroll.searchPlaceholder")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">{t("finance.payroll.allStatus")}</option>
            <option value="completed">{t("finance.payroll.completed")}</option>
            <option value="pending">{t("finance.payroll.pending")}</option>
            <option value="cancelled">{t("finance.payroll.cancelled")}</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month === "all" ? t("finance.payroll.allMonths") : month}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="date-desc">{t("finance.payroll.dateNewest")}</option>
            <option value="date-asc">{t("finance.payroll.dateOldest")}</option>
            <option value="amount-desc">
              {t("finance.payroll.amountHighToLow")}
            </option>
            <option value="amount-asc">
              {t("finance.payroll.amountLowToHigh")}
            </option>
            <option value="status-asc">{t("finance.payroll.statusAZ")}</option>
            <option value="status-desc">{t("finance.payroll.statusZA")}</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1 sm:gap-6">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("finance.payroll.totalPayrolls")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalPayrolls}
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
                {t("finance.payroll.totalAmount")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                AFN {(totalAmount || 0).toFixed(2)}
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
                {t("finance.payroll.pending")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingPayrolls}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-orange-600"
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
                {t("finance.payroll.pendingAmount")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                AFN {(pendingAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payrolls Display based on viewMode */}
      {/* Payrolls Display based on viewMode */}
      {viewMode === "dashboard" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("finance.payroll.payrollList")} ({sortedPayrolls.length})
            </h3>
          </div>

          {sortedPayrolls.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("finance.payroll.noPayrollsFound")}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchText ||
                selectedFilter !== "all" ||
                selectedMonth !== "all"
                  ? t("finance.payroll.noPayrollsFoundDesc")
                  : t("finance.payroll.startAddingPayroll")}
              </p>
              {!searchText &&
                selectedFilter === "all" &&
                selectedMonth === "all" && (
                  <button
                    onClick={onAddPayroll}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t("finance.payroll.addPayroll")}
                  </button>
                )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {currentItems.map(
                  (
                    payroll // <-- USES currentItems
                  ) => (
                    <div
                      key={payroll.id}
                      className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="text-base sm:text-lg font-medium text-gray-900">
                              {getEmployeeName(payroll as any)}
                            </h4>
                            <span
                              className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                getStatusColor(payroll.status || "pending").bg
                              } ${
                                getStatusColor(payroll.status || "pending").text
                              }`}
                            >
                              {t(
                                `finance.payroll.status.${getStatusTranslationKey(
                                  payroll.status || "pending"
                                )}`
                              )}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                />
                              </svg>
                              <span className="whitespace-nowrap">
                                ID:{" "}
                                {payroll.employeeId ||
                                  payroll.id ||
                                  payroll.staffId ||
                                  "N/A"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4 flex-shrink-0"
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
                              <span className="whitespace-nowrap">
                                {formatSalaryMonth(
                                  (payroll as any).salaryMonth
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4 flex-shrink-0"
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
                              <span className="whitespace-nowrap">
                                {getMethodLabel((payroll as any).method)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <p className="text-gray-500">
                                {t("finance.payroll.basicSalary")}
                              </p>
                              <p className="font-medium">
                                AFN{" "}
                                {parseDecimalValue(payroll.basicSalary).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">
                                {t("finance.payroll.allowances")}
                              </p>
                              <p className="font-medium">
                                AFN{" "}
                                {parseDecimalValue(payroll.allowances).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">
                                {t("finance.payroll.deductions")}
                              </p>
                              <p className="font-medium text-red-600">
                                -AFN{" "}
                                {parseDecimalValue(payroll.deductions).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">
                                {t("finance.payroll.paymentDate")}
                              </p>
                              <p className="font-medium">
                                {formatDate(payroll.paymentDate)}
                              </p>
                            </div>
                          </div>

                          {getSafeRemarks(payroll.remarks) && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-2">
                              {getSafeRemarks(payroll.remarks)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                          <div className="text-left sm:text-right">
                            <p className="text-lg sm:text-xl font-semibold text-green-600">
                              AFN{" "}
                              {parseDecimalValue(payroll.netSalary).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("finance.payroll.netSalary")}
                            </p>
                          </div>

                          {/* Print payroll */}
                          <button
                            onClick={() => handlePrintPayroll(payroll)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0"
                            title={t("finance.actions.print") as string}
                            aria-label={t("finance.actions.print") as string}
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
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3h10z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
              <PaginationControls />
            </>
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("finance.payroll.payrollList")} ({sortedPayrolls.length})
            </h3>
          </div>

          {sortedPayrolls.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("finance.payroll.noPayrollsFound")}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchText ||
                selectedFilter !== "all" ||
                selectedMonth !== "all"
                  ? t("finance.payroll.noPayrollsFoundDesc")
                  : t("finance.payroll.startAddingPayroll")}
              </p>
              {!searchText &&
                selectedFilter === "all" &&
                selectedMonth === "all" && (
                  <button
                    onClick={onAddPayroll}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t("finance.payroll.addPayroll")}
                  </button>
                )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.employee")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.salaryMonth")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.basicSalary")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.allowances")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.deductions")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.netSalary")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.statusLabel")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.payroll.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map(
                      (
                        payroll // <-- USES currentItems
                      ) => (
                        <tr key={payroll.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {getEmployeeName(payroll as any)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID:{" "}
                                  {payroll.employeeId ||
                                    payroll.id ||
                                    payroll.staffId ||
                                    "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatSalaryMonth((payroll as any).salaryMonth)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            AFN{" "}
                            {parseDecimalValue(payroll.basicSalary).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            AFN{" "}
                            {parseDecimalValue(payroll.allowances).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -AFN{" "}
                            {parseDecimalValue(payroll.deductions).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              AFN{" "}
                              {parseDecimalValue(payroll.netSalary).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                getStatusColor(payroll.status || "pending").bg
                              } ${
                                getStatusColor(payroll.status || "pending").text
                              }`}
                            >
                              {t(
                                `finance.payroll.status.${getStatusTranslationKey(
                                  payroll.status || "pending"
                                )}`
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handlePrintPayroll(payroll)}
                              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                              title={t("finance.actions.print") as string}
                              aria-label={t("finance.actions.print") as string}
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
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3h10z"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls /> {/* <-- PAGINATION ADDED HERE */}
            </>
          )}
        </div>
      )}

      {viewMode === "list" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("finance.payroll.payrollList")} ({sortedPayrolls.length})
            </h3>
          </div>

          {sortedPayrolls.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("finance.payroll.noPayrollsFound")}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchText ||
                selectedFilter !== "all" ||
                selectedMonth !== "all"
                  ? t("finance.payroll.noPayrollsFoundDesc")
                  : t("finance.payroll.startAddingPayroll")}
              </p>
              {!searchText &&
                selectedFilter === "all" &&
                selectedMonth === "all" && (
                  <button
                    onClick={onAddPayroll}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t("finance.payroll.addPayroll")}
                  </button>
                )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {currentItems.map(
                  (
                    payroll // <-- USES currentItems
                  ) => (
                    <div
  key={payroll.id}
  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
>
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
        <h4 className="text-base sm:text-lg font-medium text-gray-900">
          {getEmployeeName(payroll as any)}
        </h4>
        <span
          className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            getStatusColor(payroll.status || "pending").bg
          } ${
            getStatusColor(payroll.status || "pending").text
          }`}
        >
          {t(
            `finance.payroll.status.${getStatusTranslationKey(
              payroll.status || "pending"
            )}`
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
            />
          </svg>
          <span className="whitespace-nowrap">
            ID:{" "}
            {payroll.employeeId ||
              payroll.id ||
              payroll.staffId ||
              "N/A"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
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
          <span className="whitespace-nowrap">
            {formatSalaryMonth(
              (payroll as any).salaryMonth
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
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
          <span className="whitespace-nowrap">
            {getMethodLabel((payroll as any).method)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
        <div>
          <p className="text-gray-500">
            {t("finance.payroll.basicSalary")}
          </p>
          <p className="font-medium">
            AFN{" "}
            {parseDecimalValue(payroll.basicSalary).toFixed(
              2
            )}
          </p>
        </div>
        <div>
          <p className="text-gray-500">
            {t("finance.payroll.allowances")}
          </p>
          <p className="font-medium">
            AFN{" "}
            {parseDecimalValue(payroll.allowances).toFixed(
              2
            )}
          </p>
        </div>
        <div>
          <p className="text-gray-500">
            {t("finance.payroll.deductions")}
          </p>
          <p className="font-medium text-red-600">
            -AFN{" "}
            {parseDecimalValue(payroll.deductions).toFixed(
              2
            )}
          </p>
        </div>
        <div>
          <p className="text-gray-500">
            {t("finance.payroll.paymentDate")}
          </p>
          <p className="font-medium">
            {formatDate(payroll.paymentDate)}
          </p>
        </div>
      </div>

      {getSafeRemarks(payroll.remarks) && (
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          {getSafeRemarks((payroll as any).remarks)}
        </p>
      )}
    </div>

    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
      <div className="text-left sm:text-right">
        <p className="text-lg sm:text-xl font-semibold text-green-600">
          AFN{" "}
          {parseDecimalValue(payroll.netSalary).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          {t("finance.payroll.netSalary")}
        </p>
      </div>

      {/* Print payroll */}
      <button
        onClick={() => handlePrintPayroll(payroll)}
        className="p-2 text-gray-400 hover:text-purple-600 transition-colors flex-shrink-0"
        title={t("finance.actions.print") as string}
        aria-label={t("finance.actions.print") as string}
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
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v3h10z"
          />
        </svg>
      </button>
    </div>
  </div>
</div>
                  )
                )}
              </div>
              <PaginationControls />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollList;
