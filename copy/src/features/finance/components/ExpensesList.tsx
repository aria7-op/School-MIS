import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Expense } from "../types/finance";
import Tooltip from "./Tooltip";
import ExpenseBillModal, { ExpenseBillData } from "./ExpenseBillModal";

interface ExpensesListProps {
  expenses: Expense[];
  onAddExpense?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: number) => void;
  loading?: boolean;
  error?: string | null;
}

const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  loading = false,
  error = null,
}) => {
  const { t } = useTranslation();
  // Debug logging
  console.log("🔍 ExpensesList received expenses:", expenses);
  console.log("🔍 ExpensesList loading:", loading);
  console.log("🔍 ExpensesList error:", error);
  const [searchText, setSearchText] = useState<string>("");
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] =
    useState<Expense | null>(null);

  const handlePrintExpense = (expense: Expense) => {
    setSelectedExpenseForPrint(expense);
    setShowBillModal(true);
  };

  const buildBillData = (expense: Expense): ExpenseBillData => {
    return {
      title: expense.title,
      description: expense.description,
      amount: Number(expense.amount || 0),
      category: expense.category,
      date: expense.date,
      status: expense.status,
      method: expense.method,
      receiptNumber: expense.receiptNumber,
      remarks: expense.remarks,
      createdBy: String(expense.createdBy || "Admin"),
      expenseId: String(expense.id),
    };
  };

  const handlePrintReceipt = () => {
    if (!selectedExpenseForPrint) return;

    const formatCurrency = (amount: number) =>
      `AFN ${Number(amount || 0).toLocaleString()}`;
    const formatDate = (dateString: string) => {
      let dateStr = dateString;
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        dateStr = `${dateStr}T00:00:00Z`;
      }
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Expense Receipt</title>
<style>
*{box-sizing:border-box}body{font-family:Arial, sans-serif; color:#000}
.container{width:7.6in; margin:0 auto; padding:0.4in}
.header{text-align:center; margin-bottom:10px}
.table{width:100%; border-collapse:collapse; font-size:13px; margin-bottom:8px}
.table th,.table td{border:1px solid #000; padding:4px; text-align:left}
.table .text-right{text-align:right}
.row{display:flex; justify-content:space-between; font-size:13px; margin:4px 0}
.footer{text-align:center; margin-top:10px; font-size:11px}
.amount{color:#dc2626; font-weight:bold; font-size:14px}
@page{size:7.8in 10.11in; margin:0}
@media print{button{display:none}}
</style></head>
<body>
<div class="container">
  <div class="header">
    <h3 style="margin:0; font-size:16px">Kawish Educational Complex</h3>
    <div style="margin-top:3px; font-size:13px">Expense Receipt</div>
    <div style="margin-top:3px; font-size:11px">Receipt #: ${
      selectedExpenseForPrint.receiptNumber ||
      selectedExpenseForPrint.id ||
      "Generated"
    }</div>
  </div>
  <div class="row"><div>Expense Title: <strong>${
    selectedExpenseForPrint.title
  }</strong></div><div>Date: <strong>${formatDate(
        selectedExpenseForPrint.date
      )}</strong></div></div>
  <div class="row"><div>Category: <strong>${
    selectedExpenseForPrint.category
  }</strong></div><div>Method: <strong>${
        selectedExpenseForPrint.method
      }</strong></div></div>
  <div class="row"><div>Status: <strong>${
    selectedExpenseForPrint.status
  }</strong></div><div>Amount: <span class="amount">${formatCurrency(
        Number(selectedExpenseForPrint.amount || 0)
      )}</span></div></div>
  ${
    selectedExpenseForPrint.description
      ? `<div class="row"><div>Description: <strong>${selectedExpenseForPrint.description}</strong></div><div></div></div>`
      : ""
  }
  <table class="table">
    <tr><th>Expense Details</th><th class="text-right">Amount</th></tr>
    <tr><td>${
      selectedExpenseForPrint.title
    }</td><td class="text-right">${formatCurrency(
        Number(selectedExpenseForPrint.amount || 0)
      )}</td></tr>
    <tr style="font-weight:bold"><td>Total Amount</td><td class="text-right">${formatCurrency(
      Number(selectedExpenseForPrint.amount || 0)
    )}</td></tr>
  </table>
  ${
    selectedExpenseForPrint.remarks
      ? `<p style="font-size:12px; margin:6px 0"><strong>Remarks:</strong> ${selectedExpenseForPrint.remarks}</p>`
      : ""
  }
  <p style="text-align:center; margin:8px 0; font-size:12px">Expense of ${formatCurrency(
    Number(selectedExpenseForPrint.amount || 0)
  )} for ${selectedExpenseForPrint.title} in ${
        selectedExpenseForPrint.category
      } category, processed on ${formatDate(selectedExpenseForPrint.date)}</p>
  <div class="row" style="margin-top:12px">
    <div style="text-align:center; width:45%"><hr style="margin:0 0 4px 0"/><div style="font-size:12px"><strong>Created By</strong></div><div style="font-size:12px">${
      selectedExpenseForPrint.createdBy || "Admin"
    }</div></div>
    <div style="text-align:center; width:45%"><hr style="margin:0 0 4px 0"/><div style="font-size:12px"><strong>Manager</strong></div><div style="font-size:12px">Rahmani</div></div>
  </div>
  <div class="footer">
    <div>Address: Makroyan 4 Azizi Plaza Kabul Afghanistan</div>
    <div>Email: --- , Phone: 0730774777</div>
    <div style="margin-top:3px">This expense receipt is for accounting purposes.</div>
  </div>
</div>
</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };
  const [viewMode, setViewMode] = useState<"dashboard" | "table" | "list">(
    "dashboard"
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "completed" | "pending" | "cancelled"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1); // Reset to the first page when filters or sorting change
  }, [searchText, selectedFilter, selectedCategory, sortBy, sortOrder]);

  // Filter and search expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      (expense.description?.toLowerCase() || "").includes(
        searchText.toLowerCase()
      ) ||
      (expense.category?.toLowerCase() || "").includes(
        searchText.toLowerCase()
      );
    const matchesFilter =
      selectedFilter === "all" ||
      expense.status.toLowerCase() === selectedFilter;
    const matchesCategory =
      selectedCategory === "all" || expense.category === selectedCategory;

    console.log("🔍 Filtering expense:", {
      id: expense.id,
      description: expense.description,
      category: expense.category,
      status: expense.status,
      searchText,
      selectedFilter,
      selectedCategory,
      matchesSearch,
      matchesFilter,
      matchesCategory,
      passes: matchesSearch && matchesFilter && matchesCategory,
    });

    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        comparison = dateA.getTime() - dateB.getTime();
        console.log("🔍 Date comparison:", {
          dateA: a.date,
          dateB: b.date,
          comparison,
        });
        break;
      case "amount":
        const amountA = Number(
          a.amount || a.total || a.expenseAmount || a.cost || 0
        );
        const amountB = Number(
          b.amount || b.total || b.expenseAmount || b.cost || 0
        );
        comparison = amountA - amountB;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Debug logging for processed data
  console.log("🔍 Filtered expenses:", filteredExpenses);
  console.log("🔍 Sorted expenses:", sortedExpenses);

  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedExpenses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get unique categories
  const categories = [
    "all",
    ...Array.from(new Set(expenses.map((e) => e.category))),
  ];

  // Calculate statistics
  const totalExpenses = expenses?.length || 0;

  const totalAmount =
    expenses?.reduce((sum, e) => {
      // Try different possible field names for expense amount
      const amount = e.amount || e.total || e.expenseAmount || e.cost || 0;
      return sum + (Number(amount) || 0);
    }, 0) || 0;

  const pendingExpenses =
    expenses?.filter((e) => e.status === "pending").length || 0;
  const pendingAmount =
    expenses
      ?.filter((e) => e.status === "pending")
      .reduce((sum, e) => {
        const amount = e.amount || e.total || e.expenseAmount || e.cost || 0;
        return sum + (Number(amount) || 0);
      }, 0) || 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return { bg: "bg-green-100", text: "text-green-800" };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800" };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {t("finance.expenses.loadingExpenses")}
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
            {t("finance.expenses.errorLoading")}
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // ... just before the final return statement ...

  const PaginationControls = () => {
    if (totalPages <= 1) {
      return null; // Don't render pagination if there's only one page
    }

    // Creates page numbers with ellipses for many pages (e.g., 1 ... 4 5 6 ... 10)
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
        {/* Mobile View */}
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

        {/* Desktop View */}
        <div className="hidden sm:flex sm:flex-1 sm:flex-col sm:items-center sm:justify-center sm:gap-2">
          <div className="text-center">
            <p className="text-sm text-gray-700">
              {t("pagination.showing", "Showing")}{" "}
              <span className="font-medium">
                {sortedExpenses.length > 0 ? startIndex + 1 : 0}
              </span>{" "}
              {t("pagination.to", "to")}{" "}
              <span className="font-medium">
                {Math.min(endIndex, sortedExpenses.length)}
              </span>{" "}
              {t("pagination.of", "of")}{" "}
              <span className="font-medium">{sortedExpenses.length}</span>{" "}
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
    <div className="space-y-1">
      {/* Header with Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("finance.expenses.title")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("finance.expenses.manageAndTrack")}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "dashboard"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
                title={t("finance.expenses.dashboard")}
              >
                {viewMode === "dashboard" ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                ) : (
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline">
                  {t("finance.expenses.dashboard")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
                title={t("finance.expenses.table")}
              >
                {viewMode === "table" ? (
                  <svg
                    className="w-5 h-5"
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
                )}
                <span className="hidden sm:inline">
                  {t("finance.expenses.table")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "list"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`}
                title={t("finance.expenses.list")}
              >
                {viewMode === "list" ? (
                  <svg
                    className="w-5 h-5"
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
                )}
                <span className="hidden sm:inline">
                  {t("finance.expenses.list")}
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
              placeholder={t("finance.expenses.searchPlaceholder")}
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
            <option value="all">{t("finance.expenses.allStatus")}</option>
            <option value="paid">{t("finance.expenses.paid")}</option>
            <option value="pending">{t("finance.expenses.pending")}</option>
            <option value="approved">{t("finance.expenses.approved")}</option>
            <option value="rejected">{t("finance.expenses.rejected")}</option>
            <option value="cancelled">{t("finance.expenses.cancelled")}</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all"
                  ? t("finance.expenses.allCategories")
                  : category}
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
            <option value="date-desc">
              {t("finance.expenses.dateNewest")}
            </option>
            <option value="date-asc">{t("finance.expenses.dateOldest")}</option>
            <option value="amount-desc">
              {t("finance.expenses.amountHighToLow")}
            </option>
            <option value="amount-asc">
              {t("finance.expenses.amountLowToHigh")}
            </option>
            <option value="status-asc">{t("finance.expenses.statusAZ")}</option>
            <option value="status-desc">
              {t("finance.expenses.statusZA")}
            </option>
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("finance.expenses.totalExpenses")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalExpenses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("finance.expenses.totalAmount")}
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
                {t("finance.expenses.pending")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingExpenses}
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
                {t("finance.expenses.pendingAmount")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                AFN {(pendingAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Display based on viewMode */}
      {viewMode === "dashboard" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("finance.expenses.expensesList")} ({sortedExpenses.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {sortedExpenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("finance.expenses.noExpensesFound")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchText ||
                  selectedFilter !== "all" ||
                  selectedCategory !== "all"
                    ? t("finance.expenses.noExpensesFoundDesc")
                    : t("finance.expenses.startAddingExpense")}
                </p>
              </div>
            ) : (
              currentItems.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900">
                          {expense.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            getStatusColor(expense.status).bg
                          } ${getStatusColor(expense.status).text}`}
                        >
                          {t(
                            `finance.expenses.${expense.status.toLowerCase()}`
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <span className="whitespace-nowrap">
                            {expense.category}
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
                            {(() => {
                              let dateStr = expense.date || expense.createdAt;
                              // If date is in YYYY-MM-DD format, append time to avoid timezone shift
                              if (
                                dateStr &&
                                /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
                              ) {
                                dateStr = `${dateStr}T00:00:00Z`;
                              }
                              return new Date(dateStr).toLocaleDateString();
                            })()}
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
                            {expense.method}
                          </span>
                        </div>
                      </div>

                      {expense.remarks && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                          {expense.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-xl font-semibold text-red-600">
                          -AFN{" "}
                          {Number(
                            expense.amount ||
                              expense.total ||
                              expense.expenseAmount ||
                              expense.cost ||
                              0
                          ).toFixed(2)}
                        </p>
                        {expense.receiptNumber && (
                          <p className="text-xs text-gray-500">
                            {t("finance.expenses.receiptNumber")}:{" "}
                            {expense.receiptNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* <Tooltip
                          content={t("finance.expenses.editExpenseRecord")}
                        >
                          <button
                            onClick={() => onEditExpense?.(expense)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </Tooltip> */}

                        {/* <Tooltip
                           content={t("finance.expenses.deleteExpenseRecord")}
                         >
                           <button
                             onClick={() => onDeleteExpense?.(expense.id)}
                             className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                                 d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                               />
                             </svg>
                           </button>
                         </Tooltip> */}

                        <Tooltip
                          content={t("finance.actions.print") || "Print"}
                        >
                          <button
                            onClick={() => handlePrintExpense(expense)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
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
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                              />
                            </svg>
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls />
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("finance.expenses.expensesList")} ({sortedExpenses.length})
            </h3>
          </div>

          {sortedExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("finance.expenses.noExpensesFound")}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchText ||
                selectedFilter !== "all" ||
                selectedCategory !== "all"
                  ? t("finance.expenses.noExpensesFoundDesc")
                  : t("finance.expenses.startAddingExpense")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.expenses.description")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.expenses.category")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.expenses.date")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.expenses.amount")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.expenses.statusLabel")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("finance.expenses.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map(
                      (
                        expense // <-- USES currentItems
                      ) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">
                              -AFN{" "}
                              {Number(
                                expense.amount ||
                                  expense.total ||
                                  expense.expenseAmount ||
                                  expense.cost ||
                                  0
                              ).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                getStatusColor(expense.status).bg
                              } ${getStatusColor(expense.status).text}`}
                            >
                              {t(
                                `finance.expenses.${expense.status.toLowerCase()}`
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {/* <Tooltip
                                content={t(
                                  "finance.expenses.editExpenseRecord"
                                )}
                              >
                                <button
                                  onClick={() => onEditExpense?.(expense)}
                                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
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
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                              </Tooltip>

                              <Tooltip
                                content={t(
                                  "finance.expenses.deleteExpenseRecord"
                                )}
                              >
                                <button
                                  onClick={() => onDeleteExpense?.(expense.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </Tooltip> */}
                              <Tooltip
                                content={t("finance.actions.print") || "Print"}
                              >
                                <button
                                  onClick={() => handlePrintExpense(expense)}
                                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
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
                                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                    />
                                  </svg>
                                </button>
                              </Tooltip>
                            </div>
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
              {t("finance.expenses.expensesList")} ({sortedExpenses.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {sortedExpenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("finance.expenses.noExpensesFound")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchText ||
                  selectedFilter !== "all" ||
                  selectedCategory !== "all"
                    ? t("finance.expenses.noExpensesFoundDesc")
                    : t("finance.expenses.startAddingExpense")}
                </p>
              </div>
            ) : (
              currentItems.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900">
                          {expense.description}
                        </h4>
                        <span
                          className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            getStatusColor(expense.status).bg
                          } ${getStatusColor(expense.status).text}`}
                        >
                          {t(
                            `finance.expenses.${expense.status.toLowerCase()}`
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          <span className="whitespace-nowrap">
                            {expense.category}
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
                            {new Date(expense.date).toLocaleDateString()}
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
                            {expense.method}
                          </span>
                        </div>
                      </div>

                      {expense.remarks && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                          {expense.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-xl font-semibold text-red-600">
                          -$
                          {Number(
                            expense.amount ||
                              expense.total ||
                              expense.expenseAmount ||
                              expense.cost ||
                              0
                          ).toFixed(2)}
                        </p>
                        {expense.receiptNumber && (
                          <p className="text-xs text-gray-500">
                            {t("finance.expenses.receiptNumber")}:{" "}
                            {expense.receiptNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* <Tooltip
          content={t("finance.expenses.editExpenseRecord")}
        >
          <button
            onClick={() => onEditExpense?.(expense)}
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </Tooltip>

        <Tooltip
          content={t("finance.expenses.deleteExpenseRecord")}
        >
          <button
            onClick={() => onDeleteExpense?.(expense.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </Tooltip> */}
                        <Tooltip
                          content={t("finance.actions.print") || "Print"}
                        >
                          <button
                            onClick={() => handlePrintExpense(expense)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
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
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                              />
                            </svg>
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <PaginationControls />
        </div>
      )}

      {/* Expense Bill Modal */}
      {selectedExpenseForPrint && (
        <ExpenseBillModal
          visible={showBillModal}
          billData={
            selectedExpenseForPrint
              ? buildBillData(selectedExpenseForPrint)
              : null
          }
          onClose={() => {
            setShowBillModal(false);
            setSelectedExpenseForPrint(null);
          }}
          onPrint={handlePrintReceipt}
        />
      )}
    </div>
  );
};

export default ExpensesList;
