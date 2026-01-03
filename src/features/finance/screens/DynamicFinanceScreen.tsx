import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../contexts/TranslationContext';

// Import the new API hook
import useFinanceApi, { 
  Payment, 
  Expense, 
  Income, 
  Budget, 
  Payroll, 
  FeeStructure, 
  FinanceAnalytics 
} from '../hooks/useFinanceApi';

// Import components
import FinanceHeader from '../components/FinanceHeader';
import SegmentedControl from '../components/SegmentedControl';
import DynamicStatsOverview from '../components/DynamicStatsOverview';
import PaymentList from '../components/PaymentsList';
import ExpensesList from '../components/ExpensesList';
import BudgetList from '../components/BudgetList';
import PayrollList from '../components/PayrollList';
import FeesList from '../components/FeesList';
import AddButton from '../components/AddNewButton';

// Import modals
import PaymentModal from '../components/PaymentModal';
import AddExpenseModal from '../components/AddExpenseModal';
import AddBudgetModal from '../components/AddBudgetModal';

type FinanceTab = 'overview' | 'payments' | 'expenses' | 'budgets' | 'payrolls' | 'fees';

const DynamicFinanceScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const financeApi = useFinanceApi();

  // State
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null);

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const loadAllData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (financeApi.loading) {
      return;
    }

    try {
      const [
        paymentsData,
        expensesData,
        incomesData,
        budgetsData,
        payrollsData,
        feeStructuresData,
        analyticsData
      ] = await Promise.allSettled([
        financeApi.getPayments(),
        financeApi.getExpenses(),
        financeApi.getIncomes(),
        financeApi.getBudgets(),
        financeApi.getPayrolls(),
        financeApi.getFeeStructures(),
        financeApi.getFinanceAnalytics()
      ]);

      // Set data from successful results only
      if (paymentsData.status === 'fulfilled') {
        setPayments(paymentsData.value);
        } else {
        }

      if (expensesData.status === 'fulfilled') {
        setExpenses(expensesData.value);
        } else {
        }

      if (incomesData.status === 'fulfilled') {
        setIncomes(incomesData.value);
        } else {
        }

      if (budgetsData.status === 'fulfilled') {
        setBudgets(budgetsData.value);
        } else {
        }

      if (payrollsData.status === 'fulfilled') {
        setPayrolls(payrollsData.value);
        } else {
        }

      if (feeStructuresData.status === 'fulfilled') {
        setFeeStructures(feeStructuresData.value);
        } else {
        }

      if (analyticsData.status === 'fulfilled') {
        setAnalytics(analyticsData.value);
        } else {
        }

      // No fallback data - show only real data from APIs
      } catch (error: any) {
      console.error('❌ Error loading finance data:', error);
      // Don't show alert for API failures, just log them
      }
  }, []); // Remove financeApi dependency to prevent infinite loop

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  // Load data on mount (only once)
  useEffect(() => {
    loadAllData();
  }, []); // Empty dependency array to run only once

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleAddPayment = useCallback(() => {
    setSelectedItem(null);
    setShowPaymentModal(true);
  }, []);

  const handleEditPayment = useCallback((payment: Payment) => {
    setSelectedItem(payment);
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSubmit = useCallback(async (paymentData: Partial<Payment>) => {
    try {
      if (selectedItem) {
        // Update existing payment
        const updatedPayment = await financeApi.updatePayment(selectedItem.id, paymentData);
        if (updatedPayment) {
          setPayments(prev => prev.map(p => p.id === selectedItem.id ? updatedPayment : p));
          Alert.alert('Success', 'Payment updated successfully');
        }
      } else {
        // Create new payment
        const newPayment = await financeApi.createPayment(paymentData);
        if (newPayment) {
          setPayments(prev => [newPayment, ...prev]);
          Alert.alert('Success', 'Payment created successfully');
        }
      }
      setShowPaymentModal(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('❌ Error submitting payment:', error);
      Alert.alert('Error', error.message || 'Failed to submit payment');
    }
  }, [financeApi, selectedItem]);

  const handleDeletePayment = useCallback(async (paymentId: string) => {
    try {
      const success = await financeApi.deletePayment(paymentId);
      if (success) {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        Alert.alert('Success', 'Payment deleted successfully');
      }
    } catch (error: any) {
      console.error('❌ Error deleting payment:', error);
      Alert.alert('Error', error.message || 'Failed to delete payment');
    }
  }, [financeApi]);

  const handleAddExpense = useCallback(() => {
    setSelectedItem(null);
    setShowExpenseModal(true);
  }, []);

  const handleExpenseSubmit = useCallback(async (expenseData: Partial<Expense>) => {
    try {
      if (selectedItem) {
        // Update existing expense
        const updatedExpense = await financeApi.updateExpense(selectedItem.id, expenseData);
        if (updatedExpense) {
          setExpenses(prev => prev.map(e => e.id === selectedItem.id ? updatedExpense : e));
          Alert.alert('Success', 'Expense updated successfully');
        }
      } else {
        // Create new expense
        const newExpense = await financeApi.createExpense(expenseData);
        if (newExpense) {
          setExpenses(prev => [newExpense, ...prev]);
          Alert.alert('Success', 'Expense created successfully');
        }
      }
      setShowExpenseModal(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('❌ Error submitting expense:', error);
      Alert.alert('Error', error.message || 'Failed to submit expense');
    }
  }, [financeApi, selectedItem]);

  const handleAddBudget = useCallback(() => {
    setSelectedItem(null);
    setShowBudgetModal(true);
  }, []);

  const handleBudgetSubmit = useCallback(async (budgetData: Partial<Budget>) => {
    try {
      if (selectedItem) {
        // Update existing budget
        const updatedBudget = await financeApi.updateBudget(selectedItem.id, budgetData);
        if (updatedBudget) {
          setBudgets(prev => prev.map(b => b.id === selectedItem.id ? updatedBudget : b));
          Alert.alert('Success', 'Budget updated successfully');
        }
      } else {
        // Create new budget
        const newBudget = await financeApi.createBudget(budgetData);
        if (newBudget) {
          setBudgets(prev => [newBudget, ...prev]);
          Alert.alert('Success', 'Budget created successfully');
        }
      }
      setShowBudgetModal(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('❌ Error submitting budget:', error);
      Alert.alert('Error', error.message || 'Failed to submit budget');
    }
  }, [financeApi, selectedItem]);

  // =============================================================================
  // RENDER METHODS
  // =============================================================================

  const renderTabContent = () => {
    if (financeApi.loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading finance data...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <DynamicStatsOverview
              analytics={analytics}
              payments={payments}
              expenses={expenses}
              budgets={budgets}
              loading={financeApi.loading}
            />
          
            {/* Revenue vs Expenses Chart */}
            {analytics && (
              <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Financial Overview
                </Text>
                <View style={styles.chartData}>
                  <View style={styles.chartItem}>
                    <View style={[styles.chartBar, { backgroundColor: '#10b981', height: (analytics.totalRevenue / Math.max(analytics.totalRevenue, analytics.totalExpenses)) * 100 }]} />
                    <Text style={[styles.chartLabel, { color: colors.text }]}>Revenue</Text>
                    <Text style={[styles.chartValue, { color: '#10b981' }]}>
                      ${analytics.totalRevenue.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.chartItem}>
                    <View style={[styles.chartBar, { backgroundColor: '#ef4444', height: (analytics.totalExpenses / Math.max(analytics.totalRevenue, analytics.totalExpenses)) * 100 }]} />
                    <Text style={[styles.chartLabel, { color: colors.text }]}>Expenses</Text>
                    <Text style={[styles.chartValue, { color: '#ef4444' }]}>
                      ${analytics.totalExpenses.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.chartItem}>
                    <View style={[styles.chartBar, { backgroundColor: '#3b82f6', height: Math.abs(analytics.netProfit / Math.max(analytics.totalRevenue, analytics.totalExpenses)) * 100 }]} />
                    <Text style={[styles.chartLabel, { color: colors.text }]}>Net Profit</Text>
                    <Text style={[styles.chartValue, { color: analytics.netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                      ${analytics.netProfit.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        );

      case 'payments':
        return (
          <PaymentList
            payments={payments}
            onAddPayment={handleAddPayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            loading={financeApi.loading}
            error={financeApi.error}
          />
        );

      case 'expenses':
        return (
          <ExpensesList
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onEditExpense={(expense) => {
              setSelectedItem(expense);
              setShowExpenseModal(true);
            }}
            onDeleteExpense={async (expenseId) => {
              try {
                const success = await financeApi.deleteExpense(expenseId);
                if (success) {
                  setExpenses(prev => prev.filter(e => e.id !== expenseId));
                  Alert.alert('Success', 'Expense deleted successfully');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete expense');
              }
            }}
            loading={financeApi.loading}
            error={financeApi.error}
          />
        );

      case 'budgets':
        return (
          <BudgetList
            budgets={budgets}
            onAddBudget={handleAddBudget}
            onEditBudget={(budget) => {
              setSelectedItem(budget);
              setShowBudgetModal(true);
            }}
            onDeleteBudget={async (budgetId) => {
              try {
                const success = await financeApi.deleteBudget(budgetId);
                if (success) {
                  setBudgets(prev => prev.filter(b => b.id !== budgetId));
                  Alert.alert('Success', 'Budget deleted successfully');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete budget');
              }
            }}
            loading={financeApi.loading}
            error={financeApi.error}
          />
        );

      case 'payrolls':
        return (
          <PayrollList
            payrolls={payrolls}
            onAddPayroll={() => {
              // Handle add payroll
              }}
            onEditPayroll={(payroll) => {
              }}
            onDeletePayroll={async (payrollId) => {
              try {
                const success = await financeApi.deletePayroll(payrollId);
                if (success) {
                  setPayrolls(prev => prev.filter(p => p.id !== payrollId));
                  Alert.alert('Success', 'Payroll deleted successfully');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete payroll');
              }
            }}
            loading={financeApi.loading}
            error={financeApi.error}
          />
        );

      case 'fees':
        return (
          <FeesList
            feeStructures={feeStructures}
            onAddFee={() => {
              }}
            onEditFee={(fee) => {
              }}
            onDeleteFee={async (feeId) => {
              try {
                const success = await financeApi.deleteFeeStructure(feeId);
                if (success) {
                  setFeeStructures(prev => prev.filter(f => f.id !== feeId));
                  Alert.alert('Success', 'Fee structure deleted successfully');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete fee structure');
              }
            }}
            loading={financeApi.loading}
            error={financeApi.error}
          />
        );

      default:
        return null;
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'payments', label: 'Payments', icon: 'payment' },
    { key: 'expenses', label: 'Expenses', icon: 'receipt' },
    // { key: 'budgets', label: 'Budgets', icon: 'account-balance' },
    { key: 'payrolls', label: 'Payroll', icon: 'people' },
    // { key: 'fees', label: 'Fees', icon: 'school' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FinanceHeader 
        title="Finance Management"
        onRefresh={handleRefresh}
        loading={refreshing}
      />

      {/* Error Display */}
      {financeApi.error && (
        <View style={[styles.errorContainer, { backgroundColor: '#fef2f2' }]}>
          <Icon name="error" size={20} color="#ef4444" />
          <Text style={[styles.errorText, { color: '#ef4444' }]}>
            {financeApi.error}
          </Text>
          <TouchableOpacity onPress={financeApi.clearError}>
            <Icon name="close" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              { backgroundColor: activeTab === tab.key ? colors.primary : colors.card }
            ]}
            onPress={() => setActiveTab(tab.key as FinanceTab)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? 'white' : colors.text} 
            />
            <Text 
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? 'white' : colors.text }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* Add Button */}
      {(activeTab === 'payments' || activeTab === 'expenses' || activeTab === 'budgets') && (
        <AddButton
          onPress={() => {
            if (activeTab === 'payments') handleAddPayment();
            else if (activeTab === 'expenses') handleAddExpense();
            else if (activeTab === 'budgets') handleAddBudget();
          }}
        />
      )}

      {/* Modals */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedItem(null);
        }}
        onPaymentSuccess={(payment) => {
          // Refresh payments data
          financeApi.getPayments().then(data => {
            if (data.status === 'fulfilled') {
              setPayments(data.value);
            }
          });
          setShowPaymentModal(false);
          setSelectedItem(null);
        }}
      />

      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setSelectedItem(null);
        }}
        onSubmit={handleExpenseSubmit}
        expense={selectedItem}
      />

      <AddBudgetModal
        visible={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setSelectedItem(null);
        }}
        onSubmit={handleBudgetSubmit}
        budget={selectedItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    maxHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    minWidth: 100,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  chartBar: {
    width: 40,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  chartValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default DynamicFinanceScreen;