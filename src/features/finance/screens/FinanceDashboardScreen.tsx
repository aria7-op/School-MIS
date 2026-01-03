import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';

// Import finance components
import FinanceHeader from '../components/FinanceHeader';
import StatsOverview from '../components/StatsOverview';
import FinancialMetricsCard from '../components/FinancialMetricsCard';
import CashFlowChart from '../components/CashFlowChart';
import RevenueAnalysisChart from '../components/RevenueAnalysisChart';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import BudgetVsActualChart from '../components/BudgetVsActualChart';
import PaymentTrendsChart from '../components/PaymentTrendsChart';
import PayrollAnalyticsChart from '../components/PayrollAnalyticsChart';
import QuickActionsPanel from '../components/QuickActionsPanel';
import AlertsPanel from '../components/AlertsPanel';
import ReportsPanel from '../components/ReportsPanel';
import DateRangePicker from '../components/DateRangePicker';
import FilterModal from '../components/FilterModal';
import AddPaymentModal from '../components/AddPaymentModal';
import AddExpenseModal from '../components/AddExpenseModal';
import AddBudgetModal from '../components/AddBudgetModal';

// Import finance hooks
import useFinancialAnalytics from '../hooks/useFinancialAnalytics';

const { width, height } = Dimensions.get('window');

type DashboardTab = 'overview' | 'analytics' | 'reports' | 'actions';

const FinanceDashboardScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  // State management
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Use the financial analytics hook
  const {
    loading,
    error,
    refreshing,
    metrics,
    paymentAnalytics,
    expenseAnalytics,
    revenueAnalytics,
    budgetAnalytics,
    cashFlowAnalytics,
    payrollAnalytics,
    trends,
    alerts,
    fetchDashboardData,
    refresh,
  } = useFinancialAnalytics();

  const onRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_payment':
        setShowAddPayment(true);
        break;
      case 'add_expense':
        setShowAddExpense(true);
        break;
      case 'add_budget':
        setShowAddBudget(true);
        break;
      case 'generate_report':
        // Handle report generation
        break;
      default:

    }
  };

  const renderTabButton = (tab: DashboardTab, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? colors.primary : colors.card,
          borderColor: activeTab === tab ? colors.primary : colors.border,
        },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialIcons
        name={icon as any}
        size={24}
        color={activeTab === tab ? 'white' : colors.text}
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tab ? 'white' : colors.text,
            textAlign: lang === 'fa' ? 'right' : 'left',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.tabContent}>
        {/* Financial Metrics Cards */}
        <View style={styles.metricsGrid}>
          <FinancialMetricsCard
            title={t('total_revenue')}
            value={metrics?.totalRevenue}
            icon="trending-up"
            color="#10b981"
            format="currency"
          />
          <FinancialMetricsCard
            title={t('total_expenses')}
            value={metrics?.totalExpenses}
            icon="trending-down"
            color="#ef4444"
            format="currency"
          />
          <FinancialMetricsCard
            title={t('net_profit')}
            value={metrics?.netProfit}
            icon="account-balance-wallet"
            color="#3b82f6"
            format="currency"
          />
          <FinancialMetricsCard
            title={t('outstanding_payments')}
            value={metrics?.outstandingPayments}
            icon="payment"
            color="#f59e0b"
            format="currency"
          />
          <FinancialMetricsCard
            title={t('overdue_payments')}
            value={metrics?.overduePayments}
            icon="warning"
            color="#dc2626"
            format="currency"
          />
          <FinancialMetricsCard
            title={t('total_payroll')}
            value={metrics?.totalPayroll}
            icon="people"
            color="#8b5cf6"
            format="currency"
          />
          <FinancialMetricsCard
            title={t('budget_utilization')}
            value={metrics?.budgetUtilization}
            icon="pie-chart"
            color="#06b6d4"
            format="percentage"
          />
          <FinancialMetricsCard
            title={t('cash_flow')}
            value={metrics?.cashFlow}
            icon="account-balance"
            color="#059669"
            format="currency"
          />
        </View>
        
        {/* Quick Actions */}
        <QuickActionsPanel onAction={handleQuickAction} colors={colors} />
        
        {/* Charts Row 1 */}
        <View style={styles.chartsRow}>
          <View style={[styles.chartContainer, { flex: 1, minWidth: width * 0.4 }]}>
            <CashFlowChart 
              data={cashFlowAnalytics?.monthlyCashFlow || { labels: [], datasets: [] }}
              colors={colors}
            />
          </View>
          <View style={[styles.chartContainer, { flex: 1, minWidth: width * 0.4 }]}>
            <RevenueAnalysisChart 
              data={revenueAnalytics?.monthlyTrends || { labels: [], datasets: [] }}
              colors={colors}
            />
          </View>
        </View>
        
        {/* Charts Row 2 */}
        <View style={styles.chartsRow}>
          <View style={[styles.chartContainer, { flex: 1, minWidth: width * 0.4 }]}>
            <ExpenseBreakdownChart 
              data={expenseAnalytics?.monthlyTrends || { labels: [], datasets: [] }}
              colors={colors}
            />
          </View>
          <View style={[styles.chartContainer, { flex: 1, minWidth: width * 0.4 }]}>
            <BudgetVsActualChart 
              budgets={budgetAnalytics?.categoryBudgets || []}
              colors={colors}
            />
          </View>
        </View>
        
        {/* Alerts Panel */}
        <AlertsPanel 
          alerts={alerts}
          onAlertPress={(alert) => {

            // Handle alert press - could navigate to specific screens
          }}
          colors={colors}
        />
      </View>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.tabContent}>
        {/* Payment Trends */}
        <View style={styles.chartContainer}>
          <PaymentTrendsChart 
            data={paymentAnalytics?.monthlyStats ? {
              labels: paymentAnalytics.monthlyStats.map(stat => stat.month),
              datasets: [{
                data: paymentAnalytics.monthlyStats.map(stat => stat.total)
              }]
            } : { labels: [], datasets: [] }}
            colors={colors}
          />
        </View>
        
        {/* Payroll Analytics */}
        <View style={styles.chartContainer}>
          <PayrollAnalyticsChart 
            data={payrollAnalytics?.monthlyTrends || { labels: [], datasets: [] }}
            colors={colors}
          />
        </View>
        
        {/* Additional Analytics */}
        <View style={styles.chartsRow}>
          <View style={[styles.chartContainer, { flex: 1, minWidth: width * 0.4 }]}>
            <RevenueAnalysisChart 
              data={revenueAnalytics?.monthlyTrends || { labels: [], datasets: [] }}
              colors={colors}
            />
          </View>
          <View style={[styles.chartContainer, { flex: 1, minWidth: width * 0.4 }]}>
            <ExpenseBreakdownChart 
              data={expenseAnalytics?.monthlyTrends || { labels: [], datasets: [] }}
              colors={colors}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderReportsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.tabContent}>
        <ReportsPanel 
          dateRange={dateRange}
          onGenerateReport={(type) => {

            // Handle report generation
          }}
          onExportReport={(type, format) => {

            // Handle report export
          }}
          colors={colors}
        />
      </View>
    </ScrollView>
  );

  const renderActionsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.tabContent}>
        <QuickActionsPanel onAction={handleQuickAction} colors={colors} />
        <AlertsPanel 
          alerts={alerts}
          onAlertPress={(alert) => {

            // Handle alert press - could navigate to specific screens
          }}
          colors={colors}
        />
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'analytics':
        return renderAnalyticsTab();
      case 'reports':
        return renderReportsTab();
      case 'actions':
        return renderActionsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="account-balance-wallet" size={48} color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loading_finance_data')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FinanceHeader
        title={t('finance_dashboard')}
        onFilterPress={() => setShowFilters(true)}
        onDateRangePress={() => setShowDatePicker(true)}
      />
      
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <View style={styles.tabRow}>
          {renderTabButton('overview', t('overview'), 'dashboard')}
          {renderTabButton('analytics', t('analytics'), 'analytics')}
          {renderTabButton('reports', t('reports'), 'assessment')}
          {renderTabButton('actions', t('actions'), 'build')}
        </View>
      </View>
      
      {/* Tab Content */}
      {renderTabContent()}
      
      {/* Modals */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />
      
      <AddPaymentModal
        visible={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        onSave={(payment) => {

          setShowAddPayment(false);
        }}
      />
      
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSave={(expense) => {

          setShowAddExpense(false);
        }}
      />
      
      <AddBudgetModal
        visible={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        onSave={(budget) => {

          setShowAddBudget(false);
        }}
      />
      
      {/* Date Range Picker Modal */}
      {showDatePicker && (
        <View style={styles.modalContainer}>
          <DateRangePicker
            onDateRangeSelected={setDateRange}
            onClose={() => setShowDatePicker(false)}
          />
        </View>
      )}
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
    marginTop: 16,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabRow: {
    flexDirection: 'row',
    padding: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  chartsRow: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 16,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
});

export default FinanceDashboardScreen; 
