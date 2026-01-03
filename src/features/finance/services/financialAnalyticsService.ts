import api from '../../../services/api/api';

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingPayments: number;
  overduePayments: number;
  totalPayroll: number;
  budgetUtilization: number;
  cashFlow: number;
  profitMargin: number;
  expenseRatio: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>;
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  monthlyStats: Array<{
    month: string;
    total: number;
    paid: number;
    outstanding: number;
  }>;
  methodStats: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  statusStats: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: TimeSeriesData;
  topExpenses: Array<{
    description: string;
    amount: number;
    date: string;
    category: string;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  sourceBreakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: TimeSeriesData;
  growthRate: number;
}

export interface BudgetAnalytics {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  utilizationRate: number;
  categoryBudgets: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    utilization: number;
  }>;
}

export interface CashFlowAnalytics {
  openingBalance: number;
  closingBalance: number;
  netCashFlow: number;
  inflows: number;
  outflows: number;
  monthlyCashFlow: TimeSeriesData;
}

export interface PayrollAnalytics {
  totalPayroll: number;
  employeeCount: number;
  averageSalary: number;
  departmentBreakdown: Array<{
    department: string;
    totalPayroll: number;
    employeeCount: number;
    averageSalary: number;
  }>;
  monthlyTrends: TimeSeriesData;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  department?: string;
  paymentMethod?: string;
  status?: string;
}

class FinancialAnalyticsService {
  // TODO: Replace mock data with actual API calls
  private mockMetrics: FinancialMetrics = {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingPayments: 0,
    overduePayments: 0,
    totalPayroll: 0,
    budgetUtilization: 0,
    cashFlow: 0,
    profitMargin: 0,
    expenseRatio: 0,
  };

  private mockPaymentAnalytics: PaymentAnalytics = {
    totalPayments: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    monthlyStats: [],
    methodStats: [],
    statusStats: [],
  };

  private mockExpenseAnalytics: ExpenseAnalytics = {
    totalExpenses: 0,
    categoryBreakdown: [],
    monthlyTrends: {
      labels: [],
      datasets: [],
    },
    topExpenses: [],
  };

  private mockRevenueAnalytics: RevenueAnalytics = {
    totalRevenue: 0,
    sourceBreakdown: [],
    monthlyTrends: {
      labels: [],
      datasets: [],
    },
    growthRate: 0,
  };

  private mockBudgetAnalytics: BudgetAnalytics = {
    totalBudget: 0,
    totalSpent: 0,
    remainingBudget: 0,
    utilizationRate: 0,
    categoryBudgets: [],
  };

  private mockCashFlowAnalytics: CashFlowAnalytics = {
    openingBalance: 0,
    closingBalance: 0,
    netCashFlow: 0,
    inflows: 0,
    outflows: 0,
    monthlyCashFlow: {
      labels: [],
      datasets: [],
    },
  };

  private mockPayrollAnalytics: PayrollAnalytics = {
    totalPayroll: 0,
    employeeCount: 0,
    averageSalary: 0,
    departmentBreakdown: [],
    monthlyTrends: {
      labels: [],
      datasets: [],
    },
  };

  private mockAlerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Overdue Payments',
      message: '25 payments totaling $25,000 are overdue',
      severity: 'medium' as const,
      date: '2024-06-25',
      actionRequired: true,
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Budget Alert',
      message: 'Payroll budget is 91.4% utilized',
      severity: 'low' as const,
      date: '2024-06-24',
      actionRequired: false,
    },
    {
      id: '3',
      type: 'error' as const,
      title: 'Cash Flow Warning',
      message: 'Monthly cash flow is below target',
      severity: 'high' as const,
      date: '2024-06-23',
      actionRequired: true,
    },
  ];

  // Get comprehensive financial metrics
  async getFinancialMetrics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: FinancialMetrics }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockMetrics };
  }

  // Get payment analytics
  async getPaymentAnalytics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: PaymentAnalytics }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockPaymentAnalytics };
  }

  // Get expense analytics
  async getExpenseAnalytics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: ExpenseAnalytics }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockExpenseAnalytics };
  }

  // Get revenue analytics
  async getRevenueAnalytics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: RevenueAnalytics }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockRevenueAnalytics };
  }

  // Get budget analytics
  async getBudgetAnalytics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: BudgetAnalytics }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockBudgetAnalytics };
  }

  // Get cash flow analytics
  async getCashFlowAnalytics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: CashFlowAnalytics }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockCashFlowAnalytics };
  }

  // Get payroll analytics
  async getPayrollAnalytics(filters: AnalyticsFilters = {}): Promise<{ success: boolean; data: PayrollAnalytics }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: this.mockPayrollAnalytics };
  }

  // Get dashboard summary
  async getDashboardSummary(filters: AnalyticsFilters = {}): Promise<{
    success: boolean;
    data: {
      metrics: FinancialMetrics;
      paymentAnalytics: PaymentAnalytics;
      expenseAnalytics: ExpenseAnalytics;
      revenueAnalytics: RevenueAnalytics;
      budgetAnalytics: BudgetAnalytics;
      cashFlowAnalytics: CashFlowAnalytics;
      payrollAnalytics: PayrollAnalytics;
    };
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      data: {
        metrics: this.mockMetrics,
        paymentAnalytics: this.mockPaymentAnalytics,
        expenseAnalytics: this.mockExpenseAnalytics,
        revenueAnalytics: this.mockRevenueAnalytics,
        budgetAnalytics: this.mockBudgetAnalytics,
        cashFlowAnalytics: this.mockCashFlowAnalytics,
        payrollAnalytics: this.mockPayrollAnalytics,
      },
    };
  }

  // Generate financial report
  async generateFinancialReport(filters: AnalyticsFilters & { format?: 'pdf' | 'excel' } = {}): Promise<{
    success: boolean;
    data: { url: string; filename: string };
  }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      data: {
        url: '/reports/financial-report.pdf',
        filename: `financial-report-${new Date().toISOString().split('T')[0]}.pdf`,
      },
    };
  }

  // Get financial alerts
  async getFinancialAlerts(): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      type: 'warning' | 'error' | 'info' | 'success';
      title: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
      timestamp?: string;
      count?: number;
      action?: string;
    }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Transform mock alerts to match component interface
    const transformedAlerts = this.mockAlerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      priority: alert.severity, // Map severity to priority
      timestamp: alert.date, // Map date to timestamp
      count: alert.type === 'warning' ? 25 : undefined,
      action: alert.actionRequired ? 'Take Action' : 'View Details',
    }));
    
    return { success: true, data: transformedAlerts };
  }

  // Get financial trends
  async getFinancialTrends(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<{
    success: boolean;
    data: {
      revenue: TimeSeriesData;
      expenses: TimeSeriesData;
      profit: TimeSeriesData;
      cashFlow: TimeSeriesData;
    };
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        revenue: this.mockRevenueAnalytics.monthlyTrends,
        expenses: this.mockExpenseAnalytics.monthlyTrends,
        profit: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Profit',
              data: [115000, 120000, 125000, 130000, 135000, 140000],
              color: '#10b981',
            },
          ],
        },
        cashFlow: this.mockCashFlowAnalytics.monthlyCashFlow,
      },
    };
  }
}

export default new FinancialAnalyticsService(); 
