import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';
import { Customer, CustomerFilters, CustomerResponse, CustomerAnalytics } from '../types/customer';

export interface UseCustomerApiReturn {
  // Data
  customers: Customer[];
  customer: Customer | null;
  analytics: CustomerAnalytics | null;
  
  // Loading states
  loading: boolean;
  loadingCustomer: boolean;
  loadingAnalytics: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
  fetchCustomerById: (id: string | number) => Promise<void>;
  createCustomer: (customerData: Partial<Customer>) => Promise<CustomerResponse>;
  updateCustomer: (id: string | number, customerData: Partial<Customer>) => Promise<CustomerResponse>;
  deleteCustomer: (id: string | number) => Promise<CustomerResponse>;
  searchCustomers: (query: string, filters?: CustomerFilters) => Promise<void>;
  fetchAnalytics: (params?: any) => Promise<void>;
  clearError: () => void;
  clearCustomer: () => void;
}

export const useCustomerApi = (): UseCustomerApiReturn => {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all customers
  const fetchCustomers = useCallback(async (filters?: CustomerFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.getAllCustomers(filters);
      
      if (response.success) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message);
        setCustomers([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch customer by ID
  const fetchCustomerById = useCallback(async (id: string | number) => {
    try {
      setLoadingCustomer(true);
      setError(null);
      
      const response = await customerService.getCustomerById(id);
      
      if (response.success) {
        setCustomer(response.data as Customer);
      } else {
        setError(response.message);
        setCustomer(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer');
      setCustomer(null);
    } finally {
      setLoadingCustomer(false);
    }
  }, []);

  // Create customer
  const createCustomer = useCallback(async (customerData: Partial<Customer>): Promise<CustomerResponse> => {
    try {
      setError(null);
      
      const response = await customerService.createCustomer(customerData);
      
      if (response.success) {
        // Refresh customers list
        await fetchCustomers();
      }
      
      return response;
    } catch (err: any) {
      const errorResponse = {
        success: false,
        data: null,
        message: err.message || 'Failed to create customer'
      };
      setError(errorResponse.message);
      return errorResponse;
    }
  }, [fetchCustomers]);

  // Update customer
  const updateCustomer = useCallback(async (id: string | number, customerData: Partial<Customer>): Promise<CustomerResponse> => {
    try {
      setError(null);
      
      const response = await customerService.updateCustomer(id, customerData);
      
      if (response.success) {
        // Refresh customers list and current customer
        await fetchCustomers();
        await fetchCustomerById(id);
      }
      
      return response;
    } catch (err: any) {
      const errorResponse = {
        success: false,
        data: null,
        message: err.message || 'Failed to update customer'
      };
      setError(errorResponse.message);
      return errorResponse;
    }
  }, [fetchCustomers, fetchCustomerById]);

  // Delete customer
  const deleteCustomer = useCallback(async (id: string | number): Promise<CustomerResponse> => {
    try {
      setError(null);
      
      const response = await customerService.deleteCustomer(id);
      
      if (response.success) {
        // Remove from local state
        setCustomers(prev => prev.filter(c => c.id !== id));
        if (customer && customer.id === id) {
          setCustomer(null);
        }
      }
      
      return response;
    } catch (err: any) {
      const errorResponse = {
        success: false,
        data: null,
        message: err.message || 'Failed to delete customer'
      };
      setError(errorResponse.message);
      return errorResponse;
    }
  }, [customer]);

  // Search customers
  const searchCustomers = useCallback(async (query: string, filters?: CustomerFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.searchCustomers(query, filters);
      
      if (response.success) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message);
        setCustomers([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch analytics
  const fetchAnalytics = useCallback(async (params?: any) => {
    try {
      setLoadingAnalytics(true);
      setError(null);
      
      const response = await customerService.getCustomerAnalytics(params);
      
      if (response.success) {
        setAnalytics(response.data as CustomerAnalytics);
      } else {
        setError(response.message);
        setAnalytics(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current customer
  const clearCustomer = useCallback(() => {
    setCustomer(null);
  }, []);

  return {
    // Data
    customers,
    customer,
    analytics,
    
    // Loading states
    loading,
    loadingCustomer,
    loadingAnalytics,
    
    // Error states
    error,
    
    // Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomers,
    fetchAnalytics,
    clearError,
    clearCustomer
  };
};

export default useCustomerApi;

