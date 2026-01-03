import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import secureApiService from '../../../services/secureApiService';
import ComprehensiveFinanceApiService, { 
  Payment, 
  Refund, 
  Installment, 
  Expense, 
  Income, 
  Budget, 
  Fee, 
  Payroll, 
  FinanceAnalytics, 
  FinanceDashboard 
} from '../services/comprehensiveFinanceApi';

export interface FinanceState {
  // Data
  payments: Payment[];
  refunds: Refund[];
  installments: Installment[];
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  fees: Fee[];
  payrolls: Payroll[];
  
  // Analytics
  analytics: FinanceAnalytics | null;
  dashboard: FinanceDashboard | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedPeriod: string;
  selectedCategory: string;
  searchQuery: string;
  
  // Modals
  showAddPaymentModal: boolean;
  showAddExpenseModal: boolean;
  showAddBudgetModal: boolean;
  showAddRefundModal: boolean;
  showAddInstallmentModal: boolean;
  showAddIncomeModal: boolean;
  showAddFeeModal: boolean;
  showAddPayrollModal: boolean;
  showExportModal: boolean;
  showFilterModal: boolean;
  
  // Advanced Features (real data only)
  reports: any[];
  alerts: any[];
  notifications: any[];
}

export interface FinanceActions {
  // Data fetching
  fetchPayments: (params?: any) => Promise<void>;
  fetchRefunds: (params?: any) => Promise<void>;
  fetchInstallments: (params?: any) => Promise<void>;
  fetchExpenses: (params?: any) => Promise<void>;
  fetchIncomes: (params?: any) => Promise<void>;
  fetchBudgets: (params?: any) => Promise<void>;
  fetchFees: (params?: any) => Promise<void>;
  fetchPayrolls: (params?: any) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  
  // CRUD operations
  createPayment: (payment: Partial<Payment>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  
  createExpense: (expense: Partial<Expense>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  createBudget: (budget: Partial<Budget>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  createRefund: (refund: Partial<Refund>) => Promise<void>;
  createInstallment: (installment: Partial<Installment>) => Promise<void>;
  createIncome: (income: Partial<Income>) => Promise<void>;
  createFee: (fee: Partial<Fee>) => Promise<void>;
  createPayroll: (payroll: Partial<Payroll>) => Promise<void>;
  
  // Bulk operations
  bulkCreatePayments: (payments: Partial<Payment>[]) => Promise<void>;
  updatePaymentStatus: (id: string, status: string, remarks?: string) => Promise<void>;
  bulkUpdatePaymentStatus: (ids: string[], status: string) => Promise<void>;
  
  // Search and filter
  searchPayments: (query: string) => Promise<void>;
  getOverduePayments: () => Promise<void>;
  
  // Reports
  generatePaymentReport: (params?: any) => Promise<any>;
  generateIntegratedPaymentReport: (params?: any) => Promise<any>;
  
  // UI actions
  setSelectedPeriod: (period: string) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setError: (error: string | null) => void;
  
  // Modal actions
  setShowAddPaymentModal: (show: boolean) => void;
  setShowAddExpenseModal: (show: boolean) => void;
  setShowAddBudgetModal: (show: boolean) => void;
  setShowAddRefundModal: (show: boolean) => void;
  setShowAddInstallmentModal: (show: boolean) => void;
  setShowAddIncomeModal: (show: boolean) => void;
  setShowAddFeeModal: (show: boolean) => void;
  setShowAddPayrollModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setShowFilterModal: (show: boolean) => void;
  
  // Refresh all data
  refreshAllData: () => Promise<void>;
}

// Real API data only - no dummy data generators

export const useFinance = (): FinanceState & FinanceActions => {
  const [state, setState] = useState<FinanceState>({
    // Data
    payments: [],
    refunds: [],
    installments: [],
    expenses: [],
    incomes: [],
    budgets: [],
    fees: [],
    payrolls: [],
    
    // Analytics
    analytics: null,
    dashboard: null,
    
    // UI State
    loading: false,
    error: null,
    selectedPeriod: 'current_month',
    selectedCategory: 'all',
    searchQuery: '',
    
    // Modals
    showAddPaymentModal: false,
    showAddExpenseModal: false,
    showAddBudgetModal: false,
    showAddRefundModal: false,
    showAddInstallmentModal: false,
    showAddIncomeModal: false,
    showAddFeeModal: false,
    showAddPayrollModal: false,
    showExportModal: false,
    showFilterModal: false,
    
    // Advanced Features (real data only)
    reports: [],
    alerts: [],
    notifications: []
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<FinanceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to extract data from API responses
  const extractData = useCallback((result: any) => {
    if (!result) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data;
    }
    return result;
  }, []);

  // Helper function to handle API calls (real data only)
  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    setData: (data: T) => void,
    emptyState?: T
  ): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      const data = await apiCall();
      const extractedData = extractData(data);
      setData(extractedData);
    } catch (error: any) {
      console.error('API call failed:', error);
      
      // Set informative error message
      let errorMessage = 'Failed to fetch data';
      if (error?.isNetworkError) {
        errorMessage = 'Network error - server not accessible';
      } else if (error?.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - server not responding';
      } else if (error?.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - unable to connect to server';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Set empty state instead of dummy data
      if (emptyState !== undefined) {
        setData(emptyState);
      }
      
      updateState({ error: errorMessage });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  // Data fetching functions
  const fetchPayments = useCallback(async (params?: any) => {
    await handleApiCall(
      () => secureApiService.get('/payments', { params }),
      (data) => updateState({ payments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  // Enhanced payment operations
  const getPaymentById = useCallback(async (id: string) => {
    try {
      const payment = await ComprehensiveFinanceApiService.getPaymentById(id);
      return payment;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getStudentPayments = useCallback(async (studentId: string) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getStudentPayments(studentId),
      (data) => updateState({ payments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const getParentPayments = useCallback(async (parentId: string) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getParentPayments(parentId),
      (data) => updateState({ payments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const getOverduePayments = useCallback(async () => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getOverduePayments(),
      (data) => updateState({ payments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const getRecentPayments = useCallback(async () => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getRecentPayments(),
      (data) => updateState({ payments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const getUpcomingPayments = useCallback(async () => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getUpcomingPayments(),
      (data) => updateState({ payments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const getDashboardSummary = useCallback(async () => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getDashboardSummary(),
      (data) => updateState({ dashboard: data }),
      null
    );
  }, [handleApiCall, updateState]);

  const fetchRefunds = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getRefunds(params),
      (data) => updateState({ refunds: data }),
      []
    );
  }, [handleApiCall, updateState]);

  // Enhanced refund operations
  const getRefundById = useCallback(async (id: string) => {
    try {
      const refund = await ComprehensiveFinanceApiService.getRefundById(id);
      return refund;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getRefundsByPayment = useCallback(async (paymentId: string) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getRefundsByPayment(paymentId),
      (data) => updateState({ refunds: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const processRefund = useCallback(async (id: string) => {
    try {
      const refund = await ComprehensiveFinanceApiService.processRefund(id);
      return refund;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const cancelRefund = useCallback(async (id: string) => {
    try {
      const refund = await ComprehensiveFinanceApiService.cancelRefund(id);
      return refund;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getRefundStatistics = useCallback(async () => {
    try {
      const stats = await ComprehensiveFinanceApiService.getRefundStatistics();
      return stats;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getRefundAnalytics = useCallback(async () => {
    try {
      const analytics = await ComprehensiveFinanceApiService.getRefundAnalytics();
      return analytics;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getRefundDashboard = useCallback(async () => {
    try {
      const dashboard = await ComprehensiveFinanceApiService.getRefundDashboard();
      return dashboard;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const searchRefunds = useCallback(async (query: string) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.searchRefunds(query),
      (data) => updateState({ refunds: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const bulkUpdateRefunds = useCallback(async (updates: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.bulkUpdateRefunds(updates);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const fetchInstallments = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getInstallments(params),
      (data) => updateState({ installments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  // Enhanced installment operations
  const getInstallmentsByPayment = useCallback(async (paymentId: string) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getPaymentInstallments(paymentId),
      (data) => updateState({ installments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const createPaymentInstallment = useCallback(async (paymentId: string, installment: Partial<Installment>) => {
    try {
      const result = await ComprehensiveFinanceApiService.createPaymentInstallment(paymentId, installment);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const updateInstallmentStatus = useCallback(async (installmentId: string, status: string) => {
    try {
      const result = await ComprehensiveFinanceApiService.updateInstallmentStatus(installmentId, status);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const markInstallmentAsPaid = useCallback(async (id: string, paidAmount: number) => {
    try {
      const result = await ComprehensiveFinanceApiService.markInstallmentAsPaid(id, paidAmount);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getOverdueInstallments = useCallback(async () => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getOverdueInstallments(),
      (data) => updateState({ installments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const getUpcomingInstallments = useCallback(async () => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getUpcomingInstallments(),
      (data) => updateState({ installments: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const fetchExpenses = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getExpenses(params),
      (data) => updateState({ expenses: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const fetchIncomes = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getIncomes(params),
      (data) => updateState({ incomes: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const fetchBudgets = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getBudgets(params),
      (data) => updateState({ budgets: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const fetchFees = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getFees(params),
      (data) => updateState({ fees: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const fetchPayrolls = useCallback(async (params?: any) => {
    await handleApiCall(
      () => ComprehensiveFinanceApiService.getPayrolls(params),
      (data) => updateState({ payrolls: data }),
      []
    );
  }, [handleApiCall, updateState]);

  const fetchAnalytics = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const analytics = await ComprehensiveFinanceApiService.getFinanceAnalytics();
      const extractedAnalytics = extractData(analytics);
      updateState({ analytics: extractedAnalytics });
    } catch (error) {
      
      updateState({ analytics: null });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  // Integrated Payment Operations
  const createPaymentWithInstallments = useCallback(async (paymentData: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.createPaymentWithInstallments(paymentData);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getCompletePaymentDetails = useCallback(async (paymentId: string) => {
    try {
      const result = await ComprehensiveFinanceApiService.getCompletePaymentDetails(paymentId);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const processRefundForPayment = useCallback(async (paymentId: string, refundData: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.processRefundForPayment(paymentId, refundData);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const payInstallment = useCallback(async (installmentId: string, paymentData: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.payInstallment(installmentId, paymentData);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getPaymentDashboard = useCallback(async () => {
    try {
      const result = await ComprehensiveFinanceApiService.getPaymentDashboard();
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const generateIntegratedPaymentReport = useCallback(async (params?: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.generateIntegratedPaymentReport(params);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getPaymentAnalytics = useCallback(async () => {
    try {
      const result = await ComprehensiveFinanceApiService.getPaymentAnalytics();
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const bulkPaymentOperations = useCallback(async (operations: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.bulkPaymentOperations(operations);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const dashboard = await ComprehensiveFinanceApiService.getFinanceDashboard();
      const extractedDashboard = extractData(dashboard);
      updateState({ dashboard: extractedDashboard, usingDummyData: false });
    } catch (error) {
      
      updateState({ dashboard: null, usingDummyData: true });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  // CRUD operations
  const createPayment = useCallback(async (payment: Partial<Payment>) => {
    try {
      updateState({ loading: true, error: null });
      const newPayment = await ComprehensiveFinanceApiService.createPayment(payment);
      const extractedPayment = extractData(newPayment);
      updateState(prev => ({ 
        payments: [extractedPayment, ...prev.payments],
        showAddPaymentModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create payment' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  const updatePayment = useCallback(async (id: string, payment: Partial<Payment>) => {
    try {
      updateState({ loading: true, error: null });
      const updatedPayment = await ComprehensiveFinanceApiService.updatePayment(id, payment);
      const extractedPayment = extractData(updatedPayment);
      updateState(prev => ({
        payments: prev.payments.map(p => p.id === id ? extractedPayment : p)
      }));
    } catch (error) {
      updateState({ error: 'Failed to update payment' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  const deletePayment = useCallback(async (id: string) => {
    try {
      updateState({ loading: true, error: null });
      await ComprehensiveFinanceApiService.deletePayment(id);
      updateState(prev => ({
        payments: prev.payments.filter(p => p.id !== id)
      }));
    } catch (error) {
      updateState({ error: 'Failed to delete payment' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createExpense = useCallback(async (expense: Partial<Expense>) => {
    try {
      updateState({ loading: true, error: null });
      const newExpense = await ComprehensiveFinanceApiService.createExpense(expense);
      const extractedExpense = extractData(newExpense);
      updateState(prev => ({ 
        expenses: [extractedExpense, ...prev.expenses],
        showAddExpenseModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create expense' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  const updateExpense = useCallback(async (id: string, expense: Partial<Expense>) => {
    try {
      updateState({ loading: true, error: null });
      const updatedExpense = await ComprehensiveFinanceApiService.updateExpense(id, expense);
      const extractedExpense = extractData(updatedExpense);
      updateState(prev => ({
        expenses: prev.expenses.map(e => e.id === id ? extractedExpense : e)
      }));
    } catch (error) {
      updateState({ error: 'Failed to update expense' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      updateState({ loading: true, error: null });
      await ComprehensiveFinanceApiService.deleteExpense(id);
      updateState(prev => ({
        expenses: prev.expenses.filter(e => e.id !== id)
      }));
    } catch (error) {
      updateState({ error: 'Failed to delete expense' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createBudget = useCallback(async (budget: Partial<Budget>) => {
    try {
      updateState({ loading: true, error: null });
      const newBudget = await ComprehensiveFinanceApiService.createBudget(budget);
      updateState(prev => ({ 
        budgets: [newBudget, ...prev.budgets],
        showAddBudgetModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create budget' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const updateBudget = useCallback(async (id: string, budget: Partial<Budget>) => {
    try {
      updateState({ loading: true, error: null });
      const updatedBudget = await ComprehensiveFinanceApiService.updateBudget(id, budget);
      updateState(prev => ({
        budgets: prev.budgets.map(b => b.id === id ? updatedBudget : b)
      }));
    } catch (error) {
      updateState({ error: 'Failed to update budget' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      updateState({ loading: true, error: null });
      await ComprehensiveFinanceApiService.deleteBudget(id);
      updateState(prev => ({
        budgets: prev.budgets.filter(b => b.id !== id)
      }));
    } catch (error) {
      updateState({ error: 'Failed to delete budget' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createRefund = useCallback(async (refund: Partial<Refund>) => {
    try {
      updateState({ loading: true, error: null });
      const newRefund = await ComprehensiveFinanceApiService.createRefund(refund);
      updateState(prev => ({ 
        refunds: [newRefund, ...prev.refunds],
        showAddRefundModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create refund' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createInstallment = useCallback(async (installment: Partial<Installment>) => {
    try {
      updateState({ loading: true, error: null });
      const newInstallment = await ComprehensiveFinanceApiService.createInstallment(installment);
      updateState(prev => ({ 
        installments: [newInstallment, ...prev.installments],
        showAddInstallmentModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create installment' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createIncome = useCallback(async (income: Partial<Income>) => {
    try {
      updateState({ loading: true, error: null });
      const newIncome = await ComprehensiveFinanceApiService.createIncome(income);
      updateState(prev => ({ 
        incomes: [newIncome, ...prev.incomes],
        showAddIncomeModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create income' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createFee = useCallback(async (fee: Partial<Fee>) => {
    try {
      updateState({ loading: true, error: null });
      const newFee = await ComprehensiveFinanceApiService.createFee(fee);
      updateState(prev => ({ 
        fees: [newFee, ...prev.fees],
        showAddFeeModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create fee' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const createPayroll = useCallback(async (payroll: Partial<Payroll>) => {
    try {
      updateState({ loading: true, error: null });
      const newPayroll = await ComprehensiveFinanceApiService.createPayroll(payroll);
      updateState(prev => ({ 
        payrolls: [newPayroll, ...prev.payrolls],
        showAddPayrollModal: false 
      }));
    } catch (error) {
      updateState({ error: 'Failed to create payroll' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Bulk operations
  const bulkCreatePayments = useCallback(async (payments: Partial<Payment>[]) => {
    try {
      updateState({ loading: true, error: null });
      const newPayments = await ComprehensiveFinanceApiService.bulkCreatePayments(payments);
      updateState(prev => ({ 
        payments: [...newPayments, ...prev.payments]
      }));
    } catch (error) {
      updateState({ error: 'Failed to create bulk payments' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  const updatePaymentStatus = useCallback(async (id: string, status: string, remarks?: string) => {
    try {
      updateState({ loading: true, error: null });
      const updatedPayment = await ComprehensiveFinanceApiService.updatePaymentStatus(id, status);
      const extractedPayment = extractData(updatedPayment);
      updateState(prev => ({
        payments: prev.payments.map(p => p.id === id ? extractedPayment : p)
      }));
    } catch (error) {
      updateState({ error: 'Failed to update payment status' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState, extractData]);

  const bulkUpdatePaymentStatus = useCallback(async (ids: string[], status: string) => {
    try {
      updateState({ loading: true, error: null });
      await ComprehensiveFinanceApiService.bulkUpdatePaymentStatus(ids, status);
      updateState(prev => ({
        payments: prev.payments.map(p => 
          ids.includes(p.id) ? { ...p, status: status } : p
        )
      }));
    } catch (error) {
      updateState({ error: 'Failed to update payment status' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Search and filter
  const searchPayments = useCallback(async (query: string) => {
    try {
      updateState({ loading: true, error: null });
      const results = await ComprehensiveFinanceApiService.searchPayments(query);
      updateState({ payments: results, searchQuery: query });
    } catch (error) {
      updateState({ error: 'Failed to search payments' });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Reports
  const generatePaymentReport = useCallback(async (params?: any) => {
    try {
      updateState({ loading: true, error: null });
      const report = await ComprehensiveFinanceApiService.generatePaymentReport(params);
      return report;
    } catch (error) {
      updateState({ error: 'Failed to generate report' });
      return null;
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // UI actions
  const setSelectedPeriod = useCallback((period: string) => {
    updateState({ selectedPeriod: period });
  }, [updateState]);

  const setSelectedCategory = useCallback((category: string) => {
    updateState({ selectedCategory: category });
  }, [updateState]);

  const setSearchQuery = useCallback((query: string) => {
    updateState({ searchQuery: query });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  // Modal actions
  const setShowAddPaymentModal = useCallback((show: boolean) => {
    updateState({ showAddPaymentModal: show });
  }, [updateState]);

  const setShowAddExpenseModal = useCallback((show: boolean) => {
    updateState({ showAddExpenseModal: show });
  }, [updateState]);

  const setShowAddBudgetModal = useCallback((show: boolean) => {
    updateState({ showAddBudgetModal: show });
  }, [updateState]);

  const setShowAddRefundModal = useCallback((show: boolean) => {
    updateState({ showAddRefundModal: show });
  }, [updateState]);

  const setShowAddInstallmentModal = useCallback((show: boolean) => {
    updateState({ showAddInstallmentModal: show });
  }, [updateState]);

  const setShowAddIncomeModal = useCallback((show: boolean) => {
    updateState({ showAddIncomeModal: show });
  }, [updateState]);

  const setShowAddFeeModal = useCallback((show: boolean) => {
    updateState({ showAddFeeModal: show });
  }, [updateState]);

  const setShowAddPayrollModal = useCallback((show: boolean) => {
    updateState({ showAddPayrollModal: show });
  }, [updateState]);

  const setShowExportModal = useCallback((show: boolean) => {
    updateState({ showExportModal: show });
  }, [updateState]);

  const setShowFilterModal = useCallback((show: boolean) => {
    updateState({ showFilterModal: show });
  }, [updateState]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      await Promise.all([
        fetchPayments(),
        fetchRefunds(),
        fetchInstallments(),
        fetchExpenses(),
        fetchIncomes(),
        fetchBudgets(),
        fetchFees(),
        fetchPayrolls(),
        fetchAnalytics(),
        fetchDashboard(),
      ]);
    } catch (error) {
      updateState({ error: 'Failed to refresh data' });
    } finally {
      updateState({ loading: false });
    }
  }, [
    fetchPayments,
    fetchRefunds,
    fetchInstallments,
    fetchExpenses,
    fetchIncomes,
    fetchBudgets,
    fetchFees,
    fetchPayrolls,
    fetchAnalytics,
    fetchDashboard,
    updateState,
  ]);

  // Initial data load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Load all finance data with real API calls only
  const loadFinanceData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Load real data from API
      const [
        paymentsRes,
        expensesRes,
        incomesRes,
        budgetsRes,
        analyticsRes,
        dashboardRes
      ] = await Promise.allSettled([
        ComprehensiveFinanceApiService.getPayments(),
        ComprehensiveFinanceApiService.getExpenses(),
        ComprehensiveFinanceApiService.getIncomes(),
        ComprehensiveFinanceApiService.getBudgets(),
        ComprehensiveFinanceApiService.getPaymentAnalytics(),
        ComprehensiveFinanceApiService.getDashboardSummary()
      ]);

      // Use real data from successful API calls, empty arrays for failed ones
      setState(prev => ({
        ...prev,
        payments: paymentsRes.status === 'fulfilled' ? paymentsRes.value : [],
        expenses: expensesRes.status === 'fulfilled' ? expensesRes.value : [],
        incomes: incomesRes.status === 'fulfilled' ? incomesRes.value : [],
        budgets: budgetsRes.status === 'fulfilled' ? budgetsRes.value : [],
        analytics: analyticsRes.status === 'fulfilled' ? analyticsRes.value : null,
        dashboard: dashboardRes.status === 'fulfilled' ? dashboardRes.value : null,
        reports: [],
        alerts: [],
        notifications: [],
        loading: false
      }));
      
      // Log any failed API calls
      [paymentsRes, expensesRes, incomesRes, budgetsRes, analyticsRes, dashboardRes].forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['payments', 'expenses', 'incomes', 'budgets', 'analytics', 'dashboard'];
          console.error(`Failed to load ${apiNames[index]}:`, result.reason);
        }
      });
      
    } catch (error) {
      console.error('Failed to load finance data:', error);
      setState(prev => ({
        ...prev,
        payments: [],
        expenses: [],
        incomes: [],
        budgets: [],
        analytics: null,
        reports: [],
        alerts: [],
        notifications: [],
        loading: false,
        error: 'Failed to load finance data from server.'
      }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Gateway & Webhook Operations
  const handleWebhook = useCallback(async (gateway: string, webhookData: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.handleWebhook(gateway, webhookData);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const getGatewayStatus = useCallback(async (transactionId: string) => {
    try {
      const result = await ComprehensiveFinanceApiService.getGatewayStatus(transactionId);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Utility Operations
  const generateReceiptNumber = useCallback(async (schoolId: string) => {
    try {
      const result = await ComprehensiveFinanceApiService.generateReceiptNumber(schoolId);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const calculateFines = useCallback(async (dueDate: string, amount: number) => {
    try {
      const result = await ComprehensiveFinanceApiService.calculateFines(dueDate, amount);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const validatePaymentData = useCallback(async (paymentData: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.validatePaymentData(paymentData);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const validateRefundData = useCallback(async (refundData: any) => {
    try {
      const result = await ComprehensiveFinanceApiService.validateRefundData(refundData);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Notification Operations
  const sendPaymentReminders = useCallback(async (paymentIds: string[]) => {
    try {
      await ComprehensiveFinanceApiService.sendPaymentReminders(paymentIds);
    } catch (error) {
      
      throw error;
    }
  }, []);

  const sendRefundNotifications = useCallback(async (refundId: string) => {
    try {
      await ComprehensiveFinanceApiService.sendRefundNotifications(refundId);
    } catch (error) {
      
      throw error;
    }
  }, []);

  const sendInstallmentReminders = useCallback(async (installmentIds: string[]) => {
    try {
      await ComprehensiveFinanceApiService.sendInstallmentReminders(installmentIds);
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Audit & Logging Operations
  const getPaymentLogs = useCallback(async (paymentId: string) => {
    try {
      const result = await ComprehensiveFinanceApiService.getPaymentLogs(paymentId);
      return result;
    } catch (error) {
      
      throw error;
    }
  }, []);

  // Cache Operations
  const cachePayment = useCallback(async (payment: Payment) => {
    try {
      await ComprehensiveFinanceApiService.cachePayment(payment);
    } catch (error) {
      
    }
  }, []);

  const invalidatePaymentCache = useCallback(async (paymentId: string) => {
    try {
      await ComprehensiveFinanceApiService.invalidatePaymentCache(paymentId);
    } catch (error) {
      
    }
  }, []);

  return {
    ...state,
    // Basic CRUD operations
    fetchPayments,
    fetchRefunds,
    fetchInstallments,
    fetchExpenses,
    fetchIncomes,
    fetchBudgets,
    fetchFees,
    fetchPayrolls,
    fetchAnalytics,
    fetchDashboard,
    createPayment,
    updatePayment,
    deletePayment,
    createExpense,
    updateExpense,
    deleteExpense,
    createBudget,
    updateBudget,
    deleteBudget,
    createRefund,
    createInstallment,
    createIncome,
    createFee,
    createPayroll,
    
    // Enhanced Payment Operations
    getPaymentById,
    getStudentPayments,
    getParentPayments,
    getOverduePayments,
    getRecentPayments,
    getUpcomingPayments,
    getDashboardSummary,
    updatePaymentStatus,
    
    // Enhanced Refund Operations
    getRefundById,
    getRefundsByPayment,
    processRefund,
    cancelRefund,
    getRefundStatistics,
    getRefundAnalytics,
    getRefundDashboard,
    searchRefunds,
    bulkUpdateRefunds,
    
    // Enhanced Installment Operations
    getInstallmentsByPayment,
    createPaymentInstallment,
    updateInstallmentStatus,
    markInstallmentAsPaid,
    getOverdueInstallments,
    getUpcomingInstallments,
    
    // Integrated Payment Operations
    createPaymentWithInstallments,
    getCompletePaymentDetails,
    processRefundForPayment,
    payInstallment,
    getPaymentDashboard,
    generateIntegratedPaymentReport,
    getPaymentAnalytics,
    bulkPaymentOperations,
    
    // Gateway & Webhook Operations
    handleWebhook,
    getGatewayStatus,
    
    // Utility Operations
    generateReceiptNumber,
    calculateFines,
    validatePaymentData,
    validateRefundData,
    
    // Notification Operations
    sendPaymentReminders,
    sendRefundNotifications,
    sendInstallmentReminders,
    
    // Audit & Logging Operations
    getPaymentLogs,
    
    // Cache Operations
    cachePayment,
    invalidatePaymentCache,
    
    // Bulk operations
    bulkCreatePayments,
    bulkUpdatePaymentStatus,
    
    // Search and filter
    searchPayments,
    getOverduePayments,
    
    // Reports
    generatePaymentReport,
    generateIntegratedPaymentReport,
    
    // UI actions
    setSelectedPeriod,
    setSelectedCategory,
    setSearchQuery,
    setError,
    
    // Modal actions
    setShowAddPaymentModal,
    setShowAddExpenseModal,
    setShowAddBudgetModal,
    setShowAddRefundModal,
    setShowAddInstallmentModal,
    setShowAddIncomeModal,
    setShowAddFeeModal,
    setShowAddPayrollModal,
    setShowExportModal,
    setShowFilterModal,
    
    // Refresh all data
    refreshAllData,
    loadFinanceData
  };
}; 
