import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaDollarSign,
  FaChartLine,
  FaExchangeAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import {
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
  LineChart,
  Line,
} from "recharts";
import superadminService from "../services/superadminService";
import secureApiService from "../../../services/secureApiService";
import {
  usePayments,
  useExpenses,
  usePayrolls,
  useFinanceStats,
  useUpdateExpense,
  useDeleteExpense,
  useUpdatePayroll,
  useDeletePayroll,
} from "../../finance/services/financeService";

interface Props {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
  selectedCourseId?: string | null;
  onProfitClick?: () => void;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

const toNumber = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const parseNum = (val: any) => toNumber(val);

const formatCurrency = (amount: any) => {
  const n = toNumber(amount);
  return `AFN ${Math.round(n).toLocaleString("en-US")}`;
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

const FinancialAnalyticsDashboard: React.FC<Props> = ({
  dateRange,
  selectedSchoolId,
  selectedBranchId,
  selectedCourseId,
  onProfitClick,
}) => {
  const { t } = useTranslation();
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // Sync internal selection with props from SuperadminDashboard
  useEffect(() => {
    if (selectedSchoolId !== undefined) {
      setSelectedSchool(selectedSchoolId ?? "");
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (selectedCourseId !== undefined) {
      setSelectedCourse(selectedCourseId ?? "");
    }
  }, [selectedCourseId]);

  // Fetch financial overview
  const { data: financialOverview, isLoading: overviewLoading } = useQuery({
    queryKey: [
      "financial-overview",
      dateRange,
      selectedSchool,
      selectedBranchId ?? null,
      selectedCourse ?? null,
    ],
    queryFn: () =>
      superadminService.getFinancialOverview({
        ...dateRange,
        ...(selectedSchool && { schoolId: selectedSchool }),
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCourse && { courseId: selectedCourse }),
      }),
  });

  // Fetch revenue analytics
  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: [
      "revenue-analytics",
      dateRange,
      selectedSchool,
      selectedBranchId ?? null,
      selectedCourse ?? null,
    ],
    queryFn: () =>
      superadminService.getRevenueAnalytics({
        ...(selectedSchool && { schoolId: selectedSchool }),
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCourse && { courseId: selectedCourse }),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  // Fetch expenses using finance service hook
  const { data: expenseData, isLoading: expenseLoading } = useExpenses({
    dateRange,
    ...(selectedSchool && { schoolId: selectedSchool }),
    ...(selectedBranchId && { branchId: selectedBranchId }),
    ...(selectedCourse && { courseId: selectedCourse }),
  });

  // Fetch payments using finance service hook
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({
    dateRange,
    ...(selectedSchool && { schoolId: selectedSchool }),
    ...(selectedBranchId && { branchId: selectedBranchId }),
    ...(selectedCourse && { courseId: selectedCourse }),
  });

  // Fetch payrolls using finance service hook
  const { data: payrollData, isLoading: payrollLoading } = usePayrolls({
    dateRange,
    ...(selectedSchool && { schoolId: selectedSchool }),
    ...(selectedBranchId && { branchId: selectedBranchId }),
    ...(selectedCourse && { courseId: selectedCourse }),
  });

  // Fetch finance stats using finance service hook
  const { data: financeStatsData, isLoading: financeStatsLoading } = useFinanceStats({
    dateRange,
    ...(selectedSchool && { schoolId: selectedSchool }),
    ...(selectedBranchId && { branchId: selectedBranchId }),
    ...(selectedCourse && { courseId: selectedCourse }),
  });

  // Mutations for expenses and payrolls
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const updatePayrollMutation = useUpdatePayroll();
  const deletePayrollMutation = useDeletePayroll();

  // Fetch profit/loss report
  const { data: profitLossReport, isLoading: profitLossLoading } = useQuery({
    queryKey: [
      "profit-loss-report",
      dateRange,
      selectedSchool,
      selectedBranchId ?? null,
      selectedCourse ?? null,
    ],
    queryFn: () =>
      superadminService.getProfitLossReport({
        ...dateRange,
        ...(selectedSchool && { schoolId: selectedSchool }),
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCourse && { courseId: selectedCourse }),
      }),
  });

  // Fetch payment trends
  const { data: paymentTrends, isLoading: paymentTrendsLoading } = useQuery({
    queryKey: [
      "payment-trends",
      dateRange,
      selectedSchool,
      selectedBranchId ?? null,
      selectedCourse ?? null,
    ],
    queryFn: () =>
      superadminService.getPaymentTrends({
        ...dateRange,
        ...(selectedSchool && { schoolId: selectedSchool }),
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCourse && { courseId: selectedCourse }),
      }),
  });

  // Fetch school comparison
  const { data: schoolComparison, isLoading: schoolComparisonLoading } =
    useQuery({
      queryKey: ["school-financial-comparison", dateRange, selectedSchool, selectedBranchId, selectedCourse],
      queryFn: () => superadminService.getSchoolFinancialComparison({
        ...dateRange,
        ...(selectedSchool && { schoolId: selectedSchool }),
        ...(selectedBranchId && { branchId: selectedBranchId }),
        ...(selectedCourse && { courseId: selectedCourse }),
      }),
    });

  if (overviewLoading || revenueLoading || expenseLoading || profitLossLoading || paymentTrendsLoading || schoolComparisonLoading || paymentsLoading || payrollLoading || financeStatsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Debug logging
  // console.log('🔍 Financial Overview RAW:', financialOverview);
  // console.log('🔍 Has data property?', 'data' in (financialOverview || {}));
  // console.log('🔍 financialOverview.data:', financialOverview?.data);
  // console.log('🔍 financialOverview.summary:', financialOverview?.summary);
  
  // Debug payment trends
  // console.log('💳 Payment Trends RAW:', paymentTrends);
  // console.log('💳 Raw Payment Trends:', rawPaymentTrends);
  // console.log('💳 Payments by Status:', paymentsByStatus);

  // Consistent data extraction - handle both { data: {...} } and direct {...} formats
  const extractData = (response: any) => {
    if (!response) return null;
    return response.data || response;
  };

  // Extract data consistently
  const rawData = extractData(financialOverview);
  const summary = rawData?.summary || {};
  const paymentsByMethodFromOverview = rawData?.paymentsByMethod || [];
  const revenueByPeriod = rawData?.revenueByPeriod || [];
  const expensesByPeriodFromOverview = rawData?.expensesByPeriod || [];
  const expensesByCategoryFromOverview = rawData?.expensesByCategory || [];

  const rawRevenue = extractData(revenueAnalytics);
  const rawExpense = expenseData;
  const rawProfitLoss = extractData(profitLossReport);
  const rawPaymentTrends = extractData(paymentTrends);
  const rawSchoolComparison = extractData(schoolComparison);
  const rawFinanceStats = financeStatsData;
  const rawPayments = paymentsData;

  // Extract payment status data for revenue distribution
  const paymentsByStatus = rawPaymentTrends?.byStatus || [];
  const schools = rawSchoolComparison?.schools || [];

  // Handle expenses data from finance service and group by category
  const expensesData = rawExpense?.data || [];
  const expensesByCategoryMap = new Map<string, { amount: number; count: number }>();
  
  expensesData.forEach((expense: any) => {
    const category = expense.category || 'Uncategorized';
    const amount = parseNum(expense.amount);
    const current = expensesByCategoryMap.get(category) || { amount: 0, count: 0 };
    expensesByCategoryMap.set(category, {
      amount: current.amount + amount,
      count: current.count + 1
    });
  });
  
  const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    count: data.count
  }));
  
  const totalExpensesFromData = expensesByCategory.reduce((sum: number, expense: any) => sum + expense.amount, 0);
  
  // Extract payments data
  const paymentsByMethodFromFinance = rawPayments?.data || [];
  const totalPaymentsFromData = paymentsByMethodFromFinance.reduce((sum: number, payment: any) => sum + parseNum(payment.amount), 0);
  
  // Extract payroll data
  const payrollExpenses = payrollData?.data || [];
  const totalPayrollExpenses = payrollExpenses.reduce((sum: number, payroll: any) => sum + parseNum(payroll.netSalary), 0);
  
  // Debug expenses data
  // console.log('💰 Expenses RAW:', rawExpense);
  // console.log('💰 Expenses Data:', expensesData);
  // console.log('💰 Expenses By Category:', expensesByCategory);
  // console.log('💰 Total Expenses from Data:', totalExpensesFromData);

// console.log('📊 Summary FINAL:', summary);
// console.log('💳 Payments by Method FINAL:', paymentsByMethod);

// Helper to parse string/number to number
// Use finance stats data when available, fallback to calculated values
const totalRevenue = parseNum(rawFinanceStats?.netIncome) || parseNum(rawRevenue?.totalRevenue) || totalPaymentsFromData || parseNum(summary?.totalRevenue);
const totalExpenses = totalExpensesFromData + totalPayrollExpenses || parseNum(rawFinanceStats?.totalExpenses) || parseNum(summary?.totalExpenses);
  
// Use finance stats or profit/loss report for net profit
const netProfitFromStats = parseNum(rawFinanceStats?.netProfit);
const netProfitFromReport = parseNum(rawProfitLoss?.profit?.net);
const netProfit = netProfitFromStats || netProfitFromReport || (totalRevenue - totalExpenses);

// Calculate additional metrics from all APIs for consistency
const revenueFromAnalytics = parseNum(rawRevenue?.totalRevenue) || totalPaymentsFromData;
const expensesFromAnalytics = totalExpensesFromData + totalPayrollExpenses;
const profitFromStats = netProfitFromStats || netProfitFromReport;
  
// Payment status totals for revenue verification
const paymentStatusRevenue = paymentsByStatus.reduce((sum: number, payment: any) => {
  return sum + parseNum(payment?.amount);
}, 0);

// Use the sum of all payment amounts as total revenue
const displayRevenue = totalPaymentsFromData;
const displayExpenses = parseNum(rawFinanceStats?.totalExpenses) || expensesFromAnalytics || totalExpenses;
const displayProfit = profitFromStats || netProfit;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {t("superadmin.finance.totalRevenue", "Total Revenue")}
            </span>
            <FaDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 break-all">
            {formatCurrency(displayRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t("superadmin.finance.transactions", {
              count: formatNumber(parseNum(summary?.totalPayments)),
            }) ||
              `${formatNumber(parseNum(summary?.totalPayments))} transactions`}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {t("superadmin.finance.totalExpenses", "Total Expenses")}
            </span>
            <FaFileInvoiceDollar className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 break-all">
            {formatCurrency(displayExpenses)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t("superadmin.finance.transactions", {
              count: formatNumber(parseNum(summary?.totalExpenseTransactions)),
            }) ||
              `${formatNumber(
                parseNum(summary?.totalExpenseTransactions)
              )} transactions`}
          </p>
        </div>

        <div
          onClick={onProfitClick}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${
            onProfitClick
              ? "cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {t("superadmin.finance.netProfit", "Net Profit")}
            </span>
            <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
          </div>
          <p
            className={`text-2xl sm:text-3xl font-bold break-all ${
              displayProfit >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            {formatCurrency(displayProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {(() => {
              const margin =
                displayRevenue > 0
                  ? ((displayProfit / displayRevenue) * 100).toFixed(2)
                  : "0.00";
              return (
                t("superadmin.finance.margin", {
                  percent: margin,
                }) || `${margin}% margin`
              );
            })()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {t("superadmin.finance.pendingPayments", "Pending Payments")}
            </span>
            <FaExchangeAlt className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600 break-all">
            {formatCurrency(parseNum(summary?.pendingAmount))}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t("superadmin.finance.pendingCount", {
              count: formatNumber(parseNum(summary?.pendingCount)),
            }) || `${formatNumber(parseNum(summary?.pendingCount))} pending`}
          </p>
        </div>
      </div>

      {/* Revenue vs Expenses Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          {t("superadmin.finance.revVsExpTrend", "Revenue vs Expenses Trend")}
        </h3>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <AreaChart
            data={revenueByPeriod.map((item, index) => ({
              period: item.period,
              revenue: parseNum(item.amount),
              expenses: parseNum(expensesByPeriodFromOverview[index]?.amount),
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" style={{ fontSize: "12px" }} />
            <YAxis style={{ fontSize: "12px" }} />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
              name={t("superadmin.finance.revenue", "Revenue")}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.6}
              name={t("superadmin.finance.expenses", "Expenses")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {t(
              "superadmin.finance.paymentMethodsDistribution",
              "Payment Methods Distribution"
            )}
          </h3>
          {paymentsByMethodFromFinance.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={200}
              className="sm:h-[250px]"
            >
              <PieChart>
                <Pie
                  data={paymentsByMethodFromFinance.map((p) => ({
                    ...p,
                    amount: parseNum(p.amount),
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.method}: ${formatCurrency(entry.amount)}`
                  }
                  outerRadius={60}
                  className="sm:outerRadius-80"
                  fill="#8884d8"
                  dataKey="amount"
                  style={{ fontSize: "11px" }}
                >
                  {paymentsByMethodFromFinance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm sm:text-base text-gray-500 py-8">
              {t(
                "superadmin.finance.noPaymentData",
                "No payment data available"
              )}
            </p>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {t("superadmin.finance.expensesByCategory", "Expenses by Category")}
          </h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={200}
              className="sm:h-[250px]"
            >
              <BarChart
                data={expensesByCategory}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" style={{ fontSize: "11px" }} />
                <YAxis style={{ fontSize: "11px" }} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm sm:text-base text-gray-500 py-8">
              {t(
                "superadmin.finance.noExpenseData",
                "No expense data available"
              )}
            </p>
          )}
        </div>
      </div>

      {/* Profit & Loss Statement */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {t("superadmin.finance.plStatement", "Profit & Loss Statement")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                {t("superadmin.finance.revenue", "Revenue")}
              </h4>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mb-2 break-all">
                {formatCurrency(parseNum(summary?.totalRevenue))}
              </p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate ">
                    {t("superadmin.finance.tuitionFees", "Tuition Fees:")}
                  </span>
                  <span className=" whitespace-nowrap text-gray-500">
                    {formatCurrency(
                      parseNum(summary?.revenueBreakdown?.tuitionFees)
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-2 ">
                  <span className="text-gray-600 truncate">
                    {t("superadmin.finance.otherFees", "Other Fees:")}
                  </span>
                  <span className="whitespace-nowrap text-gray-500">
                    {formatCurrency(
                      parseNum(summary?.revenueBreakdown?.otherFees)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                {t("superadmin.finance.costs", "Costs")}
              </h4>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mb-2 break-all">
                {formatCurrency(parseNum(summary?.totalExpenses))}
              </p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate">
                    {t("superadmin.finance.operations", "Operations:")}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {formatCurrency(
                      parseNum(summary?.expenseBreakdown?.operationalExpenses)
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate">
                    {t("superadmin.finance.salaries", "Salaries:")}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">
                    {formatCurrency(
                      parseNum(summary?.expenseBreakdown?.staffSalaries)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-3 sm:p-4 ${
                netProfit >= 0
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                {t("superadmin.finance.netProfit", "Net Profit")}
              </h4>
              <p
                className={`text-xl sm:text-2xl font-bold mb-2 break-all ${
                  netProfit >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(netProfit)}
              </p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">
                    {t("superadmin.finance.marginLabel", "Margin:")}
                  </span>
                  <span className="text-gray-500">
                    {(() => {
                      const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
                      return margin.toFixed(2);
                    })()}
                    %
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">
                    {t("superadmin.finance.status", "Status:")}
                  </span>
                  <span
                    className={`font-medium ${
                      netProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {netProfit >= 0 ? "Profitable" : "Loss"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {displayProfit < 0 && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>
                  {t("superadmin.finance.recommendation", "Recommendation:")}
                </strong>{" "}
                Consider reviewing operational expenses and exploring revenue optimization opportunities to improve profitability.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          {t(
            "superadmin.finance.paymentStatusDistribution",
            "Payment Status Distribution"
          )}
        </h3>
        {paymentsByStatus.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={250}
            className="sm:h-[300px]"
          >
            <BarChart
              data={paymentsByStatus.map((p) => ({
                ...p,
                amount: parseNum(p.amount),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" style={{ fontSize: "11px" }} />
              <YAxis style={{ fontSize: "11px" }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="amount"
                fill="#3B82F6"
                name={t("superadmin.finance.revenue", "Revenue")}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No payment status data available</p>
          </div>
        )}
      </div>

      {/* Expenses Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          {t("superadmin.finance.expensesBreakdown", "Expenses Breakdown")}
        </h3>
        {expensesByCategory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expensesByCategory.map((category: any, index: number) => {
              const totalExpenses = expensesByCategory.reduce((sum: number, cat: any) => sum + parseNum(cat.amount), 0);
              const percentage = totalExpenses > 0 ? ((parseNum(category.amount) / totalExpenses) * 100).toFixed(1) : "0.0";
              return (
                <div key={index} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {category.category || t("superadmin.finance.uncategorized", "Uncategorized")}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                      {percentage}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {t("superadmin.finance.amount", "Amount")}
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(parseNum(category.amount))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {t("superadmin.finance.transactions", "Transactions")}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {category.count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No expense data available</p>
          </div>
        )}
      </div>

      {/* School Financial Comparison */}
      {schools.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {t(
              "superadmin.finance.schoolComparison",
              "School Financial Comparison"
            )}
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full px-4 sm:px-0 align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.finance.table.school", "School")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.finance.revenue", "Revenue")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      {t("superadmin.finance.expenses", "Expenses")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.finance.netProfit", "Net Profit")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      {t("superadmin.finance.marginHeader", "Margin")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      {t("superadmin.finance.students", "Students")}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      {t("superadmin.finance.revPerStudent", "Rev/Student")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schools.map((school: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        {school.schoolName}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-green-600 font-semibold whitespace-nowrap">
                        {formatCurrency(parseNum(school.revenue))}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-red-600 font-semibold whitespace-nowrap hidden sm:table-cell">
                        {formatCurrency(parseNum(school.expenses))}
                      </td>
                      <td
                        className={`px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right font-semibold whitespace-nowrap ${
                          parseNum(school.netProfit) >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(parseNum(school.netProfit))}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-gray-900 whitespace-nowrap hidden md:table-cell">
                        {parseNum(school.profitMargin).toFixed(2)}%
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-gray-900 whitespace-nowrap hidden lg:table-cell">
                        {formatNumber(parseNum(school.studentCount))}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-gray-900 whitespace-nowrap hidden lg:table-cell">
                        {formatCurrency(parseNum(school.revenuePerStudent))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAnalyticsDashboard;
