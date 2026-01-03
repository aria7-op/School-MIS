import { useState, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';
import { useToast } from '../../../hooks/useToast';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'corporate';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'inactive';
  convertedToStudent?: boolean;
  convertedFromCustomerId?: string;
  conversionDate?: string;
  conversionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerEvent {
  id: string;
  eventType: 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED' | 'CUSTOMER_CONVERTED_TO_STUDENT';
  title: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface ConversionAnalytics {
  totalCustomers: number;
  convertedCustomers: number;
  unconvertedCustomers: number;
  conversionRate: number;
  recentConversions: number;
  conversionTrend: Array<{
    date: string;
    conversions: number;
  }>;
  conversionEvents: CustomerEvent[];
}

export interface ConversionRates {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export const useCustomerApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Create Customer
  const createCustomer = useCallback(async (customerData: {
    name: string;
    email: string;
    phone: string;
    type: 'individual' | 'corporate';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<Customer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.createCustomer(customerData);
      if (response.success) {
        showToast('Customer created successfully', 'success');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Update Customer
  const updateCustomer = useCallback(async (customerId: string, updateData: Partial<Customer>): Promise<Customer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.updateCustomer(customerId, updateData);
      if (response.success) {
        showToast('Customer updated successfully', 'success');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update customer');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Delete Customer
  const deleteCustomer = useCallback(async (customerId: string, deletionReason: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await secureApiService.deleteCustomer(customerId, deletionReason);
      showToast('Customer deleted successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Convert Customer to Student
  const convertCustomerToStudent = useCallback(async (customerId: string, conversionData: {
    conversionReason: string;
    admissionNo: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.convertCustomerToStudent(customerId, conversionData);
      if (response.success) {
        showToast('Customer converted to student successfully', 'success');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to convert customer to student');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to convert customer to student';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Unconverted Customers
  const getUnconvertedCustomers = useCallback(async (page = 1, limit = 10): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Test direct call to see what we get
      const testResponse = await secureApiService.getCustomers({ page, limit });
      console.log('Test response:', {
        dataLength: Array.isArray(testResponse?.data) ? testResponse.data.length : 'N/A',
        firstItem: Array.isArray(testResponse?.data) && testResponse.data.length > 0 ? testResponse.data[0] : null
      });
      
      // If we get data from direct call, use it
      if (testResponse?.success && Array.isArray(testResponse?.data) && testResponse.data.length > 0) {
        const response = {
          success: true,
          data: {
            customers: testResponse.data,
            total: testResponse.data.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(testResponse.data.length / limit)
          }
        };
        return response.data;
      }
      
      const response = await secureApiService.getUnconvertedCustomers(page, limit);
      console.log('Unconverted response:', {
        dataType: typeof response?.data
      });
      
      if (response.success) {
        console.log('Response analysis:', {
          dataType: Array.isArray(response.data?.customers) ? 'array' : typeof response.data?.customers,
          hasData: !!response.data?.data,
          dataLength: response.data?.data?.length || 0,
          total: response.data?.total,
          page: response.data?.page,
          totalPages: response.data?.totalPages,
          meta: response.data?.meta,
          responseKeys: Object.keys(response.data || {}),
          isDataArray: Array.isArray(response.data?.data),
          isCustomersArray: Array.isArray(response.data?.customers)
        });
        
        // Handle different response structures
        let customers = [];
        let total = 0;
        let page = 1;
        let totalPages = 1;
        
        console.log('Structure analysis:', {
          responseDataKeys: Object.keys(response.data || {}),
          hasCustomers: !!response.data?.customers,
          hasData: !!response.data?.data,
          hasMeta: !!response.data?.meta
        });
        
        if (response.data?.customers && Array.isArray(response.data.customers)) {
          // Structure: { customers: [...], total, page, totalPages }
          customers = response.data.customers;
          total = response.data.total || customers.length;
          page = response.data.page || 1;
          totalPages = response.data.totalPages || 1;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Structure: { data: [...], meta: { total, page, totalPages } }
          customers = response.data.data;
          total = response.data.meta?.total || customers.length;
          page = response.data.meta?.page || 1;
          totalPages = response.data.meta?.totalPages || 1;
          } else if (Array.isArray(response.data)) {
          // Structure: direct array
          customers = response.data;
          total = customers.length;
          page = 1;
          totalPages = 1;
          } else {
          // Fallback: try to extract from any available structure
          if (response.data && typeof response.data === 'object') {
            // Look for any array property that might contain customers
            for (const key of Object.keys(response.data)) {
              if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
                customers = response.data[key];
                break;
              }
            }
          }
          total = customers.length;
          page = 1;
          totalPages = 1;
        }
        
        // Convert students to customers format if needed
        if (customers.length > 0 && customers[0]?.user?.role === 'STUDENT') {
          customers = customers.map(student => ({
            id: student.id,
            name: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim(),
            email: student.user?.email || '',
            phone: student.user?.phone || '',
            type: 'individual' as const,
            status: student.user?.status?.toLowerCase() as 'active' | 'inactive',
            convertedToStudent: false, // Set to false for unconverted customers
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
          }));
        }
        
        return {
          customers,
          total,
          page,
          limit,
          totalPages
        };
      } else {
        throw new Error(response.message || 'Failed to fetch unconverted customers');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch unconverted customers';
      console.error('❌ useCustomerApi - Error fetching unconverted customers:', err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Conversion Analytics
  const getConversionAnalytics = useCallback(async (period = '30d'): Promise<ConversionAnalytics> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getCustomerConversionAnalytics(period);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch conversion analytics');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch conversion analytics';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Conversion History
  const getConversionHistory = useCallback(async (page = 1, limit = 10): Promise<{
    conversions: Array<{
      customer: Customer;
      student: any;
      conversionDate: string;
      conversionReason: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getCustomerConversionHistory(page, limit);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch conversion history');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch conversion history';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Conversion Rates
  const getConversionRates = useCallback(async (period = 'monthly'): Promise<ConversionRates> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getCustomerConversionRates(period);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch conversion rates');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch conversion rates';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get All Customers
  const getAllCustomers = useCallback(async (page = 1, limit = 10, filters?: {
    status?: string;
    type?: string;
    priority?: string;
    search?: string;
  }): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await secureApiService.getCustomers(params);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customers';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Customer by ID
  const getCustomerById = useCallback(async (customerId: string): Promise<Customer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getCustomerById(customerId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch customer');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    convertCustomerToStudent,
    getUnconvertedCustomers,
    getConversionAnalytics,
    getConversionHistory,
    getConversionRates,
    getAllCustomers,
    getCustomerById,
  };
}; 