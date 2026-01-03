import { useState, useCallback } from 'react';
import paymentService, {
  Payment,
  PaymentAnalytics,
  PaymentDashboard,
  PaymentReport,
  Installment,
  Refund,
  DiscountRequest,
  Bill,
  BulkPaymentData,
  BulkUpdateData
} from '../services/paymentService';

export const usePaymentApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic CRUD Operations
  const getPayments = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPayments(params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentById(id);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createPayment(data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayment = useCallback(async (id: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.updatePayment(id, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await paymentService.deletePayment(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Payment Status Management
  const updatePaymentStatus = useCallback(async (id: number, status: string, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.updatePaymentStatus(id, status, remarks);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Integrated Payment Operations
  const createPaymentWithInstallments = useCallback(async (payment: any, installments: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createPaymentWithInstallments(payment, installments);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompletePaymentDetails = useCallback(async (paymentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getCompletePaymentDetails(paymentId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refund Operations
  const processRefund = useCallback(async (paymentId: number, refundData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.processRefund(paymentId, refundData);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRefunds = useCallback(async (paymentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getRefunds(paymentId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRefund = useCallback(async (paymentId: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createRefund(paymentId, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Installment Operations
  const payInstallment = useCallback(async (installmentId: number, paymentData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.payInstallment(installmentId, paymentData);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInstallments = useCallback(async (paymentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getInstallments(paymentId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInstallment = useCallback(async (paymentId: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createInstallment(paymentId, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInstallmentStatus = useCallback(async (installmentId: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.updateInstallmentStatus(installmentId, status);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Student and Parent Specific Operations
  const getStudentPayments = useCallback(async (studentId: number, params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getStudentPayments(studentId, params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getParentPayments = useCallback(async (parentId: number, params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getParentPayments(parentId, params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOverduePayments = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getOverduePayments(params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analytics and Reporting
  const getPaymentAnalytics = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentAnalytics(params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentDashboard();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDashboardSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getDashboardSummary();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentPayments = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getRecentPayments(params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUpcomingPayments = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getUpcomingPayments(params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePaymentReport = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.generatePaymentReport(params);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk Operations
  const createBulkPayments = useCallback(async (data: BulkPaymentData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createBulkPayments(data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (data: BulkUpdateData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.bulkUpdateStatus(data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkPaymentOperations = useCallback(async (operation: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.bulkPaymentOperations(operation, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Payment Gateway Operations
  const getGatewayStatus = useCallback(async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getGatewayStatus(transactionId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bill Generation
  const generateBill = useCallback(async (paymentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.generateBill(paymentId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Discount Request Operations
  const createDiscountRequest = useCallback(async (paymentId: number, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.createDiscountRequest(paymentId, data);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveDiscountRequest = useCallback(async (requestId: number, approvedAmount: number, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.approveDiscountRequest(requestId, approvedAmount, remarks);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectDiscountRequest = useCallback(async (requestId: number, remarks?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.rejectDiscountRequest(requestId, remarks);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search and Filter Operations
  const searchPayments = useCallback(async (query: string, filters: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.searchPayments(query, filters);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentsByDateRange = useCallback(async (startDate: string, endDate: string, filters: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentsByDateRange(startDate, endDate, filters);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentsByStatus = useCallback(async (status: string, filters: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentsByStatus(status, filters);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentsByMethod = useCallback(async (method: string, filters: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentService.getPaymentsByMethod(method, filters);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    // Basic CRUD
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
    // Status Management
    updatePaymentStatus,
    // Integrated Operations
    createPaymentWithInstallments,
    getCompletePaymentDetails,
    // Refunds
    processRefund,
    getRefunds,
    createRefund,
    // Installments
    payInstallment,
    getInstallments,
    createInstallment,
    updateInstallmentStatus,
    // Student/Parent Specific
    getStudentPayments,
    getParentPayments,
    getOverduePayments,
    // Analytics & Reporting
    getPaymentAnalytics,
    getPaymentDashboard,
    getDashboardSummary,
    getRecentPayments,
    getUpcomingPayments,
    generatePaymentReport,
    // Bulk Operations
    createBulkPayments,
    bulkUpdateStatus,
    bulkPaymentOperations,
    // Gateway Operations
    getGatewayStatus,
    // Bill Generation
    generateBill,
    // Discount Requests
    createDiscountRequest,
    approveDiscountRequest,
    rejectDiscountRequest,
    // Search & Filter
    searchPayments,
    getPaymentsByDateRange,
    getPaymentsByStatus,
    getPaymentsByMethod,
  };
};

export default usePaymentApi; 
