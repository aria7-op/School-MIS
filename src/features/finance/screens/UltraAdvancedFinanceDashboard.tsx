import React, { useState, useEffect } from 'react';
import { View, ScrollView, SafeAreaView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import FinanceHeader from '../components/FinanceHeader';
import SegmentedControl from '../components/SegmentedControl';
import PaymentsList from '../components/PaymentsList';
import BudgetList from '../components/BudgetList';
import ExpensesList from '../components/ExpensesList';
import PayrollList from '../components/PayrollList';
import financeApi from '../services/comprehensiveFinanceApi';
import {
  GenerateBillModal,
  ProcessPayrollModal,
  RecordPaymentModal,
  GenerateReportModal,
  ExportDataModal,
  ViewAnalyticsModal,
  ReviewBudgetsModal,
  AddBudgetModal,
  AddExpenseModal,
} from '../components/modals';
import CashFlowChart from '../components/CashFlowChart';
import RevenueAnalysisChart from '../components/RevenueAnalysisChart';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import BudgetVsActualChart from '../components/BudgetVsActualChart';
import PaymentTrendsChart from '../components/PaymentTrendsChart';
import PayrollAnalyticsChart from '../components/PayrollAnalyticsChart';
import TransactionChart from '../components/TransactionChart';
import FinancialMetricsCard from '../components/FinancialMetricsCard';
import QuickActionsPanel from '../components/QuickActionsPanel';
import AlertsPanel from '../components/AlertsPanel';
import ReportsPanel from '../components/ReportsPanel';
import ExportOptionsModal from '../components/ExportOptionsModal';
import UpcomingBills from '../components/UpcomingBills';
import EmptyState from '../components/EmptyState';
import AddTransactionFAB from '../components/AddTransactionFAB';
// AI, Gamification, Real-time hooks (mocked for now)
const AI = {
  analyzeFinancialTrends: async (data: any) => ({ cashFlowPrediction: { nextMonth: 0 }, riskAssessment: { level: 'LOW' }, investmentRecommendations: [], costOptimization: { potentialSavings: 0 } }),
  predictRevenue: async (data: any) => ({ nextMonth: 0 }),
  detectAnomalies: async (data: any) => ({ anomalies: [] }),
  generateInsights: async (data: any) => ({ insights: ['Revenue up 15%'], trends: { positive: 1 } })
};
const Gamification = {
  getUserLevel: async () => ({ level: 0, xp: 0, title: '', achievements: 0 }),
  awardXP: async (amount: number) => ({ newXP: 0, levelUp: false }),
  unlockAchievement: async (achievement: string) => ({ unlocked: false, reward: '' }),
  getLeaderboard: async () => []
};
const useFinanceRealtime = () => { /* Real-time updates hook (mock) */ };
const TABS = [
  'Dashboard', 'Payments', 'Expenses', 'Budgets', 'Payroll', 'Analytics', 'AI Insights', 'Gamification', 'Bulk Ops', 'Reports', 'Export/Import', 'Sanad Integration', 'Settings'
];
const defaultDateRange = { startDate: '', endDate: '' };
const UltraAdvancedFinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // State for modals
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  useEffect(() => {
    // Only fetch data once on mount
    if (!dataLoaded) {
      setLoading(true);
      Promise.all([
        financeApi.getFinanceDashboard(),
        financeApi.getPayments(),
        financeApi.getExpenses(),
        financeApi.getBudgets(),
        financeApi.getPayrolls(),
        financeApi.getRefunds(),
        financeApi.getInstallments(),
        financeApi.getIncomes(),
        financeApi.getFees(),
        AI.generateInsights({}),
        Gamification.getUserLevel(),
      ])
        .then(([
          dashboard,
          paymentsData,
          expensesData,
          budgetsData,
          payrollsData,
          refundsData,
          installmentsData,
          incomesData,
          feesData,
          aiData,
          gamificationData,
        ]) => {
          setDashboardData(dashboard);
          setPayments(paymentsData);
          setExpenses(expensesData);
          setBudgets(budgetsData);
          setPayrolls(payrollsData);
          setRefunds(refundsData);
          setInstallments(installmentsData);
          setIncomes(incomesData);
          setFees(feesData);
          setAiInsights(aiData);
          setGamification(gamificationData);
          setDataLoaded(true);
        })
        .catch(e => setError('Failed to load finance data'))
        .finally(() => setLoading(false));
    }
  }, [dataLoaded]); // Only depend on dataLoaded to prevent loops

  const renderTab = () => {
    if (loading) return <ActivityIndicator size="large" />;
    if (error) return <Text>{error}</Text>;
    switch (activeTab) {
      case 'Dashboard':
        return <ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {dashboardData?.summary && Object.entries(dashboardData.summary).map(([key, value]) => (
              <FinancialMetricsCard
                key={key}
                title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                value={typeof value === 'number' ? value : 0}
                icon={key.toLowerCase().includes('revenue') ? 'attach-money' : key.toLowerCase().includes('expense') ? 'money-off' : 'account-balance-wallet'}
                color={key.toLowerCase().includes('revenue') ? '#10b981' : key.toLowerCase().includes('expense') ? '#ef4444' : '#6366f1'}
              />
            ))}
          </View>
          <CashFlowChart data={dashboardData?.cashFlow || []} />
          <RevenueAnalysisChart data={dashboardData?.revenue || []} />
          <ExpenseBreakdownChart data={dashboardData?.expenses || []} />
          <BudgetVsActualChart data={dashboardData?.budgets || []} />
          <UpcomingBills bills={dashboardData?.upcomingBills || []} onPrint={() => {}} />
          <QuickActionsPanel onAction={() => {}} />
          <AlertsPanel alerts={dashboardData?.alerts || []} onAlertPress={() => {}} colors={{}} />
        </ScrollView>;
      case 'Payments':
        return <PaymentsList payments={payments} dateRange={defaultDateRange} />;
      case 'Expenses':
        return <ExpensesList expenses={expenses} dateRange={defaultDateRange} />;
      case 'Budgets':
        return <BudgetList budgets={budgets} />;
      case 'Payroll':
        return <PayrollList />;
      case 'Refunds':
        return <ScrollView>{refunds.length ? refunds.map(r => <Text key={r.id}>{JSON.stringify(r)}</Text>) : <EmptyState activeTab={activeTab as any} />}</ScrollView>;
      case 'Installments':
        return <ScrollView>{installments.length ? installments.map(i => <Text key={i.id}>{JSON.stringify(i)}</Text>) : <EmptyState activeTab={activeTab as any} />}</ScrollView>;
      case 'Incomes':
        return <ScrollView>{incomes.length ? incomes.map(i => <Text key={i.id}>{JSON.stringify(i)}</Text>) : <EmptyState activeTab={activeTab as any} />}</ScrollView>;
      case 'Fee Structures':
        return <ScrollView>{fees.length ? fees.map(f => <Text key={f.id}>{JSON.stringify(f)}</Text>) : <EmptyState activeTab={activeTab as any} />}</ScrollView>;
      case 'Analytics':
        return <View>
          <TouchableOpacity onPress={() => setAnalyticsModalVisible(true)}><Text>Open Analytics Modal</Text></TouchableOpacity>
          <ViewAnalyticsModal visible={analyticsModalVisible} onClose={() => setAnalyticsModalVisible(false)} onGenerate={() => {}} />
        </View>;
      case 'AI Insights':
        return <ScrollView><Text>AI Insights</Text><Text>{JSON.stringify(aiInsights)}</Text></ScrollView>;
      case 'Gamification':
        return <ScrollView><Text>Level: {gamification?.level}</Text><Text>XP: {gamification?.xp}</Text><Text>Title: {gamification?.title}</Text></ScrollView>;
      case 'Bulk Ops':
        return <Text>Bulk Operations (Coming Soon)</Text>;
      case 'Reports':
        return <ReportsPanel dateRange={defaultDateRange} onGenerateReport={() => {}} onExportReport={() => {}} colors={{}} />;
      case 'Export/Import':
        return <View>
          <TouchableOpacity onPress={() => setExportModalVisible(true)}><Text>Open Export Modal</Text></TouchableOpacity>
          <ExportOptionsModal visible={exportModalVisible} onExport={async () => {}} onCancel={() => setExportModalVisible(false)} />
        </View>;
      case 'Sanad Integration':
        return <Text>Sanad/Accounting Integration (Coming Soon)</Text>;
      case 'Settings':
        return <Text>Settings (Coming Soon)</Text>;
      default:
        return <EmptyState activeTab={activeTab as any} />;
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FinanceHeader onFilterPress={() => {}} onSearchPress={() => {}} />
      <SegmentedControl
        tabs={[
          { key: 'Dashboard', label: 'Dashboard' },
          { key: 'Payments', label: 'Payments' },
          { key: 'Expenses', label: 'Expenses' },
          { key: 'Budgets', label: 'Budgets' },
          { key: 'Payroll', label: 'Payroll' },
          { key: 'Analytics', label: 'Analytics' },
          { key: 'AI Insights', label: 'AI Insights' },
          { key: 'Gamification', label: 'Gamification' },
          { key: 'Bulk Ops', label: 'Bulk Ops' },
          { key: 'Reports', label: 'Reports' },
          { key: 'Export/Import', label: 'Export/Import' },
          { key: 'Sanad Integration', label: 'Sanad Integration' },
          { key: 'Settings', label: 'Settings' },
          { key: 'Refunds', label: 'Refunds' },
          { key: 'Installments', label: 'Installments' },
          { key: 'Incomes', label: 'Incomes' },
          { key: 'Fee Structures', label: 'Fee Structures' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <View style={{ flex: 1 }}>{renderTab()}</View>
      <AddTransactionFAB onPress={() => {}} />
    </SafeAreaView>
  );
};
export default UltraAdvancedFinanceDashboard; 