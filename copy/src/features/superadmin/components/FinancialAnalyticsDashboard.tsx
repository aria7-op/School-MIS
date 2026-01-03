import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FaDollarSign, FaChartLine, FaExchangeAlt, FaFileInvoiceDollar } from 'react-icons/fa';
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
  Line
} from 'recharts';
import superadminService from '../services/superadminService';

interface Props {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const FinancialAnalyticsDashboard: React.FC<Props> = ({ dateRange, selectedSchoolId, selectedBranchId }) => {
  const { t } = useTranslation();
  const [selectedSchool, setSelectedSchool] = useState<string>('');

  // Sync internal selection with props from SuperadminDashboard
  useEffect(() => {
    if (selectedSchoolId !== undefined) {
      setSelectedSchool(selectedSchoolId ?? '');
    }
  }, [selectedSchoolId]);

  // Fetch financial overview
  const { data: financialOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['financial-overview', dateRange, selectedSchool, selectedBranchId ?? null],
    queryFn: () => superadminService.getFinancialOverview({ ...dateRange, schoolId: selectedSchool || undefined, branchId: selectedBranchId || undefined })
  });

  // Fetch revenue analytics
  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', dateRange, selectedSchool, selectedBranchId ?? null],
    queryFn: () => superadminService.getRevenueAnalytics({ ...dateRange, schoolId: selectedSchool || undefined, branchId: selectedBranchId || undefined, groupBy: 'month' })
  });

  // Fetch expense analytics
  const { data: expenseAnalytics, isLoading: expenseLoading } = useQuery({
    queryKey: ['expense-analytics', dateRange, selectedSchool, selectedBranchId ?? null],
    queryFn: () => superadminService.getExpenseAnalytics({ ...dateRange, schoolId: selectedSchool || undefined, branchId: selectedBranchId || undefined, groupBy: 'month' })
  });

  // Fetch profit/loss report
  const { data: profitLossReport, isLoading: profitLossLoading } = useQuery({
    queryKey: ['profit-loss-report', dateRange, selectedSchool, selectedBranchId ?? null],
    queryFn: () => superadminService.getProfitLossReport({ ...dateRange, schoolId: selectedSchool || undefined, branchId: selectedBranchId || undefined })
  });

  // Fetch payment trends
  const { data: paymentTrends, isLoading: paymentTrendsLoading } = useQuery({
    queryKey: ['payment-trends', dateRange, selectedSchool, selectedBranchId ?? null],
    queryFn: () => superadminService.getPaymentTrends({ ...dateRange, schoolId: selectedSchool || undefined, branchId: selectedBranchId || undefined })
  });

  // Fetch school comparison
  const { data: schoolComparison, isLoading: schoolComparisonLoading } = useQuery({
    queryKey: ['school-financial-comparison', dateRange],
    queryFn: () => superadminService.getSchoolFinancialComparison(dateRange)
  });

  const toNumber = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (amount: any) => {
    const n = toNumber(amount);
    return `AFN ${Math.round(n).toLocaleString('en-US')}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (overviewLoading) {
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
  
  // Try both paths - the API might return { data: {...} } or just {...}
  const rawData = financialOverview?.data || financialOverview;
  const summary = rawData?.summary;
  const paymentsByMethod = rawData?.paymentsByMethod || [];
  
  const rawRevenue = revenueAnalytics?.data || revenueAnalytics;
  const revenueByPeriod = rawRevenue?.revenueByPeriod || [];
  
  const rawExpense = expenseAnalytics?.data || expenseAnalytics;
  const expensesByPeriod = rawExpense?.expensesByPeriod || [];
  const expensesByCategory = rawExpense?.expensesByCategory || [];
  
  const rawProfitLoss = profitLossReport?.data || profitLossReport;
  const profitLoss = rawProfitLoss;
  
  const rawPaymentTrends = paymentTrends?.data || paymentTrends;
  const paymentsByStatus = rawPaymentTrends?.byStatus || [];
  
  const rawSchoolComparison = schoolComparison?.data || schoolComparison;
  const schools = rawSchoolComparison?.schools || [];

  // console.log('📊 Summary FINAL:', summary);
  // console.log('💳 Payments by Method FINAL:', paymentsByMethod);

  // Helper to parse string/number to number
  const parseNum = (val: any) => toNumber(val);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.finance.totalRevenue', 'Total Revenue')}</span>
            <FaDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 break-all">{formatCurrency(parseNum(summary?.totalRevenue))}</p>
          <p className="text-xs text-gray-500 mt-2">{t('superadmin.finance.transactions', { count: formatNumber(parseNum(summary?.totalPayments)) }) || `${formatNumber(parseNum(summary?.totalPayments))} transactions`}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.finance.totalExpenses', 'Total Expenses')}</span>
            <FaFileInvoiceDollar className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 break-all">{formatCurrency(parseNum(summary?.totalExpenses))}</p>
          <p className="text-xs text-gray-500 mt-2">{t('superadmin.finance.transactions', { count: formatNumber(parseNum(summary?.totalExpenseTransactions)) }) || `${formatNumber(parseNum(summary?.totalExpenseTransactions))} transactions`}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.finance.netProfit', 'Net Profit')}</span>
            <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
          </div>
          <p className={`text-2xl sm:text-3xl font-bold break-all ${parseNum(summary?.netProfit) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(parseNum(summary?.netProfit))}
          </p>
          <p className="text-xs text-gray-500 mt-2">{(() => {
            const pm = parseNum(summary?.profitMargin);
            const percent = pm > 0 && pm <= 1 ? (pm * 100) : pm;
            return t('superadmin.finance.margin', { percent: percent.toFixed(2) }) || `${percent.toFixed(2)}% margin`;
          })()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.finance.pendingPayments', 'Pending Payments')}</span>
            <FaExchangeAlt className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600 break-all">{formatCurrency(parseNum(summary?.pendingAmount))}</p>
          <p className="text-xs text-gray-500 mt-2">{t('superadmin.finance.pendingCount', { count: formatNumber(parseNum(summary?.pendingCount)) }) || `${formatNumber(parseNum(summary?.pendingCount))} pending`}</p>
        </div>
      </div>

      {/* Revenue vs Expenses Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('superadmin.finance.revVsExpTrend', 'Revenue vs Expenses Trend')}</h3>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <AreaChart data={revenueByPeriod.map((item, index) => ({
            period: item.period,
            revenue: parseNum(item.amount),
            expenses: parseNum(expensesByPeriod[index]?.amount)
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" name={t('superadmin.finance.revenue', 'Revenue')} />
            <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" name={t('superadmin.finance.expenses', 'Expenses')} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('superadmin.finance.paymentMethodsDistribution', 'Payment Methods Distribution')}</h3>
          {paymentsByMethod.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <PieChart>
                <Pie
                  data={paymentsByMethod.map(p => ({ ...p, amount: parseNum(p.amount) }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.method}: ${formatCurrency(entry.amount)}`}
                  outerRadius={60}
                  className="sm:outerRadius-80"
                  fill="#8884d8"
                  dataKey="amount"
                  style={{ fontSize: '11px' }}
                >
                  {paymentsByMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm sm:text-base text-gray-500 py-8">{t('superadmin.finance.noPaymentData', 'No payment data available')}</p>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('superadmin.finance.expensesByCategory', 'Expenses by Category')}</h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <BarChart data={expensesByCategory.map(e => ({ ...e, amount: parseNum(e.amount) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" style={{ fontSize: '11px' }} />
                <YAxis style={{ fontSize: '11px' }} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm sm:text-base text-gray-500 py-8">{t('superadmin.finance.noExpenseData', 'No expense data available')}</p>
          )}
        </div>
      </div>

      {/* Profit & Loss Statement */}
      {profitLoss && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('superadmin.finance.plStatement', 'Profit & Loss Statement')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">{t('superadmin.finance.revenue', 'Revenue')}</h4>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mb-2 break-all">{formatCurrency(parseNum(profitLoss.revenue?.total))}</p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate ">{t('superadmin.finance.tuitionFees', 'Tuition Fees:')}</span>
                  <span className=" whitespace-nowrap text-gray-500">{formatCurrency(parseNum(profitLoss.revenue?.breakdown?.tuitionFees))}</span>
                </div>
                <div className="flex justify-between gap-2 ">
                  <span className="text-gray-600 truncate">{t('superadmin.finance.otherFees', 'Other Fees:')}</span>
                  <span className="whitespace-nowrap text-gray-500">{formatCurrency(parseNum(profitLoss.revenue?.breakdown?.otherFees))}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">{t('superadmin.finance.costs', 'Costs')}</h4>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mb-2 break-all">{formatCurrency(parseNum(profitLoss.costs?.total))}</p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate">{t('superadmin.finance.operations', 'Operations:')}</span>
                  <span className="text-gray-500 whitespace-nowrap">{formatCurrency(parseNum(profitLoss.costs?.breakdown?.operationalExpenses))}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate">{t('superadmin.finance.salaries', 'Salaries:')}</span>
                  <span className="text-gray-500 whitespace-nowrap">{formatCurrency(parseNum(profitLoss.costs?.breakdown?.staffSalaries))}</span>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-3 sm:p-4 ${parseNum(profitLoss.profit?.net) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">{t('superadmin.finance.netProfit', 'Net Profit')}</h4>
              <p className={`text-xl sm:text-2xl font-bold mb-2 break-all ${parseNum(profitLoss.profit?.net) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(parseNum(profitLoss.profit?.net))}
              </p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">{t('superadmin.finance.marginLabel', 'Margin:')}</span>
                  <span className="text-gray-500">{(() => { const pm = parseNum(profitLoss.profit?.margin); return (pm > 0 && pm <= 1 ? pm * 100 : pm).toFixed(2); })()}%</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">{t('superadmin.finance.status', 'Status:')}</span>
                  <span className={`font-medium ${profitLoss.analysis?.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss.analysis?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {profitLoss.analysis?.recommendation && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>{t('superadmin.finance.recommendation', 'Recommendation:')}</strong> {profitLoss.analysis.recommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Status Distribution */}
      {paymentsByStatus.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('superadmin.finance.paymentStatusDistribution', 'Payment Status Distribution')}</h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <BarChart data={paymentsByStatus.map(p => ({ ...p, amount: parseNum(p.amount) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" style={{ fontSize: '11px' }} />
              <YAxis style={{ fontSize: '11px' }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="amount" fill="#3B82F6" name={t('superadmin.finance.amount', 'Amount')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* School Financial Comparison */}
      {schools.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('superadmin.finance.schoolComparison', 'School Financial Comparison')}</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full px-4 sm:px-0 align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('superadmin.finance.table.school', 'School')}</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('superadmin.finance.revenue', 'Revenue')}</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">{t('superadmin.finance.expenses', 'Expenses')}</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('superadmin.finance.netProfit', 'Net Profit')}</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('superadmin.finance.marginHeader', 'Margin')}</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">{t('superadmin.finance.students', 'Students')}</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">{t('superadmin.finance.revPerStudent', 'Rev/Student')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schools.map((school: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{school.schoolName}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-green-600 font-semibold whitespace-nowrap">{formatCurrency(parseNum(school.revenue))}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-red-600 font-semibold whitespace-nowrap hidden sm:table-cell">{formatCurrency(parseNum(school.expenses))}</td>
                      <td className={`px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right font-semibold whitespace-nowrap ${parseNum(school.netProfit) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(parseNum(school.netProfit))}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-gray-900 whitespace-nowrap hidden md:table-cell">{parseNum(school.profitMargin).toFixed(2)}%</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-gray-900 whitespace-nowrap hidden lg:table-cell">{formatNumber(parseNum(school.studentCount))}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-right text-gray-900 whitespace-nowrap hidden lg:table-cell">{formatCurrency(parseNum(school.revenuePerStudent))}</td>
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