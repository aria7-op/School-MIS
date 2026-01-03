import secureApiService from '../../../services/secureApiService';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface Payment {
  id: string;
  studentId: number;
  parentId?: number;
  feeStructureId: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  paymentDate: string;
  dueDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK' | 'SCHOLARSHIP';
  type: string;
  transactionId?: string;
  remarks?: string;
  metadata?: any;
  isRecurring?: boolean;
  recurringFrequency?: string;
  nextPaymentDate?: string;
  items?: PaymentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentItem {
  feeItemId: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'CANCELLED' | 'REJECTED';
  method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_NOTE';
  processedBy?: string;
  processedAt?: string;
  remarks?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  paymentId: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paidAt?: string;
  paidAmount?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  receivedAt?: string;
  source?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  spentAmount: number;
  remainingAmount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Fee {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  isOptional: boolean;
  dueDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paidAt?: string;
  remarks?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  pendingPayments: number;
  overduePayments: number;
  totalRefunds: number;
  totalInstallments: number;
  budgetUtilization: number;
  paymentMethods: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netIncome: number;
  }>;
  categoryBreakdown: Record<string, number>;
}

export interface FinanceDashboard {
  summary: {
    totalPayments: number;
    totalRefunds: number;
    totalExpenses: number;
    totalIncome: number;
    netCashFlow: number;
  };
  recentPayments: Payment[];
  recentExpenses: Expense[];
  upcomingBills: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    type: 'PAYMENT' | 'EXPENSE' | 'INSTALLMENT';
  }>;
  alerts: Array<{
    id: string;
    type: 'OVERDUE' | 'LOW_BALANCE' | 'BUDGET_EXCEEDED';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

// ========================================
// PAYMENT SERVICE
// ========================================

export const paymentService = {
  // Get all payments with filtering
  getPayments: async (params?: any) => {
    try {
      const response = await secureApiService.get('/payments', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch payments');
    }
  },

  // Get payment by ID
  getPaymentById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/payments/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch payment by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch payment by ID');
    }
  },

  // Create new payment
  createPayment: async (paymentData: Partial<Payment>) => {
    try {
      const response = await secureApiService.post('/payments', paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create payment');
    }
  },

  // Update payment
  updatePayment: async (id: string, paymentData: Partial<Payment>) => {
    try {
      const response = await secureApiService.put(`/payments/${id}`, paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update payment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update payment');
    }
  },

  // Delete payment
  deletePayment: async (id: string) => {
    try {
      await secureApiService.delete(`/payments/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete payment');
    }
  },

  // Update payment status
  updatePaymentStatus: async (id: string, status: Payment['status']) => {
    try {
      const response = await secureApiService.patch(`/payments/${id}/status`, { status });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update payment status');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update payment status');
    }
  },

  // Get payment analytics
  getPaymentAnalytics: async () => {
    try {
      const response = await secureApiService.get('/payments/analytics/summary');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get payment analytics');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get payment analytics');
    }
  },

  // Generate payment report
  generatePaymentReport: async (params?: any) => {
    try {
      const response = await secureApiService.get('/payments/report/generate', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate payment report');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate payment report');
    }
  },

  // Get student payments
  getStudentPayments: async (studentId: string) => {
    try {
      const response = await secureApiService.get(`/payments/student/${studentId}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get student payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get student payments');
    }
  },

  // Get parent payments
  getParentPayments: async (parentId: string) => {
    try {
      const response = await secureApiService.get(`/payments/parent/${parentId}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get parent payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get parent payments');
    }
  },

  // Get overdue payments
  getOverduePayments: async () => {
    try {
      const response = await secureApiService.get('/payments/overdue/list');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get overdue payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get overdue payments');
    }
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    try {
      const response = await secureApiService.get('/payments/dashboard/summary');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get dashboard summary');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get dashboard summary');
    }
  },

  // Get recent payments
  getRecentPayments: async () => {
    try {
      const response = await secureApiService.get('/payments/dashboard/recent');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get recent payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get recent payments');
    }
  },

  // Get upcoming payments
  getUpcomingPayments: async () => {
    try {
      const response = await secureApiService.get('/payments/dashboard/upcoming');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get upcoming payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get upcoming payments');
    }
  },

  // Bulk create payments
  createBulkPayments: async (payments: Partial<Payment>[]) => {
    try {
      const response = await secureApiService.post('/payments/bulk/create', { payments });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create bulk payments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create bulk payments');
    }
  },

  // Bulk update status
  bulkUpdateStatus: async (paymentIds: string[], status: Payment['status']) => {
    try {
      const response = await secureApiService.post('/payments/bulk/update-status', { paymentIds, status });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to bulk update status');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk update status');
    }
  },
};

// ========================================
// REFUND SERVICE
// ========================================

export const refundService = {
  // Get all refunds
  getRefunds: async (params?: any) => {
    try {
      const response = await secureApiService.get('/refunds', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch refunds');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch refunds');
    }
  },

  // Get refund by ID
  getRefundById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/refunds/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch refund by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch refund by ID');
    }
  },

  // Create new refund
  createRefund: async (refundData: Partial<Refund>) => {
    try {
      const response = await secureApiService.post('/refunds', refundData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create refund');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create refund');
    }
  },

  // Update refund
  updateRefund: async (id: string, refundData: Partial<Refund>) => {
    try {
      const response = await secureApiService.put(`/refunds/${id}`, refundData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update refund');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update refund');
    }
  },

  // Delete refund
  deleteRefund: async (id: string) => {
    try {
      await secureApiService.delete(`/refunds/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete refund');
    }
  },

  // Get refunds by payment
  getRefundsByPayment: async (paymentId: string) => {
    try {
      const response = await secureApiService.get(`/refunds/payment/${paymentId}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get refunds by payment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get refunds by payment');
    }
  },

  // Process refund
  processRefund: async (id: string) => {
    try {
      const response = await secureApiService.post(`/refunds/${id}/process`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to process refund');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process refund');
    }
  },

  // Cancel refund
  cancelRefund: async (id: string) => {
    try {
      const response = await secureApiService.post(`/refunds/${id}/cancel`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to cancel refund');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel refund');
    }
  },

  // Get refund statistics
  getRefundStatistics: async () => {
    try {
      const response = await secureApiService.get('/refunds/statistics');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get refund statistics');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get refund statistics');
    }
  },

  // Get refund analytics
  getRefundAnalytics: async () => {
    try {
      const response = await secureApiService.get('/refunds/analytics');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get refund analytics');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get refund analytics');
    }
  },

  // Search refunds
  searchRefunds: async (searchTerm: string) => {
    try {
      const response = await secureApiService.get(`/refunds/search?q=${searchTerm}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search refunds');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search refunds');
    }
  },

  // Get refund dashboard
  getRefundDashboard: async () => {
    try {
      const response = await secureApiService.get('/refunds/dashboard');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get refund dashboard');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get refund dashboard');
    }
  },

  // Bulk update refunds
  bulkUpdateRefunds: async (refundIds: string[], updates: Partial<Refund>) => {
    try {
      const response = await secureApiService.post('/refunds/bulk/update', { refundIds, updates });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to bulk update refunds');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk update refunds');
    }
  },
};

// ========================================
// INSTALLMENT SERVICE
// ========================================

export const installmentService = {
  // Get all installments
  getInstallments: async (params?: any) => {
    try {
      const response = await secureApiService.get('/installments', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch installments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch installments');
    }
  },

  // Get installment by ID
  getInstallmentById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/installments/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch installment by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch installment by ID');
    }
  },

  // Create new installment
  createInstallment: async (installmentData: Partial<Installment>) => {
    try {
      const response = await secureApiService.post('/installments', installmentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create installment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create installment');
    }
  },

  // Update installment
  updateInstallment: async (id: string, installmentData: Partial<Installment>) => {
    try {
      const response = await secureApiService.put(`/installments/${id}`, installmentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update installment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update installment');
    }
  },

  // Delete installment
  deleteInstallment: async (id: string) => {
    try {
      await secureApiService.delete(`/installments/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete installment');
    }
  },

  // Mark installment as paid
  markAsPaid: async (id: string, paidAmount: number) => {
    try {
      const response = await secureApiService.patch(`/installments/${id}/pay`, { paidAmount });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to mark installment as paid');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark installment as paid');
    }
  },

  // Mark installment as overdue
  markAsOverdue: async (id: string) => {
    try {
      const response = await secureApiService.patch(`/installments/${id}/overdue`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to mark installment as overdue');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark installment as overdue');
    }
  },

  // Get installments by payment
  getInstallmentsByPayment: async (paymentId: string) => {
    try {
      const response = await secureApiService.get(`/installments/payment/${paymentId}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get installments by payment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get installments by payment');
    }
  },

  // Get installment statistics
  getInstallmentStatistics: async () => {
    try {
      const response = await secureApiService.get('/installments/statistics');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get installment statistics');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get installment statistics');
    }
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    try {
      const response = await secureApiService.get('/installments/dashboard/summary');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get installment dashboard summary');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get installment dashboard summary');
    }
  },

  // Get overdue installments
  getOverdueInstallments: async () => {
    try {
      const response = await secureApiService.get('/installments/overdue');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get overdue installments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get overdue installments');
    }
  },

  // Get upcoming installments
  getUpcomingInstallments: async () => {
    try {
      const response = await secureApiService.get('/installments/upcoming');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get upcoming installments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get upcoming installments');
    }
  },

  // Search installments
  searchInstallments: async (searchTerm: string) => {
    try {
      const response = await secureApiService.get(`/installments/search/${searchTerm}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search installments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search installments');
    }
  },

  // Bulk create installments
  bulkCreateInstallments: async (installments: Partial<Installment>[]) => {
    try {
      const response = await secureApiService.post('/installments/bulk/create', { installments });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create bulk installments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create bulk installments');
    }
  },
};

// ========================================
// EXPENSE SERVICE
// ========================================

export const expenseService = {
  // Get all expenses
  getExpenses: async (params?: any) => {
    try {
      const response = await secureApiService.get('/expenses', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch expenses');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch expenses');
    }
  },

  // Get expense by ID
  getExpenseById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/expenses/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch expense by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch expense by ID');
    }
  },

  // Create new expense
  createExpense: async (expenseData: Partial<Expense>) => {
    try {
      const response = await secureApiService.post('/expenses', expenseData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create expense');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create expense');
    }
  },

  // Update expense
  updateExpense: async (id: string, expenseData: Partial<Expense>) => {
    try {
      const response = await secureApiService.put(`/expenses/${id}`, expenseData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update expense');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update expense');
    }
  },

  // Delete expense
  deleteExpense: async (id: string) => {
    try {
      await secureApiService.delete(`/expenses/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete expense');
    }
  },
};

// ========================================
// INCOME SERVICE
// ========================================

export const incomeService = {
  // Get all incomes
  getIncomes: async (params?: any) => {
    try {
      const response = await secureApiService.get('/incomes', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch incomes');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch incomes');
    }
  },

  // Get income by ID
  getIncomeById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/incomes/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch income by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch income by ID');
    }
  },

  // Create new income
  createIncome: async (incomeData: Partial<Income>) => {
    try {
      const response = await secureApiService.post('/incomes', incomeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create income');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create income');
    }
  },

  // Update income
  updateIncome: async (id: string, incomeData: Partial<Income>) => {
    try {
      const response = await secureApiService.put(`/incomes/${id}`, incomeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update income');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update income');
    }
  },

  // Delete income
  deleteIncome: async (id: string) => {
    try {
      await secureApiService.delete(`/incomes/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete income');
    }
  },
};

// ========================================
// BUDGET SERVICE
// ========================================

export const budgetService = {
  // Get all budgets
  getBudgets: async (params?: any) => {
    try {
      const response = await secureApiService.get('/budgets', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch budgets');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch budgets');
    }
  },

  // Get budget by ID
  getBudgetById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/budgets/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch budget by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch budget by ID');
    }
  },

  // Create new budget
  createBudget: async (budgetData: Partial<Budget>) => {
    try {
      const response = await secureApiService.post('/budgets', budgetData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create budget');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create budget');
    }
  },

  // Update budget
  updateBudget: async (id: string, budgetData: Partial<Budget>) => {
    try {
      const response = await secureApiService.put(`/budgets/${id}`, budgetData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update budget');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update budget');
    }
  },

  // Delete budget
  deleteBudget: async (id: string) => {
    try {
      await secureApiService.delete(`/budgets/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete budget');
    }
  },
};

// ========================================
// FEE SERVICE
// ========================================

export const feeService = {
  // Get all fees
  getFees: async (params?: any) => {
    try {
      const response = await secureApiService.get('/fees', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch fees');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch fees');
    }
  },

  // Get fee by ID
  getFeeById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/fees/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch fee by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch fee by ID');
    }
  },

  // Create new fee
  createFee: async (feeData: Partial<Fee>) => {
    try {
      const response = await secureApiService.post('/fees', feeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create fee');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create fee');
    }
  },

  // Update fee
  updateFee: async (id: string, feeData: Partial<Fee>) => {
    try {
      const response = await secureApiService.put(`/fees/${id}`, feeData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update fee');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update fee');
    }
  },

  // Delete fee
  deleteFee: async (id: string) => {
    try {
      await secureApiService.delete(`/fees/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete fee');
    }
  },
};

// ========================================
// PAYROLL SERVICE
// ========================================

export const payrollService = {
  // Get all payrolls
  getPayrolls: async (params?: any) => {
    try {
      const response = await secureApiService.get('/payrolls', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch payrolls');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch payrolls');
    }
  },

  // Get payroll by ID
  getPayrollById: async (id: string) => {
    try {
      const response = await secureApiService.get(`/payrolls/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch payroll by ID');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch payroll by ID');
    }
  },

  // Create new payroll
  createPayroll: async (payrollData: Partial<Payroll>) => {
    try {
      const response = await secureApiService.post('/payrolls', payrollData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payroll');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create payroll');
    }
  },

  // Update payroll
  updatePayroll: async (id: string, payrollData: Partial<Payroll>) => {
    try {
      const response = await secureApiService.put(`/payrolls/${id}`, payrollData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update payroll');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update payroll');
    }
  },

  // Delete payroll
  deletePayroll: async (id: string) => {
    try {
      await secureApiService.delete(`/payrolls/${id}`);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete payroll');
    }
  },
};

// ========================================
// INTEGRATED FINANCE SERVICE
// ========================================

export const integratedFinanceService = {
  // Get complete payment details with refunds and installments
  getCompletePaymentDetails: async (paymentId: string) => {
    try {
      const response = await secureApiService.get(`/integrated-payments/${paymentId}/complete-details`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get complete payment details');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get complete payment details');
    }
  },

  // Create payment with installments
  createPaymentWithInstallments: async (paymentData: any) => {
    try {
      const response = await secureApiService.post('/integrated-payments/create-with-installments', paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment with installments');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create payment with installments');
    }
  },

  // Process refund for payment
  processRefund: async (paymentId: string, refundData: any) => {
    try {
      const response = await secureApiService.post(`/integrated-payments/${paymentId}/refund`, refundData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to process refund for payment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to process refund for payment');
    }
  },

  // Pay installment and update payment status
  payInstallment: async (installmentId: string, paymentData: any) => {
    try {
      const response = await secureApiService.patch(`/integrated-payments/installments/${installmentId}/pay`, paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to pay installment and update payment status');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to pay installment and update payment status');
    }
  },

  // Get comprehensive payment analytics
  getPaymentAnalytics: async () => {
    try {
      const response = await secureApiService.get('/integrated-payments/analytics');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get comprehensive payment analytics');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get comprehensive payment analytics');
    }
  },

  // Get payment dashboard with all related data
  getPaymentDashboard: async () => {
    try {
      const response = await secureApiService.get('/integrated-payments/dashboard');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get payment dashboard with all related data');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get payment dashboard with all related data');
    }
  },

  // Generate comprehensive payment report
  generatePaymentReport: async (params?: any) => {
    try {
      const response = await secureApiService.get('/integrated-payments/report/generate', { params });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate comprehensive payment report');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate comprehensive payment report');
    }
  },

  // Bulk operations for payments
  bulkPaymentOperations: async (operations: any) => {
    try {
      const response = await secureApiService.post('/integrated-payments/bulk-operations', operations);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to perform bulk payment operations');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to perform bulk payment operations');
    }
  },
};

// ========================================
// FINANCE ANALYTICS SERVICE
// ========================================

export const financeAnalyticsService = {
  // Get comprehensive finance analytics
  getFinanceAnalytics: async (): Promise<FinanceAnalytics> => {
    try {
      const [payments, expenses, incomes, budgets] = await Promise.all([
        paymentService.getPaymentAnalytics(),
        expenseService.getExpenses(),
        incomeService.getIncomes(),
        budgetService.getBudgets(),
      ]);

      const totalRevenue = payments.totalAmount || 0;
      const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
      const totalIncome = incomes.reduce((sum: number, inc: Income) => sum + inc.amount, 0);
      const netIncome = totalRevenue + totalIncome - totalExpenses;

      return {
        totalRevenue,
        totalExpenses,
        netIncome,
        pendingPayments: payments.pendingCount || 0,
        overduePayments: payments.overdueCount || 0,
        totalRefunds: 0, // Will be calculated from refunds
        totalInstallments: 0, // Will be calculated from installments
        budgetUtilization: 0, // Will be calculated from budgets
        paymentMethods: payments.paymentMethods || {},
        monthlyTrends: payments.monthlyTrends || [],
        categoryBreakdown: expenses.reduce((acc: any, exp: Expense) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {}),
      };
    } catch (error) {
      
      throw error;
    }
  },

  // Get finance dashboard data
  getFinanceDashboard: async (): Promise<FinanceDashboard> => {
    try {
      const [payments, expenses, incomes, refunds, installments] = await Promise.all([
        paymentService.getRecentPayments(),
        expenseService.getExpenses({ limit: 10 }),
        incomeService.getIncomes({ limit: 10 }),
        refundService.getRefunds({ limit: 5 }),
        installmentService.getUpcomingInstallments(),
      ]);

      return {
        summary: {
          totalPayments: payments.total || 0,
          totalRefunds: refunds.total || 0,
          totalExpenses: expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0),
          totalIncome: incomes.reduce((sum: number, inc: Income) => sum + inc.amount, 0),
          netCashFlow: 0, // Will be calculated
        },
        recentPayments: payments.data || [],
        recentExpenses: expenses,
        upcomingBills: installments.map((inst: Installment) => ({
          id: inst.id,
          title: `Installment Payment`,
          amount: inst.amount,
          dueDate: inst.dueDate,
          type: 'INSTALLMENT' as const,
        })),
        alerts: [], // Will be populated based on business logic
      };
    } catch (error) {
      
      throw error;
    }
  },
};

// ========================================
// MAIN FINANCE SERVICE EXPORT
// ========================================

const financeService = {
  payments: paymentService,
  refunds: refundService,
  installments: installmentService,
  expenses: expenseService,
  incomes: incomeService,
  budgets: budgetService,
  fees: feeService,
  payrolls: payrollService,
  integrated: integratedFinanceService,
  analytics: financeAnalyticsService,
};

export default financeService; 
