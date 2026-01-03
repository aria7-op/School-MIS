import apiClient from '../../../services/api/client';
// import { checkApiHealth } from '../../../services/api/client';

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
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED' | 'PROCESSING';
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK' | 'SCHOLARSHIP';
  type: string;
  transactionId?: string;
  receiptNumber?: string;
  gatewayTransactionId?: string;
  remarks?: string;
  metadata?: any;
  isRecurring?: boolean;
  recurringFrequency?: string;
  nextPaymentDate?: string;
  items?: PaymentItem[];
  student?: any;
  parent?: any;
  feeStructure?: any;
  createdByUser?: any;
  updatedByUser?: any;
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
// COMPREHENSIVE FINANCE API SERVICE
// ========================================

class ComprehensiveFinanceApiService {
  // ========================================
  // PAYMENT OPERATIONS - COMPREHENSIVE
  // ========================================

  async getPayments(params?: any): Promise<Payment[]> {
    try {
      const response = await apiClient.get('/payments', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await apiClient.get(`/payments/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async createPayment(payment: Partial<Payment>): Promise<Payment> {
    try {
      const response = await apiClient.post('/payments', payment);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
    try {
      const response = await apiClient.put(`/payments/${id}`, payment);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deletePayment(id: string): Promise<void> {
    try {
      await apiClient.delete(`/payments/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment> {
    try {
      const response = await apiClient.patch(`/payments/${id}/status`, { status });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getPaymentAnalytics(): Promise<FinanceAnalytics> {
    try {
      const response = await apiClient.get('/payments/analytics/summary');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async generatePaymentReport(params?: any): Promise<any> {
    try {
      const response = await apiClient.get('/payments/report/generate', { params });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getPaymentRefunds(paymentId: string): Promise<Refund[]> {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/refunds`);
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createPaymentRefund(paymentId: string, refund: Partial<Refund>): Promise<Refund> {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/refunds`, refund);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getPaymentInstallments(paymentId: string): Promise<Installment[]> {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/installments`);
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createPaymentInstallment(paymentId: string, installment: Partial<Installment>): Promise<Installment> {
    try {
      const response = await apiClient.post(`/payments/${paymentId}/installments`, installment);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateInstallmentStatus(installmentId: string, status: string): Promise<Installment> {
    try {
      const response = await apiClient.patch(`/payments/installments/${installmentId}`, { status });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async bulkCreatePayments(payments: Partial<Payment>[]): Promise<Payment[]> {
    try {
      const response = await apiClient.post('/payments/bulk/create', { payments });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      throw error;
    }
  }

  async bulkUpdatePaymentStatus(ids: string[], status: string): Promise<void> {
    try {
      await apiClient.post('/payments/bulk/update-status', { ids, status });
    } catch (error) {
      
      throw error;
    }
  }

  async getStudentPayments(studentId: string): Promise<Payment[]> {
    try {
      const response = await apiClient.get(`/payments/student/${studentId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getParentPayments(parentId: string): Promise<Payment[]> {
    try {
      const response = await apiClient.get(`/payments/parent/${parentId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getOverduePayments(): Promise<Payment[]> {
    try {
      const response = await apiClient.get('/payments/overdue/list');
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getDashboardSummary(): Promise<FinanceDashboard> {
    try {
      const response = await apiClient.get('/payments/dashboard/summary');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getRecentPayments(): Promise<Payment[]> {
    try {
      const response = await apiClient.get('/payments/dashboard/recent');
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getUpcomingPayments(): Promise<Payment[]> {
    try {
      const response = await apiClient.get('/payments/dashboard/upcoming');
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async searchPayments(query: string): Promise<Payment[]> {
    try {
      const response = await apiClient.get('/payments', { params: { search: query } });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  // ========================================
  // INTEGRATED PAYMENT OPERATIONS
  // ========================================

  async createPaymentWithInstallments(paymentData: any): Promise<any> {
    try {
      const response = await apiClient.post('/integrated-payments/create-with-installments', paymentData);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getCompletePaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/integrated-payments/${paymentId}/complete-details`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async processRefundForPayment(paymentId: string, refundData: any): Promise<any> {
    try {
      const response = await apiClient.post(`/integrated-payments/${paymentId}/refund`, refundData);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async payInstallment(installmentId: string, paymentData: any): Promise<any> {
    try {
      const response = await apiClient.patch(`/integrated-payments/installments/${installmentId}/pay`, paymentData);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getPaymentDashboard(): Promise<any> {
    try {
      const response = await apiClient.get('/integrated-payments/dashboard');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async generateIntegratedPaymentReport(params?: any): Promise<any> {
    try {
      const response = await apiClient.get('/integrated-payments/report/generate', { params });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getPaymentAnalytics(): Promise<any> {
    try {
      const response = await apiClient.get('/integrated-payments/analytics');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async bulkPaymentOperations(operations: any): Promise<any> {
    try {
      const response = await apiClient.post('/integrated-payments/bulk-operations', operations);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // REFUND OPERATIONS - COMPREHENSIVE
  // ========================================

  async getRefunds(params?: any): Promise<Refund[]> {
    try {
      const response = await apiClient.get('/refunds', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getRefundById(id: string): Promise<Refund> {
    try {
      const response = await apiClient.get(`/refunds/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async createRefund(refund: Partial<Refund>): Promise<Refund> {
    try {
      const response = await apiClient.post('/refunds', refund);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateRefund(id: string, refund: Partial<Refund>): Promise<Refund> {
    try {
      const response = await apiClient.put(`/refunds/${id}`, refund);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteRefund(id: string): Promise<void> {
    try {
      await apiClient.delete(`/refunds/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  async processRefund(id: string): Promise<Refund> {
    try {
      const response = await apiClient.post(`/refunds/${id}/process`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async cancelRefund(id: string): Promise<Refund> {
    try {
      const response = await apiClient.post(`/refunds/${id}/cancel`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getRefundsByPayment(paymentId: string): Promise<Refund[]> {
    try {
      const response = await apiClient.get(`/refunds/payment/${paymentId}`);
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getRefundStatistics(): Promise<any> {
    try {
      const response = await apiClient.get('/refunds/statistics');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getRefundAnalytics(): Promise<any> {
    try {
      const response = await apiClient.get('/refunds/analytics');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getRefundDashboard(): Promise<any> {
    try {
      const response = await apiClient.get('/refunds/dashboard');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async searchRefunds(query: string): Promise<Refund[]> {
    try {
      const response = await apiClient.get('/refunds/search', { params: { query } });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async bulkUpdateRefunds(updates: any): Promise<any> {
    try {
      const response = await apiClient.post('/refunds/bulk/update', updates);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // INSTALLMENT OPERATIONS
  // ========================================

  async getInstallments(params?: any): Promise<Installment[]> {
    try {
      const response = await apiClient.get('/installments', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createInstallment(installment: Partial<Installment>): Promise<Installment> {
    try {
      const response = await apiClient.post('/installments', installment);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateInstallment(id: string, installment: Partial<Installment>): Promise<Installment> {
    try {
      const response = await apiClient.put(`/installments/${id}`, installment);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteInstallment(id: string): Promise<void> {
    try {
      await apiClient.delete(`/installments/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  async markInstallmentAsPaid(id: string, paidAmount: number): Promise<Installment> {
    try {
      const response = await apiClient.patch(`/installments/${id}/pay`, { paidAmount });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getOverdueInstallments(): Promise<Installment[]> {
    try {
      const response = await apiClient.get('/installments/overdue');
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getUpcomingInstallments(): Promise<Installment[]> {
    try {
      const response = await apiClient.get('/installments/upcoming');
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  // ========================================
  // FEE OPERATIONS
  // ========================================

  async getFees(params?: any): Promise<Fee[]> {
    try {
      const response = await apiClient.get('/fees', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async getFeeById(id: string): Promise<Fee> {
    try {
      const response = await apiClient.get(`/fees/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async createFee(fee: Partial<Fee>): Promise<Fee> {
    try {
      const response = await apiClient.post('/fees', fee);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateFee(id: string, fee: Partial<Fee>): Promise<Fee> {
    try {
      const response = await apiClient.put(`/fees/${id}`, fee);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteFee(id: string): Promise<void> {
    try {
      await apiClient.delete(`/fees/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // EXPENSE OPERATIONS
  // ========================================

  async getExpenses(params?: any): Promise<Expense[]> {
    try {
      const response = await apiClient.get('/expenses', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiClient.post('/expenses', expense);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiClient.put(`/expenses/${id}`, expense);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // INCOME OPERATIONS
  // ========================================

  async getIncomes(params?: any): Promise<Income[]> {
    try {
      const response = await apiClient.get('/incomes', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createIncome(income: Partial<Income>): Promise<Income> {
    try {
      const response = await apiClient.post('/incomes', income);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateIncome(id: string, income: Partial<Income>): Promise<Income> {
    try {
      const response = await apiClient.put(`/incomes/${id}`, income);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteIncome(id: string): Promise<void> {
    try {
      await apiClient.delete(`/incomes/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // BUDGET OPERATIONS
  // ========================================

  async getBudgets(params?: any): Promise<Budget[]> {
    try {
      const response = await apiClient.get('/budgets', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createBudget(budget: Partial<Budget>): Promise<Budget> {
    try {
      const response = await apiClient.post('/budgets', budget);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
    try {
      const response = await apiClient.put(`/budgets/${id}`, budget);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      await apiClient.delete(`/budgets/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // PAYROLL OPERATIONS
  // ========================================

  async getPayrolls(params?: any): Promise<Payroll[]> {
    try {
      const response = await apiClient.get('/payrolls', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  async createPayroll(payroll: Partial<Payroll>): Promise<Payroll> {
    try {
      const response = await apiClient.post('/payrolls', payroll);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async updatePayroll(id: string, payroll: Partial<Payroll>): Promise<Payroll> {
    try {
      const response = await apiClient.put(`/payrolls/${id}`, payroll);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async deletePayroll(id: string): Promise<void> {
    try {
      await apiClient.delete(`/payrolls/${id}`);
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // ANALYTICS & DASHBOARD
  // ========================================

  async getFinanceAnalytics(): Promise<FinanceAnalytics> {
    try {
      const response = await apiClient.get('/finance/analytics');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getFinanceDashboard(): Promise<FinanceDashboard> {
    try {
      const response = await apiClient.get('/finance/dashboard');
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // GATEWAY & WEBHOOK OPERATIONS
  // ========================================

  async handleWebhook(gateway: string, webhookData: any): Promise<any> {
    try {
      const response = await apiClient.post(`/payments/gateway/webhook/${gateway}`, webhookData);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async getGatewayStatus(transactionId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/payments/gateway/status/${transactionId}`);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async generateReceiptNumber(schoolId: string): Promise<string> {
    try {
      const response = await apiClient.post('/payments/generate-receipt-number', { schoolId });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async calculateFines(dueDate: string, amount: number): Promise<number> {
    try {
      const response = await apiClient.post('/payments/calculate-fines', { dueDate, amount });
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async validatePaymentData(paymentData: any): Promise<any> {
    try {
      const response = await apiClient.post('/payments/validate', paymentData);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  async validateRefundData(refundData: any): Promise<any> {
    try {
      const response = await apiClient.post('/refunds/validate', refundData);
      return response.data?.data || response.data;
    } catch (error) {
      
      throw error;
    }
  }

  // ========================================
  // CACHE OPERATIONS
  // ========================================

  async cachePayment(payment: Payment): Promise<void> {
    try {
      await apiClient.post('/payments/cache', payment);
    } catch (error) {
      
    }
  }

  async invalidatePaymentCache(paymentId: string): Promise<void> {
    try {
      await apiClient.delete(`/payments/cache/${paymentId}`);
    } catch (error) {
      
    }
  }

  // ========================================
  // AUDIT & LOGGING
  // ========================================

  async createPaymentLog(paymentId: string, action: string, details: any): Promise<void> {
    try {
      await apiClient.post('/payments/logs', { paymentId, action, details });
    } catch (error) {
      
    }
  }

  async getPaymentLogs(paymentId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/logs`);
      return response.data?.data || response.data || [];
    } catch (error) {
      
      return [];
    }
  }

  // ========================================
  // NOTIFICATION OPERATIONS
  // ========================================

  async sendPaymentReminders(paymentIds: string[]): Promise<void> {
    try {
      await apiClient.post('/payments/notifications/reminders', { paymentIds });
    } catch (error) {
      
      throw error;
    }
  }

  async sendRefundNotifications(refundId: string): Promise<void> {
    try {
      await apiClient.post(`/refunds/${refundId}/notifications`);
    } catch (error) {
      
      throw error;
    }
  }

  async sendInstallmentReminders(installmentIds: string[]): Promise<void> {
    try {
      await apiClient.post('/installments/notifications/reminders', { installmentIds });
    } catch (error) {
      
      throw error;
    }
  }
}

export default new ComprehensiveFinanceApiService(); 
