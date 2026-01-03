import { useState, useEffect, useCallback } from 'react';
import financialAnalyticsService, {
  FinancialMetrics,
  PaymentAnalytics,
  ExpenseAnalytics,
  RevenueAnalytics,
  BudgetAnalytics,
  CashFlowAnalytics,
  PayrollAnalytics,
  AnalyticsFilters,
  TimeSeriesData,
} from '../services/financialAnalyticsService';

interface UseFinancialAnalyticsReturn {
  // State
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  
  // Data
  metrics: FinancialMetrics | null;
  paymentAnalytics: PaymentAnalytics | null;
  expenseAnalytics: ExpenseAnalytics | null;
  revenueAnalytics: RevenueAnalytics | null;
  budgetAnalytics: BudgetAnalytics | null;
  cashFlowAnalytics: CashFlowAnalytics | null;
  payrollAnalytics: PayrollAnalytics | null;
  trends: {
    revenue: TimeSeriesData | null;
    expenses: TimeSeriesData | null;
    profit: TimeSeriesData | null;
    cashFlow: TimeSeriesData | null;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    timestamp?: string;
    count?: number;
    action?: string;
  }>;
  
  // Actions
  fetchDashboardData: (filters?: AnalyticsFilters) => Promise<void>;
  fetchMetrics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchPaymentAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchExpenseAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchRevenueAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchBudgetAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchCashFlowAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchPayrollAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
  fetchTrends: (period?: 'daily' | 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  fetchAlerts: () => Promise<void>;
  refresh: () => Promise<void>;
  generateReport: (filters?: AnalyticsFilters & { format?: 'pdf' | 'excel' }) => Promise<{ url: string; filename: string }>;
}

const useFinancialAnalytics = (initialFilters?: AnalyticsFilters): UseFinancialAnalyticsReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [expenseAnalytics, setExpenseAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [budgetAnalytics, setBudgetAnalytics] = useState<BudgetAnalytics | null>(null);
  const [cashFlowAnalytics, setCashFlowAnalytics] = useState<CashFlowAnalytics | null>(null);
  const [payrollAnalytics, setPayrollAnalytics] = useState<PayrollAnalytics | null>(null);
  const [trends, setTrends] = useState<{
    revenue: TimeSeriesData | null;
    expenses: TimeSeriesData | null;
    profit: TimeSeriesData | null;
    cashFlow: TimeSeriesData | null;
  }>({
    revenue: null,
    expenses: null,
    profit: null,
    cashFlow: null,
  });
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    timestamp?: string;
    count?: number;
    action?: string;
  }>>([]);

  // Fetch dashboard data (all analytics at once)
  const fetchDashboardData = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await financialAnalyticsService.getDashboardSummary(filters);
      
      if (response.success) {
        setMetrics(response.data.metrics);
        setPaymentAnalytics(response.data.paymentAnalytics);
        setExpenseAnalytics(response.data.expenseAnalytics);
        setRevenueAnalytics(response.data.revenueAnalytics);
        setBudgetAnalytics(response.data.budgetAnalytics);
        setCashFlowAnalytics(response.data.cashFlowAnalytics);
        setPayrollAnalytics(response.data.payrollAnalytics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch individual analytics
  const fetchMetrics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getFinancialMetrics(filters);
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    }
  }, []);

  const fetchPaymentAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getPaymentAnalytics(filters);
      if (response.success) {
        setPaymentAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payment analytics');
    }
  }, []);

  const fetchExpenseAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getExpenseAnalytics(filters);
      if (response.success) {
        setExpenseAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expense analytics');
    }
  }, []);

  const fetchRevenueAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getRevenueAnalytics(filters);
      if (response.success) {
        setRevenueAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch revenue analytics');
    }
  }, []);

  const fetchBudgetAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getBudgetAnalytics(filters);
      if (response.success) {
        setBudgetAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch budget analytics');
    }
  }, []);

  const fetchCashFlowAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getCashFlowAnalytics(filters);
      if (response.success) {
        setCashFlowAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cash flow analytics');
    }
  }, []);

  const fetchPayrollAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    try {
      const response = await financialAnalyticsService.getPayrollAnalytics(filters);
      if (response.success) {
        setPayrollAnalytics(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payroll analytics');
    }
  }, []);

  const fetchTrends = useCallback(async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    try {
      const response = await financialAnalyticsService.getFinancialTrends(period);
      if (response.success) {
        setTrends(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trends');
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await financialAnalyticsService.getFinancialAlerts();
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch alerts');
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData(initialFilters);
    await fetchTrends();
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchDashboardData, fetchTrends, fetchAlerts, initialFilters]);

  const generateReport = useCallback(async (filters?: AnalyticsFilters & { format?: 'pdf' | 'excel' }) => {
    try {
      const response = await financialAnalyticsService.generateFinancialReport(filters);
      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to generate report');
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
      throw err;
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData(initialFilters);
    fetchTrends();
    fetchAlerts();
  }, [fetchDashboardData, fetchTrends, fetchAlerts, initialFilters]);

  return {
    // State
    loading,
    error,
    refreshing,
    
    // Data
    metrics,
    paymentAnalytics,
    expenseAnalytics,
    revenueAnalytics,
    budgetAnalytics,
    cashFlowAnalytics,
    payrollAnalytics,
    trends,
    alerts,
    
    // Actions
    fetchDashboardData,
    fetchMetrics,
    fetchPaymentAnalytics,
    fetchExpenseAnalytics,
    fetchRevenueAnalytics,
    fetchBudgetAnalytics,
    fetchCashFlowAnalytics,
    fetchPayrollAnalytics,
    fetchTrends,
    fetchAlerts,
    refresh,
    generateReport,
  };
};

export default useFinancialAnalytics; 
