import { useState, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';

// Types
export interface Payment {
  id: string;
  studentId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  description?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  source: string;
  date: string;
  status: 'pending' | 'confirmed';
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  currency: string;
  payPeriod: string;
  payDate: string;
  status: 'pending' | 'processed' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  classId?: string;
  className?: string;
  tuitionFee: number;
  admissionFee: number;
  examFee: number;
  libraryFee: number;
  labFee: number;
  transportFee: number;
  miscFee: number;
  totalFee: number;
  currency: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  completedPayments: number;
  totalPayments: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
  paymentsByMethod: Record<string, number>;
  expensesByCategory: Record<string, number>;
  revenueGrowth: number;
  expenseGrowth: number;
  profitMargin: number;
  currency: string;
  period: string;
  lastUpdated: string;
}

export const useFinanceApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // PAYMENTS API
  // =============================================================================

  const getPayments = useCallback(async (params?: any): Promise<Payment[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getPayments(params);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch payments');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payments';
      setError(errorMessage);
      console.error('❌ getPayments error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (paymentData: Partial<Payment>): Promise<Payment | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createPayment(paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create payment';
      setError(errorMessage);
      console.error('❌ createPayment error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayment = useCallback(async (id: string, paymentData: Partial<Payment>): Promise<Payment | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updatePayment(id, paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update payment');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update payment';
      setError(errorMessage);
      console.error('❌ updatePayment error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deletePayment(id);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete payment');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete payment';
      setError(errorMessage);
      console.error('❌ deletePayment error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentAnalytics = useCallback(async (params?: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getPaymentAnalytics(params);
      if (response.success) {
        return response.data || {};
      } else {
        throw new Error(response.message || 'Failed to fetch payment analytics');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payment analytics';
      setError(errorMessage);
      console.error('❌ getPaymentAnalytics error:', errorMessage);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // EXPENSES API
  // =============================================================================

  const getExpenses = useCallback(async (params?: any): Promise<Expense[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getExpenses(params);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch expenses');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch expenses';
      setError(errorMessage);
      console.error('❌ getExpenses error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expenseData: Partial<Expense>): Promise<Expense | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createExpense(expenseData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create expense');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create expense';
      setError(errorMessage);
      console.error('❌ createExpense error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, expenseData: Partial<Expense>): Promise<Expense | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updateExpense(id, expenseData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update expense');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update expense';
      setError(errorMessage);
      console.error('❌ updateExpense error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deleteExpense(id);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete expense');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete expense';
      setError(errorMessage);
      console.error('❌ deleteExpense error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // INCOMES API
  // =============================================================================

  const getIncomes = useCallback(async (params?: any): Promise<Income[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getIncomes(params);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch incomes');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch incomes';
      setError(errorMessage);
      console.error('❌ getIncomes error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createIncome = useCallback(async (incomeData: Partial<Income>): Promise<Income | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createIncome(incomeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create income');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create income';
      setError(errorMessage);
      console.error('❌ createIncome error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIncome = useCallback(async (id: string, incomeData: Partial<Income>): Promise<Income | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updateIncome(id, incomeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update income');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update income';
      setError(errorMessage);
      console.error('❌ updateIncome error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteIncome = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deleteIncome(id);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete income');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete income';
      setError(errorMessage);
      console.error('❌ deleteIncome error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // BUDGETS API
  // =============================================================================

  const getBudgets = useCallback(async (params?: any): Promise<Budget[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getBudgets(params);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch budgets');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch budgets';
      setError(errorMessage);
      console.error('❌ getBudgets error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBudget = useCallback(async (budgetData: Partial<Budget>): Promise<Budget | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createBudget(budgetData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create budget');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create budget';
      setError(errorMessage);
      console.error('❌ createBudget error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBudget = useCallback(async (id: string, budgetData: Partial<Budget>): Promise<Budget | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updateBudget(id, budgetData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update budget');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update budget';
      setError(errorMessage);
      console.error('❌ updateBudget error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBudget = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deleteBudget(id);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete budget');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete budget';
      setError(errorMessage);
      console.error('❌ deleteBudget error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // PAYROLLS API
  // =============================================================================

  const getPayrolls = useCallback(async (params?: any): Promise<Payroll[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getPayrolls(params);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch payrolls');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payrolls';
      setError(errorMessage);
      console.error('❌ getPayrolls error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayroll = useCallback(async (payrollData: Partial<Payroll>): Promise<Payroll | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createPayroll(payrollData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payroll');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create payroll';
      setError(errorMessage);
      console.error('❌ createPayroll error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayroll = useCallback(async (id: string, payrollData: Partial<Payroll>): Promise<Payroll | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updatePayroll(id, payrollData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update payroll');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update payroll';
      setError(errorMessage);
      console.error('❌ updatePayroll error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePayroll = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deletePayroll(id);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete payroll');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete payroll';
      setError(errorMessage);
      console.error('❌ deletePayroll error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // FEE STRUCTURES API
  // =============================================================================

  const getFeeStructures = useCallback(async (): Promise<FeeStructure[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getFeeStructures();
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch fee structures');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch fee structures';
      setError(errorMessage);
      console.error('❌ getFeeStructures error:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createFeeStructure = useCallback(async (feeData: Partial<FeeStructure>): Promise<FeeStructure | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createFeeStructure(feeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create fee structure');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create fee structure';
      setError(errorMessage);
      console.error('❌ createFeeStructure error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFeeStructure = useCallback(async (id: string, feeData: Partial<FeeStructure>): Promise<FeeStructure | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updateFeeStructure(id, feeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update fee structure');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update fee structure';
      setError(errorMessage);
      console.error('❌ updateFeeStructure error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFeeStructure = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deleteFeeStructure(id);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete fee structure');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete fee structure';
      setError(errorMessage);
      console.error('❌ deleteFeeStructure error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // COMPREHENSIVE ANALYTICS
  // =============================================================================

  const getFinanceAnalytics = useCallback(async (params?: any): Promise<FinanceAnalytics | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [
        paymentsResponse,
        expensesResponse,
        incomesResponse,
        budgetsResponse,
        paymentAnalyticsResponse
      ] = await Promise.allSettled([
        secureApiService.getPayments(params),
        secureApiService.getExpenses(params),
        secureApiService.getIncomes(params),
        secureApiService.getBudgets(params),
        secureApiService.getPaymentAnalytics(params)
      ]);

      // Extract successful results
      const payments = paymentsResponse.status === 'fulfilled' && paymentsResponse.value.success ? paymentsResponse.value.data : [];
      const expenses = expensesResponse.status === 'fulfilled' && expensesResponse.value.success ? expensesResponse.value.data : [];
      const incomes = incomesResponse.status === 'fulfilled' && incomesResponse.value.success ? incomesResponse.value.data : [];
      const budgets = budgetsResponse.status === 'fulfilled' && budgetsResponse.value.success ? budgetsResponse.value.data : [];
      const paymentAnalytics = paymentAnalyticsResponse.status === 'fulfilled' && paymentAnalyticsResponse.value.success ? paymentAnalyticsResponse.value.data : {};

      // Calculate analytics
      const totalRevenue = payments.filter((p: Payment) => p.status === 'completed').reduce((sum: number, p: Payment) => sum + p.amount, 0);
      const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
      const totalIncomes = incomes.reduce((sum: number, i: Income) => sum + i.amount, 0);
      const netProfit = totalRevenue + totalIncomes - totalExpenses;
      
      const pendingPayments = payments.filter((p: Payment) => p.status === 'pending').length;
      const completedPayments = payments.filter((p: Payment) => p.status === 'completed').length;
      const totalPayments = payments.length;

      // Payment methods breakdown
      const paymentsByMethod: Record<string, number> = {};
      payments.forEach((p: Payment) => {
        paymentsByMethod[p.paymentMethod] = (paymentsByMethod[p.paymentMethod] || 0) + p.amount;
      });

      // Expenses by category
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach((e: Expense) => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
      });

      // Monthly data (simplified - you can enhance this based on your needs)
      const monthlyRevenue = Array(12).fill(0);
      const monthlyExpenses = Array(12).fill(0);
      
      payments.forEach((p: Payment) => {
        if (p.status === 'completed' && p.paidDate) {
          const month = new Date(p.paidDate).getMonth();
          monthlyRevenue[month] += p.amount;
        }
      });

      expenses.forEach((e: Expense) => {
        const month = new Date(e.date).getMonth();
        monthlyExpenses[month] += e.amount;
      });

      const analytics: FinanceAnalytics = {
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingPayments,
        completedPayments,
        totalPayments,
        monthlyRevenue,
        monthlyExpenses,
        paymentsByMethod,
        expensesByCategory,
        revenueGrowth: paymentAnalytics.revenueGrowth || 0,
        expenseGrowth: paymentAnalytics.expenseGrowth || 0,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        currency: 'USD', // You can make this dynamic
        period: params?.period || 'monthly',
        lastUpdated: new Date().toISOString()
      };

      return analytics;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch finance analytics';
      setError(errorMessage);
      console.error('❌ getFinanceAnalytics error:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    clearError,

    // Payments
    getPayments,
    createPayment,
    updatePayment,
    deletePayment,
    getPaymentAnalytics,

    // Expenses
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,

    // Incomes
    getIncomes,
    createIncome,
    updateIncome,
    deleteIncome,

    // Budgets
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,

    // Payrolls
    getPayrolls,
    createPayroll,
    updatePayroll,
    deletePayroll,

    // Fee Structures
    getFeeStructures,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,

    // Analytics
    getFinanceAnalytics,
  };
};

export default useFinanceApi;