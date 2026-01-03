import secureApiService from '../../../services/secureApiService';

// Types for Finance Data
export interface Payment {
  id: string;
  studentId?: string;
  studentName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  payment_status: string;
  description?: string;
  category?: string;
  reference?: string;
  gateway?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  // Backend fields
  uuid?: string;
  discount?: number;
  fine?: number;
  total?: number;
  dueDate?: string;
  status?: string;
  method?: string;
  type?: string;
  remarks?: string;
  parentId?: string;
  feeStructureId?: string;
  schoolId?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
  student?: {
    id: string;
    uuid: string;
    firstName: string;
    lastName: string;
  };
  parent?: {
    id: string;
    uuid: string;
    firstName: string;
    lastName: string;
  };
  feeStructure?: {
    id: string;
    uuid: string;
    name: string;
  };
  items?: PaymentItem[];
  refunds?: any[];
  installments?: any[];
  paymentLogs?: any[];
}

export interface PaymentItem {
  id: string;
  uuid: string;
  paymentId: string;
  feeItemId: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  description?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  feeItem?: {
    id: string;
    uuid: string;
    name: string;
    amount: number;
    isOptional: boolean;
    dueDate?: string;
  };
}

export interface FeeStructure {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  classId?: string;
  isDefault: boolean;
  schoolId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  items: FeeItem[];
}

export interface FeeItem {
  id: string;
  uuid: string;
  feeStructureId: string;
  name: string;
  amount: number;
  isOptional: boolean;
  dueDate?: string;
  schoolId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Student {
  id: string;
  uuid: string;
  admissionNo: string;
  rollNo?: string;
  classId?: string;
  sectionId?: string;
  parentId?: string;
  schoolId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user: {
    id: string;
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    displayName: string;
  };
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
    code: string;
  };
  parent?: {
    id: string;
    uuid: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  _count?: {
    attendances: number;
    grades: number;
    payments: number;
    documents: number;
    bookIssues: number;
    studentTransports: number;
    assignmentSubmissions: number;
  };
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'cancelled';
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  paymentId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  category: string;
  incomeDate: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  period: string;
  category: string;
  status: 'active' | 'completed' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface Fee {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  studentId?: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: string;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export interface FinanceDashboard {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingAmount: number;
    overdueAmount: number;
  };
  recentPayments: Payment[];
  upcomingPayments: Payment[];
  recentExpenses: Expense[];
  budgetStatus: Budget[];
  alerts: Array<{
    type: 'overdue' | 'budget_exceeded' | 'low_balance';
    message: string;
    amount?: number;
  }>;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  type?: string;
  studentId?: string;
  parentId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePaymentData {
  amount: number;
  discount?: number;
  fine?: number;
  total: number;
  paymentDate: string;
  dueDate?: string;
  status: string;
  method: string;
  type?: string;
  gateway?: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  receiptNumber?: string;
  remarks?: string;
  metadata?: any;
  isRecurring?: boolean;
  recurringFrequency?: string;
  nextPaymentDate?: string;
  studentId?: string;
  parentId?: string;
  feeStructureId?: string;
  items?: CreatePaymentItemData[];
}

export interface CreatePaymentItemData {
  feeItemId: string;
  amount: number;
  discount?: number;
  fine?: number;
  total: number;
  description?: string;
}

class FinanceApiService {
  private baseUrl = '/api';

  // ======================
  // PAYMENT OPERATIONS
  // ======================

  async getPayments(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Payment[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/payments?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<{ success: boolean; data: Payment }> {
    try {
      const response = await secureApiService.get(`/payments/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async createPayment(paymentData: CreatePaymentData): Promise<{ success: boolean; data: Payment; message: string }> {
    try {
      const response = await secureApiService.post('/payments', paymentData);
      return response;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(id: string, paymentData: Partial<CreatePaymentData>): Promise<{ success: boolean; data: Payment; message: string }> {
    try {
      const response = await secureApiService.put(`/payments/${id}`, paymentData);
      return response;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async deletePayment(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await secureApiService.delete(`/payments/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  async getPaymentAnalytics(): Promise<{ success: boolean; data: FinanceAnalytics }> {
    try {
      const response = await secureApiService.get('/payments/analytics/summary');
      return response;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw error;
    }
  }

  async getDashboardSummary(): Promise<{ success: boolean; data: FinanceDashboard }> {
    try {
      const response = await secureApiService.get('/payments/dashboard/summary');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  async getRecentPayments(): Promise<{ success: boolean; data: Payment[] }> {
    try {
      const response = await secureApiService.get('/payments/dashboard/recent');
      return response;
    } catch (error) {
      console.error('Error fetching recent payments:', error);
      throw error;
    }
  }

  async getUpcomingPayments(): Promise<{ success: boolean; data: Payment[] }> {
    try {
      const response = await secureApiService.get('/payments/dashboard/upcoming');
      return response;
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      throw error;
    }
  }

  async getOverduePayments(): Promise<{ success: boolean; data: Payment[] }> {
    try {
      const response = await secureApiService.get('/payments/overdue/list');
      return response;
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      throw error;
    }
  }

  async getStudentPayments(studentId: string, filters: PaymentFilters = {}): Promise<{ success: boolean; data: Payment[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/payments/student/${studentId}?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching student payments:', error);
      throw error;
    }
  }

  async generatePaymentReport(filters: PaymentFilters & { format?: 'pdf' | 'excel' } = {}): Promise<{ success: boolean; data: { url: string; filename: string } }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/payments/report/generate?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error generating payment report:', error);
      throw error;
    }
  }

  // ======================
  // FEE STRUCTURE OPERATIONS
  // ======================

  async getFeeStructures(filters: { classId?: string; isDefault?: boolean } = {}): Promise<{ success: boolean; data: FeeStructure[] }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/fee-structures?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      throw error;
    }
  }

  async getFeeStructureById(id: string): Promise<{ success: boolean; data: FeeStructure }> {
    try {
      const response = await secureApiService.get(`/fee-structures/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      throw error;
    }
  }

  async createFeeStructure(feeStructureData: Partial<FeeStructure>): Promise<{ success: boolean; data: FeeStructure }> {
    try {
      const response = await secureApiService.post('/fee-structures', feeStructureData);
      return response;
    } catch (error) {
      console.error('Error creating fee structure:', error);
      throw error;
    }
  }

  async updateFeeStructure(id: string, feeStructureData: Partial<FeeStructure>): Promise<{ success: boolean; data: FeeStructure }> {
    try {
      const response = await secureApiService.put(`/fee-structures/${id}`, feeStructureData);
      return response;
    } catch (error) {
      console.error('Error updating fee structure:', error);
      throw error;
    }
  }

  async deleteFeeStructure(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await secureApiService.delete(`/fee-structures/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      throw error;
    }
  }

  // ======================
  // FEE ITEM OPERATIONS
  // ======================

  async getFeeItems(feeStructureId?: string): Promise<{ success: boolean; data: FeeItem[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (feeStructureId) {
        queryParams.append('feeStructureId', feeStructureId);
      }

      const response = await secureApiService.get(`/fee-items?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching fee items:', error);
      throw error;
    }
  }

  async getFeeItemById(id: string): Promise<{ success: boolean; data: FeeItem }> {
    try {
      const response = await secureApiService.get(`/fee-items/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching fee item:', error);
      throw error;
    }
  }

  async createFeeItem(feeItemData: Partial<FeeItem>): Promise<{ success: boolean; data: FeeItem }> {
    try {
      const response = await secureApiService.post('/fee-items', feeItemData);
      return response;
    } catch (error) {
      console.error('Error creating fee item:', error);
      throw error;
    }
  }

  async updateFeeItem(id: string, feeItemData: Partial<FeeItem>): Promise<{ success: boolean; data: FeeItem }> {
    try {
      const response = await secureApiService.put(`/fee-items/${id}`, feeItemData);
      return response;
    } catch (error) {
      console.error('Error updating fee item:', error);
      throw error;
    }
  }

  async deleteFeeItem(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await secureApiService.delete(`/fee-items/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting fee item:', error);
      throw error;
    }
  }

  // ======================
  // STUDENT OPERATIONS
  // ======================

  async getStudents(filters: { classId?: string; search?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; data: Student[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/students?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async getStudentById(id: string): Promise<{ success: boolean; data: Student }> {
    try {
      const response = await secureApiService.get(`/students/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  async getStudentFinancials(studentId: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await secureApiService.get(`/students/${studentId}/financials`);
      return response;
    } catch (error) {
      console.error('Error fetching student financials:', error);
      throw error;
    }
  }

  // ======================
  // REFUND OPERATIONS
  // ======================

  async getRefunds(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Refund[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/refunds?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching refunds:', error);
      throw error;
    }
  }

  async createRefund(paymentId: string, refundData: { amount: number; reason: string; method: string; remarks?: string }): Promise<{ success: boolean; data: Refund; message: string }> {
    try {
      const response = await secureApiService.post(`/payments/${paymentId}/refunds`, refundData);
      return response;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  // ======================
  // INSTALLMENT OPERATIONS
  // ======================

  async getInstallments(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Installment[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/installments?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching installments:', error);
      throw error;
    }
  }

  async createInstallment(paymentId: string, installmentData: { amount: number; dueDate: string; remarks?: string }): Promise<{ success: boolean; data: Installment; message: string }> {
    try {
      const response = await secureApiService.post(`/payments/${paymentId}/installments`, installmentData);
      return response;
    } catch (error) {
      console.error('Error creating installment:', error);
      throw error;
    }
  }

  // ======================
  // EXPENSE OPERATIONS
  // ======================

  async getExpenses(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Expense[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/expenses?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  async createExpense(expenseData: Partial<Expense>): Promise<{ success: boolean; data: Expense }> {
    try {
      const response = await secureApiService.post('/expenses', expenseData);
      return response;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // ======================
  // INCOME OPERATIONS
  // ======================

  async getIncomes(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Income[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/incomes?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching incomes:', error);
      throw error;
    }
  }

  async createIncome(incomeData: Partial<Income>): Promise<{ success: boolean; data: Income }> {
    try {
      const response = await secureApiService.post('/incomes', incomeData);
      return response;
    } catch (error) {
      console.error('Error creating income:', error);
      throw error;
    }
  }

  // ======================
  // BUDGET OPERATIONS
  // ======================

  async getBudgets(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Budget[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/budgets?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  }

  async createBudget(budgetData: Partial<Budget>): Promise<{ success: boolean; data: Budget }> {
    try {
      const response = await secureApiService.post('/budgets', budgetData);
      return response;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  // ======================
  // PAYROLL OPERATIONS
  // ======================

  async getPayrolls(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Payroll[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await secureApiService.get(`/payrolls?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      throw error;
    }
  }

  async createPayroll(payrollData: Partial<Payroll>): Promise<{ success: boolean; data: Payroll }> {
    try {
      const response = await secureApiService.post('/payrolls', payrollData);
      return response;
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  async createBulkPayments(payments: CreatePaymentData[]): Promise<{ success: boolean; data: Payment[]; message: string }> {
    try {
      const response = await secureApiService.post('/payments/bulk/create', { payments });
      return response;
    } catch (error) {
      console.error('Error creating bulk payments:', error);
      throw error;
    }
  }

  async updatePaymentStatus(id: string, status: string, remarks?: string): Promise<{ success: boolean; data: Payment; message: string }> {
    try {
      const response = await secureApiService.patch(`/payments/${id}/status`, { status, remarks });
      return response;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // ======================
  // SEARCH OPERATIONS
  // ======================

  async searchPayments(query: string): Promise<{ success: boolean; data: Payment[] }> {
    try {
      const response = await secureApiService.get(`/payments?search=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('Error searching payments:', error);
      throw error;
    }
  }
}

export default new FinanceApiService(); 
