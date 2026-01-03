import { useState, useEffect, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';
import { 
  decryptCustomerData, 
  processCustomerAnalytics, 
  getCustomerStats, 
  filterCustomers, 
  sortCustomers,
  Customer,
  CustomerAnalytics
} from '../utils/customerDataUtils';

interface UseCustomerDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAnalytics?: boolean;
  enableStats?: boolean;
}

interface UseCustomerDataReturn {
  customers: Customer[];
  analytics: CustomerAnalytics | null;
  stats: ReturnType<typeof getCustomerStats> | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  filterCustomers: (filters: any) => Customer[];
  sortCustomers: (sortBy: string, sortOrder: 'asc' | 'desc') => Customer[];
  getCustomerById: (id: number) => Customer | undefined;
  getCustomersByType: (type: string) => Customer[];
  getCustomersBySource: (source: string) => Customer[];
  getCustomersByCity: (city: string) => Customer[];
  getCustomersByPriority: (priority: string) => Customer[];
  getCustomersByPurpose: (purpose: string) => Customer[];
  getHighValueCustomers: (minValue?: number) => Customer[];
  getConvertedCustomers: () => Customer[];
  getUnconvertedCustomers: () => Customer[];
}

export const useCustomerData = (options: UseCustomerDataOptions = {}): UseCustomerDataReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableAnalytics = true,
    enableStats = true
  } = options;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof getCustomerStats> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch encrypted customer data
      const response = await secureApiService.get('/customers');
      
      console.log('Customer data response:', {
        hasEncryptedData: response?.encryptedData,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        fullResponse: response
      });

      // Check if response is already decrypted by secureApiService
      if (response && !(response as any).encryptedData) {
        let customers: Customer[] = [];
        
        if (Array.isArray(response)) {
          customers = response;
        } else if (response.data && Array.isArray(response.data)) {
          customers = response.data;
        } else if (response.customers && Array.isArray(response.customers)) {
          customers = response.customers;
        } else {
          setCustomers([]);
          setAnalytics(null);
          setStats(null);
          return;
        }
        
        console.log('Processed customers data:', customers.length, 'customers loaded');
        setCustomers(customers);
        
        // Process analytics if enabled
        if (enableAnalytics) {
          const customerAnalytics = processCustomerAnalytics(customers);
          setAnalytics(customerAnalytics);
          }

        // Process stats if enabled
        if (enableStats) {
          const customerStats = getCustomerStats(customers);
          setStats(customerStats);
          }
        
        return;
      }

      // Decrypt the customer data
      const decryptedCustomers = decryptCustomerData(response);
      
      if (decryptedCustomers.length === 0) {
        setCustomers([]);
        setAnalytics(null);
        setStats(null);
        return;
      }

      setCustomers(decryptedCustomers);

      // Process analytics if enabled
      if (enableAnalytics) {
        const customerAnalytics = processCustomerAnalytics(decryptedCustomers);
        setAnalytics(customerAnalytics);
        }

      // Process stats if enabled
      if (enableStats) {
        const customerStats = getCustomerStats(decryptedCustomers);
        setStats(customerStats);
        }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer data';
      console.error('❌ Error fetching customer data:', errorMessage);
      console.error('❌ Full error:', err);
      setError(errorMessage);
      setCustomers([]);
      setAnalytics(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [enableAnalytics, enableStats]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Auto refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCustomers();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCustomers]);

  // Utility functions
  const filterCustomersByCriteria = useCallback((filters: any) => {
    return filterCustomers(customers, filters);
  }, [customers]);

  const sortCustomersByCriteria = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    return sortCustomers(customers, sortBy, sortOrder);
  }, [customers]);

  const getCustomerById = useCallback((id: number) => {
    return customers.find(customer => customer.id === id);
  }, [customers]);

  const getCustomersByType = useCallback((type: string) => {
    return customers.filter(customer => customer.type === type);
  }, [customers]);

  const getCustomersBySource = useCallback((source: string) => {
    return customers.filter(customer => customer.source === source);
  }, [customers]);

  const getCustomersByCity = useCallback((city: string) => {
    return customers.filter(customer => customer.city === city);
  }, [customers]);

  const getCustomersByPriority = useCallback((priority: string) => {
    return customers.filter(customer => customer.priority === priority);
  }, [customers]);

  const getCustomersByPurpose = useCallback((purpose: string) => {
    return customers.filter(customer => customer.purpose === purpose);
  }, [customers]);

  const getHighValueCustomers = useCallback((minValue: number = 1000) => {
    return customers.filter(customer => (customer.value || 0) >= minValue);
  }, [customers]);

  const getConvertedCustomers = useCallback(() => {
    return customers.filter(customer => (customer.value || 0) > 0);
  }, [customers]);

  const getUnconvertedCustomers = useCallback(() => {
    return customers.filter(customer => (customer.value || 0) === 0);
  }, [customers]);

  return {
    customers,
    analytics,
    stats,
    loading,
    error,
    refresh: fetchCustomers,
    filterCustomers: filterCustomersByCriteria,
    sortCustomers: sortCustomersByCriteria,
    getCustomerById,
    getCustomersByType,
    getCustomersBySource,
    getCustomersByCity,
    getCustomersByPriority,
    getCustomersByPurpose,
    getHighValueCustomers,
    getConvertedCustomers,
    getUnconvertedCustomers
  };
}; 