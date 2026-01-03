import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { VictoryPie, VictoryChart, VictoryBar, VictoryLine, VictoryAxis, VictoryTheme, VictoryTooltip, VictoryLabel } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';

// Import all finance components
import FinanceHeader from '../components/FinanceHeader';
import StatsOverview from '../components/StatsOverview';
import PaymentsList from '../components/PaymentsList';
import TransactionList from '../components/TransactionList';
import BudgetList from '../components/BudgetList';
import ExpensesList from '../components/ExpensesList';
import IncomeList from '../components/IncomeList';
import PayrollSummary from '../components/PayrollSummary';
import UpcomingBills from '../components/UpcomingBills';
import DateRangePicker from '../components/DateRangePicker';
import FilterModal from '../components/FilterModal';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import AddPaymentModal from '../components/AddPaymentModal';
import AddExpenseModal from '../components/AddExpenseModal';
import AddBudgetModal from '../components/AddBudgetModal';
import PrintPreviewModal from '../components/PrintPreviewModal';

// Import new advanced components
import FinancialMetricsCard from '../components/FinancialMetricsCard';
import CashFlowChart from '../components/CashFlowChart';
import RevenueAnalysisChart from '../components/RevenueAnalysisChart';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import BudgetVsActualChart from '../components/BudgetVsActualChart';
import PaymentTrendsChart from '../components/PaymentTrendsChart';
import PayrollAnalyticsChart from '../components/PayrollAnalyticsChart';
import FinancialCalendar from '../components/FinancialCalendar';
import QuickActionsPanel from '../components/QuickActionsPanel';
import AlertsPanel from '../components/AlertsPanel';
import ReportsPanel from '../components/ReportsPanel';
import ExportOptionsModal from '../components/ExportOptionsModal';

const { width, height } = Dimensions.get('window');

// Types
type FinanceTab = 
  | 'overview' 
  | 'payments' 
  | 'payroll' 
  | 'expenses' 
  | 'income' 
  | 'budgets' 
  | 'reports' 
  | 'analytics';

type DateRange = {
  startDate: string;
  endDate: string;
};

type FinancialMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingPayments: number;
  overduePayments: number;
  totalPayroll: number;
  budgetUtilization: number;
  cashFlow: number;
};

type ChartData = {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
};

const AdvancedFinanceDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: moment().startOf('month').format('YYYY-MM-DD'),
    endDate: moment().endOf('month').format('YYYY-MM-DD'),
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Data states
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingPayments: 0,
    overduePayments: 0,
    totalPayroll: 0,
    budgetUtilization: 0,
    cashFlow: 0,
  });

  const [payments, setPayments] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Chart data states
  const [revenueChartData, setRevenueChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [expenseChartData, setExpenseChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [cashFlowChartData, setCashFlowChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [paymentTrendsData, setPaymentTrendsData] = useState<ChartData>({ labels: [], datasets: [] });
  const [payrollChartData, setPayrollChartData] = useState<ChartData>({ labels: [], datasets: [] });

  const { colors } = useTheme();
  const { t, lang } = useTranslation();

  // API Base URL
  const API_BASE_URL = 'https://khwanzay.school/api';

  // Fetch all finance data
  const fetchFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Content-Type': 'application/json',
        // Add authentication headers here
      };

      const [
        paymentsRes,
        payrollsRes,
        expensesRes,
        incomesRes,
        budgetsRes,
        feeStructuresRes,
        analyticsRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/payments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers }),
        fetch(`${API_BASE_URL}/payrolls?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers }),
        fetch(`${API_BASE_URL}/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers }),
        fetch(`${API_BASE_URL}/incomes?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers }),
        fetch(`${API_BASE_URL}/budgets?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers }),
        fetch(`${API_BASE_URL}/fee-structures`, { headers }),
        fetch(`${API_BASE_URL}/payments/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { headers }),
      ]);

      const [
        paymentsData,
        payrollsData,
        expensesData,
        incomesData,
        budgetsData,
        feeStructuresData,
        analyticsData,
      ] = await Promise.all([
        paymentsRes.json(),
        payrollsRes.json(),
        expensesRes.json(),
        incomesRes.json(),
        budgetsRes.json(),
        feeStructuresRes.json(),
        analyticsRes.json(),
      ]);

      // Set data
      setPayments(paymentsData.data || []);
      setPayrolls(payrollsData.data || []);
      setExpenses(expensesData.data || []);
      setIncomes(incomesData.data || []);
      setBudgets(budgetsData.data || []);
      setFeeStructures(feeStructuresData.data || []);

      // Calculate and set financial metrics
      const metrics = calculateFinancialMetrics(
        paymentsData.data || [],
        payrollsData.data || [],
        expensesData.data || [],
        incomesData.data || [],
        budgetsData.data || [],
        analyticsData.data || {}
      );
      setFinancialMetrics(metrics);

      // Generate chart data
      generateChartData(
        paymentsData.data || [],
        payrollsData.data || [],
        expensesData.data || [],
        incomesData.data || [],
        analyticsData.data || {}
      );

      // Generate alerts
      generateAlerts(paymentsData.data || [], budgetsData.data || []);

    } catch (err) {
      
      setError('Failed to fetch finance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  // Calculate financial metrics
  const calculateFinancialMetrics = useCallback((
    payments: any[],
    payrolls: any[],
    expenses: any[],
    incomes: any[],
    budgets: any[],
    analytics: any
  ): FinancialMetrics => {
    const totalRevenue = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalPayroll = payrolls.reduce((sum, payroll) => sum + Number(payroll.netSalary || 0), 0);
    
    const outstandingPayments = payments
      .filter(p => p.status === 'UNPAID' || p.status === 'PARTIALLY_PAID')
      .reduce((sum, payment) => sum + Number(payment.total || 0), 0);
    
    const overduePayments = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, payment) => sum + Number(payment.total || 0), 0);

    const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.allocated_amount || 0), 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + Number(budget.spend_amount || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const netProfit = totalRevenue - totalExpenses - totalPayroll;
    const cashFlow = totalRevenue - totalExpenses - totalPayroll - outstandingPayments;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstandingPayments,
      overduePayments,
      totalPayroll,
      budgetUtilization,
      cashFlow,
    };
  }, []);

  // Generate chart data
  const generateChartData = useCallback((
    payments: any[],
    payrolls: any[],
    expenses: any[],
    incomes: any[],
    analytics: any
  ) => {
    // Revenue chart data (last 12 months)
    const revenueLabels = [];
    const revenueData = [];
    for (let i = 11; i >= 0; i--) {
      const date = moment().subtract(i, 'months');
      revenueLabels.push(date.format('MMM'));
      const monthIncomes = incomes.filter(income => 
        moment(income.createdAt).isSame(date, 'month')
      );
      revenueData.push(monthIncomes.reduce((sum, income) => sum + Number(income.amount || 0), 0));
    }

    setRevenueChartData({
      labels: revenueLabels,
      datasets: [{
        data: revenueData,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2,
      }],
    });

    // Expense breakdown chart data
    const expenseCategories = {};
    expenses.forEach(expense => {
      const category = expense.expense_type || 'Other';
      expenseCategories[category] = (expenseCategories[category] || 0) + Number(expense.amount || 0);
    });

    const expenseLabels = Object.keys(expenseCategories);
    const expenseData = Object.values(expenseCategories);

    setExpenseChartData({
      labels: expenseLabels,
      datasets: [{
        data: expenseData,
      }],
    });

    // Cash flow chart data
    const cashFlowLabels = [];
    const cashFlowData = [];
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      cashFlowLabels.push(date.format('DD'));
      
      const dayIncomes = incomes.filter(income => 
        moment(income.createdAt).isSame(date, 'day')
      );
      const dayExpenses = expenses.filter(expense => 
        moment(expense.createdAt).isSame(date, 'day')
      );
      
      const dayIncome = dayIncomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
      const dayExpense = dayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      
      cashFlowData.push(dayIncome - dayExpense);
    }

    setCashFlowChartData({
      labels: cashFlowLabels,
      datasets: [{
        data: cashFlowData,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      }],
    });

    // Payment trends data
    const paymentLabels = ['Paid', 'Unpaid', 'Partially Paid', 'Overdue'];
    const paymentData = [
      payments.filter(p => p.status === 'PAID').length,
      payments.filter(p => p.status === 'UNPAID').length,
      payments.filter(p => p.status === 'PARTIALLY_PAID').length,
      payments.filter(p => p.status === 'OVERDUE').length,
    ];

    setPaymentTrendsData({
      labels: paymentLabels,
      datasets: [{
        data: paymentData,
      }],
    });

    // Payroll chart data
    const payrollLabels = [];
    const payrollData = [];
    for (let i = 5; i >= 0; i--) {
      const date = moment().subtract(i, 'months');
      payrollLabels.push(date.format('MMM'));
      const monthPayrolls = payrolls.filter(payroll => 
        moment(payroll.salaryMonth).isSame(date, 'month')
      );
      payrollData.push(monthPayrolls.reduce((sum, payroll) => sum + Number(payroll.netSalary || 0), 0));
    }

    setPayrollChartData({
      labels: payrollLabels,
      datasets: [{
        data: payrollData,
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      }],
    });
  }, []);

  // Generate alerts
  const generateAlerts = useCallback((payments: any[], budgets: any[]) => {
    const newAlerts = [];

    // Overdue payments alert
    const overduePayments = payments.filter(p => p.status === 'OVERDUE');
    if (overduePayments.length > 0) {
      newAlerts.push({
        id: 'overdue_payments',
        type: 'warning',
        title: 'Overdue Payments',
        message: `${overduePayments.length} payments are overdue`,
        count: overduePayments.length,
        action: 'View Details',
      });
    }

    // Budget overruns alert
    const overrunBudgets = budgets.filter(b => 
      Number(b.spend_amount) > Number(b.allocated_amount)
    );
    if (overrunBudgets.length > 0) {
      newAlerts.push({
        id: 'budget_overruns',
        type: 'error',
        title: 'Budget Overruns',
        message: `${overrunBudgets.length} budgets have exceeded allocations`,
        count: overrunBudgets.length,
        action: 'Review Budgets',
      });
    }

    // Low cash flow alert
    if (financialMetrics.cashFlow < 0) {
      newAlerts.push({
        id: 'low_cash_flow',
        type: 'error',
        title: 'Negative Cash Flow',
        message: 'Cash flow is negative this period',
        action: 'Review Finances',
      });
    }

    setAlerts(newAlerts);
  }, [financialMetrics.cashFlow]);

  // Effects
  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Handlers
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange);
    setShowDatePicker(false);
  }, []);

  const handleTabChange = useCallback((tab: FinanceTab) => {
    setActiveTab(tab);
  }, []);

  const handleAddPayment = useCallback((paymentData: any) => {
    // Implement payment creation

    setShowAddPayment(false);
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleAddExpense = useCallback((expenseData: any) => {
    // Implement expense creation

    setShowAddExpense(false);
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleAddBudget = useCallback((budgetData: any) => {
    // Implement budget creation

    setShowAddBudget(false);
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleExport = useCallback((format: string) => {
    // Implement export functionality

    setShowExportOptions(false);
  }, []);

  // Render functions
  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Financial Metrics Cards */}
      <View style={styles.metricsContainer}>
        <FinancialMetricsCard
          title="Total Revenue"
          value={financialMetrics.totalRevenue}
          currency="$"
          trend={+15.2}
          icon="trending-up"
          color={colors.primary}
        />
        <FinancialMetricsCard
          title="Total Expenses"
          value={financialMetrics.totalExpenses}
          currency="$"
          trend={-8.5}
          icon="trending-down"
          color={colors.error}
        />
        <FinancialMetricsCard
          title="Net Profit"
          value={financialMetrics.netProfit}
          currency="$"
          trend={financialMetrics.netProfit > 0 ? +12.3 : -5.7}
          icon="account-balance"
          color={financialMetrics.netProfit > 0 ? colors.success : colors.error}
        />
        <FinancialMetricsCard
          title="Outstanding"
          value={financialMetrics.outstandingPayments}
          currency="$"
          trend={+2.1}
          icon="pending"
          color={colors.warning}
        />
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Revenue Analysis */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Revenue Analysis</Text>
          <RevenueAnalysisChart data={revenueChartData} colors={colors} />
        </View>

        {/* Cash Flow */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Cash Flow (30 Days)</Text>
          <CashFlowChart data={cashFlowChartData} colors={colors} />
        </View>

        {/* Expense Breakdown */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Expense Breakdown</Text>
          <ExpenseBreakdownChart data={expenseChartData} colors={colors} />
        </View>

        {/* Payment Trends */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Payment Status Trends</Text>
          <PaymentTrendsChart data={paymentTrendsData} colors={colors} />
        </View>
      </View>

      {/* Quick Actions and Alerts */}
      <View style={styles.bottomSection}>
        <QuickActionsPanel
          onAddPayment={() => setShowAddPayment(true)}
          onAddExpense={() => setShowAddExpense(true)}
          onAddBudget={() => setShowAddBudget(true)}
          onExport={() => setShowExportOptions(true)}
          colors={colors}
        />
        
        <AlertsPanel
          alerts={alerts}
          onAlertPress={(alert) => {
            // TODO: Implement alert press functionality
            console.log('Alert pressed:', alert);
          }}
          colors={colors}
        />
      </View>
    </ScrollView>
  );

  const renderPaymentsTab = () => (
    <View style={styles.tabContent}>
      <PaymentsList
        payments={payments}
        onRefresh={handleRefresh}
        onPaymentPress={(payment) => {
          // TODO: Implement payment press functionality
          console.log('Payment pressed:', payment);
        }}
        colors={colors}
      />
    </View>
  );

  const renderPayrollTab = () => (
    <View style={styles.tabContent}>
      <PayrollSummary
        payrolls={payrolls}
        onRefresh={handleRefresh}
        colors={colors}
      />
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Payroll Trends</Text>
        <PayrollAnalyticsChart data={payrollChartData} colors={colors} />
      </View>
    </View>
  );

  const renderExpensesTab = () => (
    <View style={styles.tabContent}>
      <ExpensesList
        expenses={expenses}
        onRefresh={handleRefresh}
        colors={colors}
      />
    </View>
  );

  const renderIncomeTab = () => (
    <View style={styles.tabContent}>
      <IncomeList
        incomes={incomes}
        onRefresh={handleRefresh}
        colors={colors}
      />
    </View>
  );

  const renderBudgetsTab = () => (
    <View style={styles.tabContent}>
      <BudgetList
        budgets={budgets}
        onRefresh={handleRefresh}
        colors={colors}
      />
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Budget vs Actual</Text>
        <BudgetVsActualChart budgets={budgets} colors={colors} />
      </View>
    </View>
  );

  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <ReportsPanel
        dateRange={dateRange}
        onGenerateReport={(type) => {
          // TODO: Implement report generation
          console.log('Generate report:', type);
        }}
        onExportReport={(type, format) => {
          // TODO: Implement report export
          console.log('Export report:', type, format);
        }}
        colors={colors}
      />
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.analyticsContainer}>
        {/* Advanced Analytics Charts */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Financial Performance</Text>
          <VictoryChart theme={VictoryTheme.material} width={width - 40} height={300}>
            <VictoryLine
              data={revenueChartData.labels.map((label, index) => ({
                x: label,
                y: revenueChartData.datasets[0].data[index],
              }))}
              style={{
                data: { stroke: colors.primary },
              }}
            />
            <VictoryAxis />
            <VictoryAxis dependentAxis />
          </VictoryChart>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Payment Distribution</Text>
          <VictoryPie
            data={paymentTrendsData.labels.map((label, index) => ({
              x: label,
              y: paymentTrendsData.datasets[0].data[index],
            }))}
            colorScale="qualitative"
            width={width - 40}
            height={300}
          />
        </View>

        <FinancialCalendar
          payments={payments}
          expenses={expenses}
          incomes={incomes}
          colors={colors}
        />
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'payments':
        return renderPaymentsTab();
      case 'payroll':
        return renderPayrollTab();
      case 'expenses':
        return renderExpensesTab();
      case 'income':
        return renderIncomeTab();
      case 'budgets':
        return renderBudgetsTab();
      case 'reports':
        return renderReportsTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading Finance Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <FinanceHeader
        title="Advanced Finance Dashboard"
        onDateRangePress={() => setShowDatePicker(true)}
        onFilterPress={() => setShowFilters(true)}
        onExportPress={() => setShowExportOptions(true)}
        dateRange={dateRange}
        colors={colors}
      />

      {/* Search Bar */}
      <SearchBar
        placeholder="Search payments, expenses, budgets..."
        onSearch={(query) => {
          // TODO: Implement search functionality
          console.log('Search query:', query);
        }}
        colors={colors}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'payments', label: 'Payments', icon: 'payment' },
            { key: 'payroll', label: 'Payroll', icon: 'account-balance-wallet' },
            { key: 'expenses', label: 'Expenses', icon: 'money-off' },
            { key: 'income', label: 'Income', icon: 'trending-up' },
            { key: 'budgets', label: 'Budgets', icon: 'account-balance' },
            { key: 'reports', label: 'Reports', icon: 'assessment' },
            { key: 'analytics', label: 'Analytics', icon: 'analytics' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleTabChange(tab.key as FinanceTab)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? colors.white : colors.text}
              />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.white : colors.text }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleRefresh}
            >
              <Text style={[styles.retryButtonText, { color: colors.white }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderTabContent()
        )}
      </ScrollView>

      {/* Modals */}
      <DateRangePicker
        visible={showDatePicker}
        dateRange={dateRange}
        onConfirm={handleDateRangeChange}
        onCancel={() => setShowDatePicker(false)}
        colors={colors}
      />

      <FilterModal
        visible={showFilters}
        onApply={(filters) => {

          setShowFilters(false);
        }}
        onCancel={() => setShowFilters(false)}
        colors={colors}
      />

      <AddPaymentModal
        visible={showAddPayment}
        onSave={handleAddPayment}
        onCancel={() => setShowAddPayment(false)}
        colors={colors}
      />

      <AddExpenseModal
        visible={showAddExpense}
        onSave={handleAddExpense}
        onCancel={() => setShowAddExpense(false)}
        colors={colors}
      />

      <AddBudgetModal
        visible={showAddBudget}
        onSave={handleAddBudget}
        onCancel={() => setShowAddBudget(false)}
        colors={colors}
      />

      <ExportOptionsModal
        visible={showExportOptions}
        onExport={handleExport}
        onCancel={() => setShowExportOptions(false)}
        colors={colors}
      />

      <PrintPreviewModal
        visible={showPrintPreview}
        data={{
          financialMetrics,
          payments,
          expenses,
          incomes,
          budgets,
          dateRange,
        }}
        onClose={() => setShowPrintPreview(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  chartsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  analyticsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdvancedFinanceDashboard; 
