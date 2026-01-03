import { useState, useCallback, useEffect } from 'react';
import { customerEventAnalyticsApi } from '../api';

// ======================
// INTERFACES
// ======================

export interface CustomerEvent {
  id: string;
  eventType: 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED' | 'CUSTOMER_CONVERTED_TO_STUDENT';
  title: string;
  description: string;
  metadata: {
    customerId: string;
    customerData?: any;
    createdBy: string;
    conversionReason?: string;
    admissionNo?: string;
  };
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

export interface ConversionHistory {
  id: string;
  customerId: string;
  customerName: string;
  conversionDate: string;
  conversionReason: string;
  admissionNo: string;
  convertedBy: string;
}

export interface ConversionRates {
  period: string;
  totalCustomers: number;
  convertedCustomers: number;
  conversionRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UnconvertedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  lastActivity?: string;
  leadScore?: number;
  stage: string;
  value?: number;
}

// ======================
// DUMMY DATA GENERATORS
// ======================

const generateDummyCustomerEvents = (count = 10): CustomerEvent[] => {
  const events: CustomerEvent[] = [];
  const eventTypes: CustomerEvent['eventType'][] = [
    'CUSTOMER_CREATED',
    'CUSTOMER_UPDATED', 
    'CUSTOMER_DELETED',
    'CUSTOMER_CONVERTED_TO_STUDENT'
  ];

  for (let i = 1; i <= count; i++) {
    events.push({
      id: `event-${i}`,
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      title: `Customer ${eventTypes[Math.floor(Math.random() * eventTypes.length)].replace(/_/g, ' ')}`,
      description: `Event ${i} description`,
      metadata: {
        customerId: `customer-${i}`,
        customerData: {
          name: `Customer ${i}`,
          email: `customer${i}@example.com`
        },
        createdBy: `user-${Math.floor(Math.random() * 5) + 1}`,
        conversionReason: i % 3 === 0 ? 'Enrolled in course' : undefined,
        admissionNo: i % 3 === 0 ? `STU-2024-${String(i).padStart(3, '0')}` : undefined
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return events;
};

const generateDummyConversionAnalytics = (): ConversionAnalytics => {
  const totalCustomers = 1000;
  const convertedCustomers = 250;
  const unconvertedCustomers = totalCustomers - convertedCustomers;
  const conversionRate = (convertedCustomers / totalCustomers) * 100;

  return {
    totalCustomers,
    convertedCustomers,
    unconvertedCustomers,
    conversionRate,
    recentConversions: 15,
    conversionTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      conversions: Math.floor(Math.random() * 10) + 1
    })),
    conversionEvents: generateDummyCustomerEvents(20)
  };
};

// Helper function to process conversion trend data from API
const processConversionTrend = (trendData: any[]): Array<{date: string, conversions: number}> => {
  if (!Array.isArray(trendData)) return [];
  
  return trendData.map(item => ({
    date: item.conversionDate ? new Date(item.conversionDate).toISOString().split('T')[0] : '',
    conversions: item._count?.id || 1
  }));
};

const generateDummyConversionHistory = (count = 10): ConversionHistory[] => {
  const history: ConversionHistory[] = [];
  
  for (let i = 1; i <= count; i++) {
    history.push({
      id: `conversion-${i}`,
      customerId: `customer-${i}`,
      customerName: `Customer ${i}`,
      conversionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      conversionReason: 'Enrolled in course',
      admissionNo: `STU-2024-${String(i).padStart(3, '0')}`,
      convertedBy: `User ${Math.floor(Math.random() * 5) + 1}`
    });
  }
  return history;
};

const generateDummyConversionRates = (): ConversionRates => {
  return {
    period: 'monthly',
    totalCustomers: 1000,
    convertedCustomers: 250,
    conversionRate: 25.0,
    trend: 'increasing'
  };
};

const generateDummyUnconvertedCustomers = (count = 10): UnconvertedCustomer[] => {
  const customers: UnconvertedCustomer[] = [];
  
  for (let i = 1; i <= count; i++) {
    customers.push({
      id: `customer-${i}`,
      name: `Unconverted Customer ${i}`,
      email: `unconverted${i}@example.com`,
      phone: `+1-555-${String(i).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      leadScore: Math.floor(Math.random() * 100) + 1,
      stage: ['LEAD', 'PROSPECT', 'CUSTOMER'][Math.floor(Math.random() * 3)],
      value: Math.floor(Math.random() * 10000) + 100
    });
  }
  return customers;
};

// ======================
// HOOK
// ======================

export const useCustomerEventAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionAnalytics, setConversionAnalytics] = useState<ConversionAnalytics | null>(null);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [conversionRates, setConversionRates] = useState<ConversionRates | null>(null);
  const [unconvertedCustomers, setUnconvertedCustomers] = useState<UnconvertedCustomer[]>([]);
  const [customerEvents, setCustomerEvents] = useState<CustomerEvent[]>([]);

  // Get unconverted customers count
  const getUnconvertedCustomers = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await customerEventAnalyticsApi.getUnconvertedCustomers(params);
      
      if (response.success) {
        setUnconvertedCustomers(response.data);
        return response.data;
      } else {
        // Fallback to dummy data
        const dummyData = generateDummyUnconvertedCustomers(params?.limit || 10);
        setUnconvertedCustomers(dummyData);
        return dummyData;
      }
    } catch (err) {
      console.error('Failed to fetch unconverted customers:', err);
      setError('Failed to fetch unconverted customers');
      
      // Fallback to dummy data
      const dummyData = generateDummyUnconvertedCustomers(params?.limit || 10);
      setUnconvertedCustomers(dummyData);
      return dummyData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get conversion analytics
  const getConversionAnalytics = useCallback(async (params?: any) => {
    console.log('🔍 Starting getConversionAnalytics...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Calling customerEventAnalyticsApi.getConversionAnalytics()...');
      const response = await customerEventAnalyticsApi.getConversionAnalytics(params);
      console.log('🔍 Conversion Analytics Raw Response:', response);
      console.log('🔍 Conversion Analytics Response Type:', typeof response);
      console.log('🔍 Conversion Analytics Response Success:', response?.success);
      console.log('🔍 Conversion Analytics Response Data:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('🔍 Setting conversion analytics from API response:', response.data);
        
        // Process the conversion trend data to match expected format
        const processedData = {
          ...response.data,
          conversionTrend: processConversionTrend(response.data.conversionTrend)
        };
        
        console.log('🔍 Processed conversion analytics data:', processedData);
        setConversionAnalytics(processedData);
        return processedData;
      } else {
        console.log('🔍 API response not successful, using dummy data');
        // Fallback to dummy data
        const dummyData = generateDummyConversionAnalytics();
        console.log('🔍 Setting conversion analytics from dummy data:', dummyData);
        setConversionAnalytics(dummyData);
        return dummyData;
      }
    } catch (err) {
      console.error('❌ Failed to fetch conversion analytics:', err);
      console.error('❌ Conversion Analytics Error Details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError('Failed to fetch conversion analytics');
      
      // Fallback to dummy data
      const dummyData = generateDummyConversionAnalytics();
      console.log('🔍 Setting conversion analytics from dummy data after error:', dummyData);
      setConversionAnalytics(dummyData);
      return dummyData;
    } finally {
      setLoading(false);
      console.log('🔍 getConversionAnalytics completed, loading set to false');
    }
  }, []);

  // Get conversion history
  const getConversionHistory = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await customerEventAnalyticsApi.getConversionHistory(params);
      
      if (response.success) {
        setConversionHistory(response.data);
        return response.data;
      } else {
        // Fallback to dummy data
        const dummyData = generateDummyConversionHistory(params?.limit || 10);
        setConversionHistory(dummyData);
        return dummyData;
      }
    } catch (err) {
      console.error('Failed to fetch conversion history:', err);
      setError('Failed to fetch conversion history');
      
      // Fallback to dummy data
      const dummyData = generateDummyConversionHistory(params?.limit || 10);
      setConversionHistory(dummyData);
      return dummyData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get conversion rates
  const getConversionRates = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await customerEventAnalyticsApi.getConversionRates(params);
      
      if (response.success) {
        setConversionRates(response.data);
        return response.data;
      } else {
        // Fallback to dummy data
        const dummyData = generateDummyConversionRates();
        setConversionRates(dummyData);
        return dummyData;
      }
    } catch (err) {
      console.error('Failed to fetch conversion rates:', err);
      setError('Failed to fetch conversion rates');
      
      // Fallback to dummy data
      const dummyData = generateDummyConversionRates();
      setConversionRates(dummyData);
      return dummyData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer events
  const getCustomerEvents = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await customerEventAnalyticsApi.getCustomerEvents(params);
      
      if (response.success) {
        setCustomerEvents(response.data);
        return response.data;
      } else {
        // Fallback to dummy data
        const dummyData = generateDummyCustomerEvents(params?.limit || 10);
        setCustomerEvents(dummyData);
        return dummyData;
      }
    } catch (err) {
      console.error('Failed to fetch customer events:', err);
      setError('Failed to fetch customer events');
      
      // Fallback to dummy data
      const dummyData = generateDummyCustomerEvents(params?.limit || 10);
      setCustomerEvents(dummyData);
      return dummyData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total unconverted customers count
  const getUnconvertedCustomersCount = useCallback(async () => {
    try {
      const customers = await getUnconvertedCustomers({ limit: 1000 }); // Get all to count
      return customers.length;
    } catch (err) {
      console.error('Failed to get unconverted customers count:', err);
      return 0;
    }
  }, [getUnconvertedCustomers]);

  // Get total customers count with events
  const getTotalCustomersWithEvents = useCallback(async () => {
    try {
      const analytics = await getConversionAnalytics();
      return analytics.totalCustomers;
    } catch (err) {
      console.error('Failed to get total customers count:', err);
      return 0;
    }
  }, [getConversionAnalytics]);

  // Get customers with events (customers that have event records)
  const getCustomersWithEvents = useCallback(async () => {
    try {
      const events = await getCustomerEvents();
      // Extract unique customer IDs from events
      const customerIds = new Set();
      events.forEach((event: CustomerEvent) => {
        if (event.metadata?.customerId) {
          customerIds.add(event.metadata.customerId);
        }
      });
      return Array.from(customerIds);
    } catch (err) {
      console.error('Failed to get customers with events:', err);
      return [];
    }
  }, [getCustomerEvents]);

  // Get count of customers with events
  const getCustomersWithEventsCount = useCallback(async () => {
    try {
      const customersWithEvents = await getCustomersWithEvents();
      return customersWithEvents.length;
    } catch (err) {
      console.error('Failed to get customers with events count:', err);
      return 0;
    }
  }, [getCustomersWithEvents]);

  return {
    loading,
    error,
    conversionAnalytics,
    conversionHistory,
    conversionRates,
    unconvertedCustomers,
    customerEvents,
    getUnconvertedCustomers,
    getConversionAnalytics,
    getConversionHistory,
    getConversionRates,
    getCustomerEvents,
    getUnconvertedCustomersCount,
    getTotalCustomersWithEvents,
    getCustomersWithEvents,
    getCustomersWithEventsCount
  };
}; 