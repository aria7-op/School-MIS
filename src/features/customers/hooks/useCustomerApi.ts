import { useState, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';

// ======================
// CUSTOMER INTERFACES
// ======================

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  type: string;
  totalSpent: number;
  orderCount: number;
  createdAt: string;
  lastActivity?: string;
  serialNumber?: string;
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  type?: string;
  minValue?: number;
  maxValue?: number;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: Customer[];
  pagination: CustomerPagination;
  meta?: any;
}

// ======================
// DUMMY DATA GENERATORS
// ======================

const generateDummyCustomers = (count = 10) => {
  const customers = [];
  for (let i = 1; i <= count; i++) {
    customers.push({
      id: i,
      firstName: `Customer${i}`,
      lastName: `Last${i}`,
      email: `customer${i}@example.com`,
      phone: `+1-555-${String(i).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
      address: `${i} Main Street, City, State ${String(i).padStart(5, '0')}`,
      status: i % 3 === 0 ? 'inactive' : 'active',
      type: i % 2 === 0 ? 'individual' : 'business',
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      totalSpent: Math.floor(Math.random() * 10000) + 100,
      orderCount: Math.floor(Math.random() * 50) + 1,
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  return customers;
};

const generateDummyCustomer = (id: number) => ({
  id,
  firstName: `Customer${id}`,
  lastName: `Last${id}`,
  email: `customer${id}@example.com`,
  phone: `+1-555-${String(id).padStart(3, '0')}-${String(id).padStart(4, '0')}`,
  address: `${id} Main Street, City, State ${String(id).padStart(5, '0')}`,
  status: 'active',
  type: 'individual',
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  totalSpent: Math.floor(Math.random() * 10000) + 100,
  orderCount: Math.floor(Math.random() * 50) + 1,
  lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  notes: `Sample notes for customer ${id}`,
  preferences: {
    communication: 'email',
    notifications: true,
    marketing: false
  }
});

const generateDummyDocuments = (customerId: number) => [
  {
    id: 1,
    customerId,
    name: 'Contract Agreement',
    type: 'contract',
    url: 'https://example.com/documents/contract.pdf',
    size: '2.5 MB',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 2,
    customerId,
    name: 'Invoice #12345',
    type: 'invoice',
    url: 'https://example.com/documents/invoice.pdf',
    size: '1.2 MB',
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const generateDummyTasks = (customerId: number) => [
  {
    id: 1,
    customerId,
    title: 'Follow up on order',
    description: 'Check if customer received their order',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'John Doe',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    customerId,
    title: 'Send thank you email',
    description: 'Send personalized thank you email',
    status: 'completed',
    priority: 'low',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Jane Smith',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const generateDummyAutomations = (customerId: number) => [
  {
    id: 1,
    customerId,
    name: 'Welcome Email',
    type: 'email',
    status: 'active',
    trigger: 'new_customer',
    lastTriggered: new Date().toISOString(),
    nextTrigger: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    customerId,
    name: 'Follow-up Reminder',
    type: 'reminder',
    status: 'active',
    trigger: 'inactive_30_days',
    lastTriggered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nextTrigger: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const generateDummyCollaborations = (customerId: number) => [
  {
    id: 1,
    customerId,
    type: 'note',
    content: 'Customer requested custom measurements',
    author: 'John Doe',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    customerId,
    type: 'task',
    content: 'Schedule fitting appointment',
    author: 'Jane Smith',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const generateDummyReports = () => ({
  customerGrowth: {
    total: 1247,
    new: 89,
    growth: 12.5
  },
  revenue: {
    total: 125000,
    average: 100.25,
    growth: 8.3
  },
  engagement: {
    active: 892,
    inactive: 234,
    retention: 79.2
  }
});

const generateDummySuggestions = (customerId: number) => [
  {
    id: 1,
    customerId,
    type: 'upsell',
    title: 'Premium Service',
    description: 'Consider offering premium tailoring services',
    priority: 'high',
    estimatedValue: 500
  },
  {
    id: 2,
    customerId,
    type: 'retention',
    title: 'Loyalty Program',
    description: 'Enroll customer in loyalty program',
    priority: 'medium',
    estimatedValue: 200
  }
];

const useCustomerApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pagination, setPagination] = useState<CustomerPagination | null>(null);
  const [usingDummyData, setUsingDummyData] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // ======================
  // CORE CUSTOMER OPERATIONS
  // ======================

  const getCustomers = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomers(params);
      
      if (!response) {
        setCustomers([]);
        setTotalCount(0);
        return { data: [], meta: { total: 0 } };
      }
      
      const customersData = response.data || response || [];
      setCustomers(customersData as any);
      setTotalCount(response.meta?.total || customersData.length || 0);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customers';
      setError(errorMessage);
      setCustomers([]);
      setTotalCount(0);
      return { data: [], meta: { total: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerById(id);
      const customer = response.data?.data || response.data;
      setSelectedCustomer(customer as any);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer';
      setError(errorMessage);

      // Fallback to dummy data
      const dummyData = generateDummyCustomer(parseInt(id));
      setSelectedCustomer(dummyData);
      setUsingDummyData(true);
      
      return { success: false, message: errorMessage, data: dummyData, isDummyData: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // Check if customerApiService is available
      if (!secureApiService) {
        
        throw new Error('Customer API service is not available. Please check the import.');
      }

      const response = await secureApiService.createCustomer(data);

      const newCustomer = response.data?.data || response.data;
      setCustomers(prev => [newCustomer as any, ...prev]);
      return response.data;
    } catch (err: any) {

      const errorMessage = err.response?.data?.message || err.message || 'Failed to create customer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.updateCustomer(id, data);
      const updatedCustomer = response.data?.data || response.data;
      setCustomers(prev => prev.map(c => c.id === parseInt(id) ? updatedCustomer as any : c));
      if (selectedCustomer?.id === parseInt(id)) {
        setSelectedCustomer(updatedCustomer as any);
      }
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update customer';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

  const partialUpdateCustomer = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.partialUpdateCustomer(id, data);
      const updatedCustomer = response.data?.data || response.data;
      setCustomers(prev => prev.map(c => c.id === parseInt(id) ? updatedCustomer as any : c));
      if (selectedCustomer?.id === parseInt(id)) {
        setSelectedCustomer(updatedCustomer as any);
      }
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update customer';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

  const deleteCustomer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== parseInt(id)));
      if (selectedCustomer?.id === parseInt(id)) {
        setSelectedCustomer(null);
      }
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete customer';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

  // ======================
  // ANALYTICS OPERATIONS
  // ======================

  const getAnalyticsDashboard = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getAnalyticsDashboard(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch analytics dashboard';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalyticsReports = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getAnalyticsReports(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch analytics reports';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalyticsTrends = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getAnalyticsTrends(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch analytics trends';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getForecastingAnalytics = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getForecastingAnalytics(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch forecasting analytics';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportAnalytics = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.exportAnalytics(data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export analytics';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // DOCUMENTS OPERATIONS
  // ======================

  const getCustomerDocuments = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerDocuments(customerId);
      if (response.data?.data) {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, documents: response.data.data } : c));
      } else {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, documents: response.data } : c));
      }
      setUsingDummyData(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer documents';
      setError(errorMessage);

      // Fallback to dummy data
      const dummyData = generateDummyDocuments(parseInt(customerId));
      setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, documents: dummyData } : c));
      setUsingDummyData(true);
      
      return { success: false, message: errorMessage, data: dummyData, isDummyData: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (customerId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.uploadDocument(customerId, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload document';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getDocumentAnalytics();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch document analytics';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // TASKS OPERATIONS
  // ======================

  const getCustomerTasks = useCallback(async (customerId: string, params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerTasks(customerId, params);
      if (response.data?.data) {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, tasks: response.data.data } : c));
      } else {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, tasks: response.data } : c));
      }
      setUsingDummyData(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer tasks';
      setError(errorMessage);

      // Fallback to dummy data
      const dummyData = generateDummyTasks(parseInt(customerId));
      setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, tasks: dummyData } : c));
      setUsingDummyData(true);
      
      return { success: false, message: errorMessage, data: dummyData, isDummyData: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (customerId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.createTask(customerId, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskDashboard = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getTaskDashboard(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch task dashboard';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // AUTOMATIONS OPERATIONS
  // ======================

  const getCustomerAutomations = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerAutomations(customerId);
      if (response.data?.data) {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, automations: response.data.data } : c));
      } else {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, automations: response.data } : c));
      }
      setUsingDummyData(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer automations';
      setError(errorMessage);

      // Fallback to dummy data
      const dummyData = generateDummyAutomations(parseInt(customerId));
      setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, automations: dummyData } : c));
      setUsingDummyData(true);
      
      return { success: false, message: errorMessage, data: dummyData, isDummyData: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const createAutomation = useCallback(async (customerId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.createAutomation(customerId, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create automation';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAutomationTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getAutomationTemplates();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch automation templates';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // COLLABORATIONS OPERATIONS
  // ======================

  const getCustomerCollaborations = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerCollaborations(customerId);
      if (response.data?.data) {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, collaborations: response.data.data } : c));
      } else {
        setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, collaborations: response.data } : c));
      }
      setUsingDummyData(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer collaborations';
      setError(errorMessage);

      // Fallback to dummy data
      const dummyData = generateDummyCollaborations(parseInt(customerId));
      setCustomers(prev => prev.map(c => c.id === parseInt(customerId) ? { ...c, collaborations: dummyData } : c));
      setUsingDummyData(true);
      
      return { success: false, message: errorMessage, data: dummyData, isDummyData: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollaboration = useCallback(async (customerId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.createCollaboration(customerId, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create collaboration';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCollaborationFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCollaborationFeed();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch collaboration feed';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // BULK OPERATIONS - NOT IMPLEMENTED IN BACKEND
  // ======================

  const bulkCreateCustomers = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Bulk create customers is not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Bulk create customers is not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateCustomers = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Bulk update customers is not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Bulk update customers is not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteCustomers = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Bulk delete customers is not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Bulk delete customers is not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // IMPORT/EXPORT OPERATIONS - NOT IMPLEMENTED IN BACKEND
  // ======================

  const exportCustomers = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Export customers is not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Export customers is not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importCustomers = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Import customers is not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Import customers is not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // REPORTS OPERATIONS
  // ======================

  const getCustomerReports = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerReports(params);
      if (response.data?.data) {
        setCustomers(prev => prev.map(c => c.id === parseInt(response.data.data[0].customerId) ? { ...c, reports: response.data.data } : c));
      } else {
        setCustomers(prev => prev.map(c => c.id === parseInt(response.data.customerId) ? { ...c, reports: response.data } : c));
      }
      setUsingDummyData(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer reports';
      setError(errorMessage);

      // Fallback to dummy data
      const dummyData = generateDummyReports();
      setUsingDummyData(true);
      
      return { success: false, message: errorMessage, data: dummyData, isDummyData: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerComparisons = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerComparisons(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer comparisons';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerDashboard = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerDashboard(customerId);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer dashboard';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // SUGGESTIONS OPERATIONS
  // ======================

  const getCustomerSuggestions = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerSuggestions(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer suggestions';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCustomerIdSuggestion = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.getCustomerIdSuggestion(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer ID suggestion';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // CACHE OPERATIONS - NOT IMPLEMENTED IN BACKEND
  // ======================

  const clearCache = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Cache operations are not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Cache operations are not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCacheStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // This endpoint is not implemented in the backend yet
      throw new Error('Cache operations are not implemented in the backend yet');
    } catch (err: any) {
      const errorMessage = err.message || 'Cache operations are not implemented';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // SEARCH & FILTERS
  // ======================

  const advancedSearch = useCallback(async (params: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureApiService.advancedSearch(params);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to perform advanced search';
      setError(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSearchSuggestions = useCallback(async (query: string, limit?: number) => {
    try {
      const response = await secureApiService.getSearchSuggestions(query, limit);
      return response.data;
    } catch (err: any) {
      
      return [];
    }
  }, []);

  const getAutocomplete = useCallback(async (query: string, limit?: number) => {
    try {
      const response = await secureApiService.getAutocomplete(query, limit);
      return response.data;
    } catch (err: any) {
      
      return [];
    }
  }, []);

  const saveSearch = useCallback(async (searchData: any) => {
    try {
      const response = await secureApiService.saveSearch(searchData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save search';
      setError(errorMessage);
      
      throw err;
    }
  }, []);

  const getSavedSearches = useCallback(async () => {
    try {
      const response = await secureApiService.getSavedSearches();
      return response.data;
    } catch (err: any) {
      
      return [];
    }
  }, []);

  const deleteSavedSearch = useCallback(async (searchId: string) => {
    try {
      const response = await secureApiService.deleteSavedSearch(searchId);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete saved search';
      setError(errorMessage);
      
      throw err;
    }
  }, []);

  const getAvailableFilters = useCallback(async () => {
    try {
      const response = await secureApiService.getAvailableFilters();
      return response.data;
    } catch (err: any) {
      
      return [];
    }
  }, []);

  const createCustomFilter = useCallback(async (filterData: any) => {
    try {
      const response = await secureApiService.createCustomFilter(filterData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create custom filter';
      setError(errorMessage);
      
      throw err;
    }
  }, []);

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setCustomers([]);
    setSelectedCustomer(null);
    setPagination(null);
    setError(null);
    setUsingDummyData(false);
  }, []);

  const getUnconvertedCustomers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/unconverted?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        return {
          customers: data.data || [],
          total: data.pagination?.total || 0,
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || limit,
          totalPages: data.pagination?.pages || 1,
        };
      } else {
        // setError(data.message || 'Failed to fetch unconverted customers');
        return {
          customers: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      }
    } catch (err) {
      // setError('Failed to fetch unconverted customers');
      return {
        customers: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Conversion Analytics
  const getConversionAnalytics = useCallback(async (period = '30d') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/conversion-analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        return data.data || data;
      } else {
        // setError('Failed to fetch conversion analytics');
        return null;
      }
    } catch (err) {
      // setError('Failed to fetch conversion analytics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Conversion History
  const getConversionHistory = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/conversion-history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        return {
          conversions: data.data || [],
          total: data.pagination?.total || 0,
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || limit,
          totalPages: data.pagination?.pages || 1,
        };
      } else {
        setError(data.message || 'Failed to fetch conversion history');
        return {
          conversions: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      }
    } catch (err) {
      setError('Failed to fetch conversion history');
      return {
        conversions: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Converted Students
  const getConvertedStudents = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/converted?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        return {
          students: data.data || [],
          total: data.pagination?.total || 0,
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || limit,
          totalPages: data.pagination?.pages || 1,
        };
      } else {
        // setError('Failed to fetch converted students');
        return {
          students: [],
          total: 0,
          page,
          limit,
          totalPages: 1,
        };
      }
    } catch (err) {
      // setError('Failed to fetch converted students');
      return {
        students: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    customers,
    selectedCustomer,
    pagination,
    usingDummyData,
    totalCount,

    // Core customer operations
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    partialUpdateCustomer,
    deleteCustomer,

    // Analytics operations
    getAnalyticsDashboard,
    getAnalyticsReports,
    getAnalyticsTrends,
    getForecastingAnalytics,
    exportAnalytics,

    // Documents operations
    getCustomerDocuments,
    uploadDocument,
    getDocumentAnalytics,

    // Tasks operations
    getCustomerTasks,
    createTask,
    getTaskDashboard,

    // Automations operations
    getCustomerAutomations,
    createAutomation,
    getAutomationTemplates,

    // Collaborations operations
    getCustomerCollaborations,
    createCollaboration,
    getCollaborationFeed,

    // Bulk operations
    bulkCreateCustomers,
    bulkUpdateCustomers,
    bulkDeleteCustomers,

    // Import/Export operations
    exportCustomers,
    importCustomers,

    // Reports operations
    getCustomerReports,
    getCustomerComparisons,
    getCustomerDashboard,

    // Suggestions operations
    getCustomerSuggestions,
    getCustomerIdSuggestion,

    // Cache operations
    clearCache,
    getCacheStats,

    // Search & Filters
    advancedSearch,
    getSearchSuggestions,
    getAutocomplete,
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    getAvailableFilters,
    createCustomFilter,
    getUnconvertedCustomers,
    getConversionAnalytics,
    getConversionHistory,
    getConvertedStudents,

    // Utility functions
    clearError,
    resetState,
  };
};

export default useCustomerApi; 
