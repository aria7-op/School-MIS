import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaExclamationTriangle,
  FaTimes,
  FaChartPie,
  FaCalendarAlt,
  FaSchool,
  FaSearch,
} from "react-icons/fa";
import superadminService from "../../services/superadminService";

interface ExpensesDetailViewProps {
  dateRange: { startDate: string; endDate: string };
  onClose: () => void;
}

const ExpensesDetailView: React.FC<ExpensesDetailViewProps> = ({
  dateRange,
  onClose,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ["expense-analytics", dateRange],
    queryFn: () => superadminService.getExpenseAnalytics(dateRange),
  });

  const { data: financialOverview } = useQuery({
    queryKey: ["financial-overview", dateRange],
    queryFn: () => superadminService.getFinancialOverview(dateRange),
  });

  const expenses = expensesData?.data || expensesData;
  const overview =
    financialOverview?.data?.summary || financialOverview?.summary;

  // Filter expenses by search term
  const topExpenses = expenses?.topExpenses || [];
  const filteredExpenses = topExpenses.filter(
    (expense: any) =>
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.school?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Salaries: "bg-blue-100 text-blue-700 border-blue-200",
      Utilities: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Maintenance: "bg-orange-100 text-orange-700 border-orange-200",
      Supplies: "bg-green-100 text-green-700 border-green-200",
      Equipment: "bg-purple-100 text-purple-700 border-purple-200",
      Other: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-orange-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {t(
                  "superadmin.details.expensesBreakdown",
                  "Expenses Breakdown"
                )}
              </h2>
              <p className="text-orange-100 mt-1">
                {t(
                  "superadmin.details.detailedExpenseAnalysis",
                  "Detailed expense analysis and categorization"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-500 rounded-lg transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <>
              {/* Main Expense Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.totalExpenses", "Total Expenses")}
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {formatCurrency(
                        expenses?.totalExpenses || overview?.totalExpenses || 0
                      )}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.avgExpense", "Avg Expense")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(expenses?.avgExpenseValue || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t(
                        "superadmin.details.totalTransactions",
                        "Total Transactions"
                      )}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {overview?.totalExpenseTransactions || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expenses by Category */}
              {expenses?.expensesByCategory &&
                expenses.expensesByCategory.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaChartPie className="w-5 h-5 text-orange-600" />
                      {t(
                        "superadmin.details.expensesByCategory",
                        "Expenses by Category"
                      )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expenses.expensesByCategory.map(
                        (category: any, index: number) => {
                          const totalExpenses = expenses?.totalExpenses || 1;
                          const percentage = (
                            (category.amount / totalExpenses) *
                            100
                          ).toFixed(1);
                          return (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FaChartPie className="w-4 h-4 text-orange-600" />
                                  </div>
                                  <p className="font-semibold text-gray-900">
                                    {category.category ||
                                      t(
                                        "superadmin.details.uncategorized",
                                        "Uncategorized"
                                      )}
                                  </p>
                                </div>
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                                  {percentage}%
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">
                                    {t("superadmin.details.amount", "Amount")}
                                  </span>
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(category.amount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">
                                    {t(
                                      "superadmin.details.transactions",
                                      "Transactions"
                                    )}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {category.count}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div
                                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Expenses by Period */}
              {expenses?.expensesByPeriod &&
                expenses.expensesByPeriod.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="w-5 h-5 text-orange-600" />
                      {t(
                        "superadmin.details.expensesByPeriod",
                        "Expenses by Period"
                      )}
                    </h3>
                    <div className="space-y-3">
                      {expenses.expensesByPeriod.map(
                        (period: any, index: number) => {
                          const maxAmount = Math.max(
                            ...expenses.expensesByPeriod.map(
                              (p: any) => p.amount
                            )
                          );
                          const percentage = (period.amount / maxAmount) * 100;
                          return (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {period.period}
                                </span>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(period.amount)}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {period.count}{" "}
                                    {t(
                                      "superadmin.details.transactions",
                                      "transactions"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Top Expenses List */}
              {topExpenses.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
                      {t("superadmin.details.topExpenses", "Top Expenses")}
                    </h3>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-8 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={t(
                          "superadmin.details.searchExpenses",
                          "Search expenses by description, category, or school..."
                        )}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {t(
                          "superadmin.details.noExpensesFound",
                          "No expenses found matching your search"
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredExpenses.map((expense: any, index: number) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
                                    expense.category
                                  )}`}
                                >
                                  {expense.category ||
                                    t(
                                      "superadmin.details.uncategorized",
                                      "Uncategorized"
                                    )}
                                </span>
                                {expense.school?.name && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <FaSchool className="w-3 h-3" />
                                    <span>{expense.school.name}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-900 font-medium mb-1">
                                {expense.description ||
                                  t(
                                    "superadmin.details.noDescription",
                                    "No description"
                                  )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  expense.createdAt
                                ).toLocaleDateString()}{" "}
                                •{" "}
                                {new Date(
                                  expense.createdAt
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold text-orange-600">
                                {formatCurrency(expense.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpensesDetailView;
