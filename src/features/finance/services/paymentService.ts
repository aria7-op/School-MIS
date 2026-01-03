import api from '../../../services/api/api';

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
    class_name: string;
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
  items?: CreatePaymentItemData[];
}

export interface CreatePaymentItemData {
  feeItemId: number;
  amount: number;
  discount?: number;
  fine?: number;
  total: number;
  description?: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  type?: string;
  studentId?: number;
  parentId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  monthlyStats: {
    month: string;
    total: number;
    paid: number;
    outstanding: number;
  }[];
  methodStats: {
    method: string;
    count: number;
    amount: number;
  }[];
  statusStats: {
    status: string;
    count: number;
    amount: number;
  }[];
}

class PaymentService {
  private baseUrl = '/payments';

  // Get all payments with filters
  async getPayments(filters: PaymentFilters = {}): Promise<{ success: boolean; data: Payment[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(id: number): Promise<{ success: boolean; data: Payment }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Create new payment
  async createPayment(paymentData: CreatePaymentData): Promise<{ success: boolean; data: Payment; message: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Update payment
  async updatePayment(id: number, paymentData: Partial<CreatePaymentData>): Promise<{ success: boolean; data: Payment; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Delete payment
  async deletePayment(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get student payments
  async getStudentPayments(studentId: number, filters: PaymentFilters = {}): Promise<{ success: boolean; data: Payment[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/student/${studentId}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student payments');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get parent payments
  async getParentPayments(parentId: number, filters: PaymentFilters = {}): Promise<{ success: boolean; data: Payment[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/parent/${parentId}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch parent payments');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(filters: { startDate?: string; endDate?: string; studentId?: number } = {}): Promise<{ success: boolean; data: PaymentAnalytics }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/analytics/summary?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment analytics');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get dashboard summary
  async getDashboardSummary(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/summary`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard summary');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get upcoming payments
  async getUpcomingPayments(days: number = 30): Promise<{ success: boolean; data: Payment[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/upcoming?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming payments');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get overdue payments
  async getOverduePayments(): Promise<{ success: boolean; data: Payment[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/overdue`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch overdue payments');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Create refund
  async createRefund(paymentId: number, refundData: {
    amount: number;
    reason: string;
    method: string;
    remarks?: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refundData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create refund');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Create installment
  async createInstallment(paymentId: number, installmentData: {
    amount: number;
    dueDate: string;
    remarks?: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}/installments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(installmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create installment');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Generate payment report
  async generatePaymentReport(filters: PaymentFilters & { format?: 'pdf' | 'excel' } = {}): Promise<{ success: boolean; data: { url: string; filename: string } }> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/report?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate payment report');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Bulk create payments
  async createBulkPayments(payments: CreatePaymentData[]): Promise<{ success: boolean; data: Payment[]; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payments })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create bulk payments');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(id: number, status: string, remarks?: string): Promise<{ success: boolean; data: Payment; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, remarks })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment status');
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  }

  // Get auth token (implement based on your auth system)
  private async getAuthToken(): Promise<string> {
    // Implement your token retrieval logic here
    // This could be from AsyncStorage, secure storage, or context
    return '';
  }
}

export default new PaymentService(); 
