// Finance Types - Comprehensive definitions for the finance feature

export type FinanceTab = 'overview' | 'payments' | 'expenses' | 'payroll' | 'by-class';

export interface Student {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: string;
  class?: {
    id: number;
    name: string;
  };
  parent?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export interface Payment {
  id: number;
  uuid: string;
  amount: number;
  discount: number;
  fine: number;
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
  isRecurring: boolean;
  recurringFrequency?: string;
  nextPaymentDate?: string;
  studentId?: number;
  parentId?: number;
  feeStructureId?: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  student?: Student;
  parent?: any;
  feeStructure?: any;
  items?: PaymentItem[];
  refunds?: any[];
  installments?: any[];
  paymentLogs?: any[];
}

export interface PaymentItem {
  id: number;
  uuid: string;
  paymentId: number;
  feeItemId: number;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  description?: string;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  feeItem?: any;
}

export interface CreatePaymentData {
  amount: number;
  discount?: number;
  fine?: number;
  total: number;
  paymentDate: string;
  month?: string; // Hijri Shamsi month (e.g., Hamal, Saur, Jawza)
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
  studentId?: number;
  parentId?: number;
  feeStructureId?: number;
}

export interface Expense {
  id: number;
  uuid: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  status: string;
  method: string;
  receiptNumber?: string;
  remarks?: string;
  metadata?: any;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateExpenseData {
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  method: string;
  receiptNumber?: string;
  remarks?: string;
  metadata?: any;
}

export interface Payroll {
  id: number;
  uuid: string;
  employeeId: number;
  employeeName: string;
  name: string;
  staffName: string;
  staffId: number;
  teacherName: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: string;
  year: number;
  status: string;
  paymentDate?: string;
  remarks?: string;
  metadata?: any;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreatePayrollData {
  staffId?: number;
  employeeId?: string;
  teacherUserId?: number;
  employeeName?: string;
  salaryMonth: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  bonus: number;
  netSalary: number;
  paymentDate?: string;
  status: string;
  method: string;
  transactionId?: string;
  remarks?: string;
  metadata?: any;
}

export interface FinanceAnalytics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalPayments: number;
  totalPayroll: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
  paymentMethods: {
    cash: number;
    card: number;
    bank: number;
    online: number;
  };
  expenseCategories: {
    [key: string]: number;
  };
  recentTransactions: any[];
  upcomingPayments: any[];
  overduePayments: any[];
}

export interface FinanceFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  status?: string;
  method?: string;
  category?: string;
  studentId?: number;
  employeeId?: number;
  page?: number;
  limit?: number;
  per_page?: number;
  pageSize?: number;
  schoolId?: string | number | null;
  branchId?: string | number | null;
  courseId?: string | number | null;
  scopeKey?: string;
  scopeMode?: 'active' | 'all';
}

export interface FinanceStats {
  totalPayments: number;
  totalExpenses: number;
  totalPayroll: number;
  netIncome: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

// API Response types
export interface FinanceApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Modal props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  data?: any;
}

// Component props
export interface FinanceHeaderProps {
  onSearch: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onPrint: () => void;
}

export interface SegmentedControlProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actions: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
  }[];
}

export interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
}