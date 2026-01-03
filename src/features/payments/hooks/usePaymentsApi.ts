import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

export interface Payment {
  id: number;
  amount: number;
  status: string;
  paymentType: string;
  paymentDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  student?: {
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      profilePicture?: string;
    };
  };
}

export interface PaymentFilters {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

const usePaymentsApi = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters?: PaymentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/payments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
      
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (paymentId: number, options?: { reason?: string }) => {
    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: options?.reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }

      // Remove from local state
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete payment');
    }
  }, []);

  const createPayment = useCallback(async (paymentData: Partial<Payment>) => {
    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const newPayment = await response.json();
      setPayments(prev => [newPayment, ...prev]);
      
      return { success: true, data: newPayment };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create payment');
    }
  }, []);

  const updatePayment = useCallback(async (paymentId: number, paymentData: Partial<Payment>) => {
    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment');
      }

      const updatedPayment = await response.json();
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      
      return { success: true, data: updatedPayment };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update payment');
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    deletePayment,
    createPayment,
    updatePayment,
  };
};

export default usePaymentsApi; 
