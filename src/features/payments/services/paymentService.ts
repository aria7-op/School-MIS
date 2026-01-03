import api from '../../../services/api/client';

export interface Payment {
  id: number;
  uuid: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  paymentDate: string;
  dueDate?: string;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED' | 'PENDING' | 'FAILED' | 'PROCESSING' | 'DISPUTED' | 'VOIDED';
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK' | 'SCHOLARSHIP' | 'CRYPTO' | 'DIGITAL_WALLET' | 'INSTALLMENT' | 'GRANT';
  type?: 'TUITION_FEE' | 'TRANSPORT_FEE' | 'LIBRARY_FEE' | 'LABORATORY_FEE' | 'SPORTS_FEE' | 'EXAM_FEE' | 'UNIFORM_FEE' | 'MEAL_FEE' | 'HOSTEL_FEE' | 'OTHER';
  gateway?: 'STRIPE' | 'PAYPAL' | 'SQUARE' | 'RAZORPAY' | 'PAYTM' | 'CASHFREE' | 'CUSTOM';
  transactionId?: string;
  gatewayTransactionId?: string;
  receiptNumber?: string;
  remarks?: string;
  metadata?: any;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextPaymentDate?: string;
  studentId?: number;
  parentId?: number;
  feeStructureId?: number;
  schoolId?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  student?: any;
  parent?: any;
  feeStructure?: any;
  items?: PaymentItem[];
  refunds?: Refund[];
  installments?: Installment[];
  paymentLogs?: PaymentLog[];
  createdByUser?: any;
  updatedByUser?: any;
}

export interface PaymentItem {
  id: number;
  paymentId: number;
  feeItemId: number;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  description?: string;
  feeItem?: any;
}

export interface Installment {
  id: number;
  paymentId: number;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  reason: string;
  method: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLog {
  id: number;
  paymentId: number;
  action: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  schoolId: number;
  createdBy?: number;
  createdAt: string;
}

export interface DiscountRequest {
  id: number;
  paymentId: number;
  studentId: number;
  requestedAmount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: number;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  payment: Payment;
  student: any;
  school?: any;
  items?: PaymentItem[];
  totalAmount: number;
  totalDiscount: number;
  totalFine: number;
  netAmount: number;
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  refundedAmount: number;
  paymentMethods: { method: string; count: number; amount: number }[];
  paymentStatuses: { status: string; count: number; amount: number }[];
  monthlyTrends: { month: string; amount: number; count: number }[];
  dailyTrends: { date: string; amount: number; count: number }[];
  topStudents: { studentId: number; studentName: string; totalPaid: number }[];
  overduePayments: Payment[];
  recentPayments: Payment[];
}

export interface PaymentDashboard {
  summary: {
    totalPayments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    refundedAmount: number;
    todayPayments: number;
    todayAmount: number;
    thisMonthPayments: number;
    thisMonthAmount: number;
  };
  charts: {
    paymentMethods: { method: string; count: number; amount: number }[];
    paymentStatuses: { status: string; count: number; amount: number }[];
    monthlyTrends: { month: string; amount: number; count: number }[];
    dailyTrends: { date: string; amount: number; count: number }[];
  };
  recentPayments: Payment[];
  upcomingPayments: Payment[];
  overduePayments: Payment[];
}

export interface BulkPaymentData {
  payments: Partial<Payment>[];
  skipDuplicates?: boolean;
}

export interface BulkUpdateData {
  paymentIds: number[];
  updates: Partial<Payment>;
}

export interface PaymentReport {
  payments: Payment[];
  summary: {
    totalPayments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    refundedAmount: number;
  };
  filters: any;
  generatedAt: string;
}

class PaymentService {
  private baseUrl = '/payments';
  private integratedUrl = '/integrated-payments';

  // Basic CRUD Operations
  async getPayments(params: any = {}): Promise<{ data: Payment[]; pagination: any }> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}?${queryString}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payments');
    }
  }

  async getPaymentById(id: number): Promise<Payment> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payment');
    }
  }

  async createPayment(data: any): Promise<Payment> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create payment');
    }
  }

  async updatePayment(id: number, data: any): Promise<Payment> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update payment');
    }
  }

  async deletePayment(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete payment');
    }
  }

  // Payment Status Management
  async updatePaymentStatus(id: number, status: string, remarks?: string): Promise<Payment> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}/status`, { status, remarks });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update payment status');
    }
  }

  // Integrated Payment Operations
  async createPaymentWithInstallments(payment: any, installments: any[]): Promise<{ payment: Payment; installments: Installment[] }> {
    try {
      const response = await api.post(`${this.integratedUrl}/create-with-installments`, {
        payment,
        installments
      });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create payment with installments');
    }
  }

  async getCompletePaymentDetails(paymentId: number): Promise<{
    payment: Payment;
    refunds: Refund[];
    installments: Installment[];
    summary: any;
  }> {
    try {
      const response = await api.get(`${this.integratedUrl}/${paymentId}/complete-details`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch complete payment details');
    }
  }

  // Refund Operations
  async processRefund(paymentId: number, refundData: any): Promise<Refund> {
    try {
      const response = await api.post(`${this.integratedUrl}/${paymentId}/refund`, refundData);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to process refund');
    }
  }

  async getRefunds(paymentId: number): Promise<Refund[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${paymentId}/refunds`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch refunds');
    }
  }

  async createRefund(paymentId: number, data: any): Promise<Refund> {
    try {
      const response = await api.post(`${this.baseUrl}/${paymentId}/refunds`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create refund');
    }
  }

  // Installment Operations
  async payInstallment(installmentId: number, paymentData: any): Promise<{ installment: Installment; payment: Payment }> {
    try {
      const response = await api.patch(`${this.integratedUrl}/installments/${installmentId}/pay`, paymentData);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to pay installment');
    }
  }

  async getInstallments(paymentId: number): Promise<Installment[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${paymentId}/installments`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch installments');
    }
  }

  async createInstallment(paymentId: number, data: any): Promise<Installment> {
    try {
      const response = await api.post(`${this.baseUrl}/${paymentId}/installments`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create installment');
    }
  }

  async updateInstallmentStatus(installmentId: number, status: string): Promise<Installment> {
    try {
      const response = await api.patch(`${this.baseUrl}/installments/${installmentId}`, { status });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update installment status');
    }
  }

  // Student and Parent Specific Operations
  async getStudentPayments(studentId: number, params: any = {}): Promise<Payment[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}/student/${studentId}?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch student payments');
    }
  }

  async getParentPayments(parentId: number, params: any = {}): Promise<Payment[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}/parent/${parentId}?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch parent payments');
    }
  }

  async getOverduePayments(params: any = {}): Promise<Payment[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}/overdue/list?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch overdue payments');
    }
  }

  // Analytics and Reporting
  async getPaymentAnalytics(params: any = {}): Promise<PaymentAnalytics> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.integratedUrl}/analytics?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payment analytics');
    }
  }

  async getPaymentDashboard(): Promise<PaymentDashboard> {
    try {
      const response = await api.get(`${this.integratedUrl}/dashboard`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payment dashboard');
    }
  }

  async getDashboardSummary(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard/summary`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch dashboard summary');
    }
  }

  async getRecentPayments(params: any = {}): Promise<Payment[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}/dashboard/recent?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch recent payments');
    }
  }

  async getUpcomingPayments(params: any = {}): Promise<Payment[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}/dashboard/upcoming?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch upcoming payments');
    }
  }

  async generatePaymentReport(params: any = {}): Promise<PaymentReport> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.integratedUrl}/report/generate?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate payment report');
    }
  }

  // Bulk Operations
  async createBulkPayments(data: BulkPaymentData): Promise<{ created: number; failed: number; errors: any[] }> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk/create`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create bulk payments');
    }
  }

  async bulkUpdateStatus(data: BulkUpdateData): Promise<{ updated: number; failed: number; errors: any[] }> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk/update-status`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk update payment status');
    }
  }

  async bulkPaymentOperations(operation: string, data: any): Promise<any> {
    try {
      const response = await api.post(`${this.integratedUrl}/bulk-operations`, {
        operation,
        data
      });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to perform bulk payment operations');
    }
  }

  // Payment Gateway Operations
  async getGatewayStatus(transactionId: string): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/gateway/status/${transactionId}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get gateway status');
    }
  }

  // Bill Generation
  async generateBill(paymentId: number): Promise<Bill> {
    try {
      const payment = await this.getPaymentById(paymentId);
      const totalAmount = payment.items?.reduce((sum, item) => sum + item.amount, 0) || payment.amount;
      const totalDiscount = payment.items?.reduce((sum, item) => sum + item.discount, 0) || payment.discount;
      const totalFine = payment.items?.reduce((sum, item) => sum + item.fine, 0) || payment.fine;
      const netAmount = totalAmount - totalDiscount + totalFine;

      return {
        payment,
        student: payment.student,
        school: {}, // You can fetch school info if needed
        items: payment.items,
        totalAmount,
        totalDiscount,
        totalFine,
        netAmount
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate bill');
    }
  }

  // Discount Request Operations
  async createDiscountRequest(paymentId: number, data: any): Promise<DiscountRequest> {
    try {
      const response = await api.post(`${this.baseUrl}/${paymentId}/discount-request`, data);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create discount request');
    }
  }

  async approveDiscountRequest(requestId: number, approvedAmount: number, remarks?: string): Promise<DiscountRequest> {
    try {
      const response = await api.patch(`${this.baseUrl}/discount-request/${requestId}/approve`, {
        approvedAmount,
        remarks
      });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to approve discount request');
    }
  }

  async rejectDiscountRequest(requestId: number, remarks?: string): Promise<DiscountRequest> {
    try {
      const response = await api.patch(`${this.baseUrl}/discount-request/${requestId}/reject`, {
        remarks
      });
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to reject discount request');
    }
  }

  // Search and Filter Operations
  async searchPayments(query: string, filters: any = {}): Promise<Payment[]> {
    try {
      const params = { ...filters, search: query };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to search payments');
    }
  }

  async getPaymentsByDateRange(startDate: string, endDate: string, filters: any = {}): Promise<Payment[]> {
    try {
      const params = { ...filters, startDate, endDate };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payments by date range');
    }
  }

  async getPaymentsByStatus(status: string, filters: any = {}): Promise<Payment[]> {
    try {
      const params = { ...filters, status };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payments by status');
    }
  }

  async getPaymentsByMethod(method: string, filters: any = {}): Promise<Payment[]> {
    try {
      const params = { ...filters, method };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${this.baseUrl}?${queryString}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch payments by method');
    }
  }
}

export default new PaymentService();
