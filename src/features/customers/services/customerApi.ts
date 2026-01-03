import secureApiService from '../../../services/secureApiService';

// Safe token wrapper - use localStorage for web, AsyncStorage for mobile
const getAuthToken = async (): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Web environment
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    } else {
      // React Native environment
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem('userToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    }
  } catch (error) {
    throw error;
  }
};

// Backend-compatible Customer interface based on Prisma schema
export interface BackendCustomer {
  id?: number;
  uuid?: string;
  serial_number?: string;
  name: string;
  purpose: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  mobile: string;
  email?: string;
  source: string;
  remark?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CONVERTED' | 'LOST' | 'CHURNED';
  department: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: Date;
  occupation?: string;
  company?: string;
  website?: string;
  social_media?: any;
  preferences?: any;
  tags?: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lead_score?: number;
  stage: 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'CHURNED';
  value?: number;
  last_contact?: Date;
  next_follow_up?: Date;
  total_interactions?: number;
  total_value?: number;
  conversion_date?: Date;
  assigned_to?: number;
  source_details?: any;
  metadata?: any;
  schoolId?: number;
  added_by?: number;
  refered_to?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: BackendCustomer | BackendCustomer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta?: any;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
  minValue?: number;
  maxValue?: number;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  include?: string;
}

// Customer API Service
class CustomerApiService {
  // Store last successful customers data
  private lastCustomers: BackendCustomer[] = [];

  // Get all customers with filters
  async getCustomers(filters?: CustomerFilters): Promise<CustomerResponse> {
    const token = await getAuthToken();
    try {
      const response = await secureApiService.getCustomers(filters);
      if (response.success) {
        this.lastCustomers = response.data;
        return response;
      } else {
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch customers');
    }
  }

  // Get customer by ID
  async getCustomerById(id: string, include?: string): Promise<CustomerResponse> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerById(id, include);
    return response;
  }

  // Create new customer
  async createCustomer(customerData: Partial<BackendCustomer>): Promise<CustomerResponse> {
    const token = await getAuthToken();
    const response = await secureApiService.createCustomer(customerData);
    return response;
  }

  // Update customer
  async updateCustomer(id: string, customerData: Partial<BackendCustomer>): Promise<CustomerResponse> {
    const token = await getAuthToken();
    const response = await secureApiService.updateCustomer(id, customerData);
    return response;
  }

  // Partial update customer
  async partialUpdateCustomer(id: string, customerData: Partial<BackendCustomer>): Promise<CustomerResponse> {
    const token = await getAuthToken();
    const response = await secureApiService.partialUpdateCustomer(id, customerData);
    return response;
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<CustomerResponse> {
    const token = await getAuthToken();
    const response = await secureApiService.deleteCustomer(id);
    return response;
  }

  // Get customer analytics
  async getCustomerAnalytics(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerAnalytics(customerId);
    return response;
  }

  // Get customer performance
  async getCustomerPerformance(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerPerformance(customerId);
    return response;
  }

  // Get customer documents
  async getCustomerDocuments(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerDocuments(customerId);
    return response;
  }

  // Upload customer document
  async uploadCustomerDocument(customerId: string, file: any, metadata: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.uploadCustomerDocument(customerId, file, metadata);
    return response;
  }

  // Get customer tasks
  async getCustomerTasks(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerTasks(customerId);
    return response;
  }

  // Create customer task
  async createCustomerTask(customerId: string, taskData: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.createCustomerTask(customerId, taskData);
    return response;
  }

  // Get customer automations
  async getCustomerAutomations(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerAutomations(customerId);
    return response;
  }

  // Create customer automation
  async createCustomerAutomation(customerId: string, automationData: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.createCustomerAutomation(customerId, automationData);
    return response;
  }

  // Get customer collaborations
  async getCustomerCollaborations(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerCollaborations(customerId);
    return response;
  }

  // Create customer collaboration
  async createCustomerCollaboration(customerId: string, collaborationData: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.createCustomerCollaboration(customerId, collaborationData);
    return response;
  }

  // Get analytics dashboard
  async getAnalyticsDashboard(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getAnalyticsDashboard();
    return response;
  }

  // Get analytics reports
  async getAnalyticsReports(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getAnalyticsReports();
    return response;
  }

  // Get analytics trends
  async getAnalyticsTrends(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getAnalyticsTrends();
    return response;
  }

  // Get forecasting analytics
  async getForecastingAnalytics(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getForecastingAnalytics();
    return response;
  }

  // Export analytics
  async exportAnalytics(filters?: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.exportAnalytics(filters);
    return response;
  }

  // Get automation templates
  async getAutomationTemplates(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getAutomationTemplates();
    return response;
  }

  // Get collaboration feed
  async getCollaborationFeed(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCollaborationFeed();
    return response;
  }

  // Get task dashboard
  async getTaskDashboard(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getTaskDashboard();
    return response;
  }

  // Get document analytics
  async getDocumentAnalytics(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getDocumentAnalytics();
    return response;
  }

  // ======================
  // SEARCH & FILTERS
  // ======================

  // Advanced search
  async advancedSearch(params: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.advancedSearch(params);
    return response;
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, limit?: number): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getSearchSuggestions(query, limit);
    return response;
  }

  // Get autocomplete
  async getAutocomplete(query: string, limit?: number): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getAutocomplete(query, limit);
    return response;
  }

  // Save search
  async saveSearch(searchData: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.saveSearch(searchData);
    return response;
  }

  // Get saved searches
  async getSavedSearches(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getSavedSearches();
    return response;
  }

  // Delete saved search
  async deleteSavedSearch(searchId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.deleteSavedSearch(searchId);
    return response;
  }

  // Get available filters
  async getAvailableFilters(): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getAvailableFilters();
    return response;
  }

  // Create custom filter
  async createCustomFilter(filterData: any): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.createCustomFilter(filterData);
    return response;
  }

  // Get customer suggestions (for autocomplete)
  async getCustomerSuggestions(query: string, limit?: number): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerSuggestions(query, limit);
    return response;
  }

  // Get customer ID suggestion
  async getCustomerIdSuggestion(pattern?: string, prefix?: string): Promise<any> {
    const token = await getAuthToken();
    const response = await secureApiService.getCustomerIdSuggestion(pattern, prefix);
    return response;
  }
}

export const customerApiService = new CustomerApiService();

// ======================
// ANALYTICS API - MATCHES BACKEND ROUTES
// ======================
export const analyticsApi = {
  // Main analytics dashboard
  getAnalyticsDashboard: (params?: any) => 
    secureApiService.getAnalyticsDashboard(params),
  
  // Analytics reports
  getAnalyticsReports: (params?: any) => 
    secureApiService.getAnalyticsReports(params),
  
  // Analytics trends
  getAnalyticsTrends: (params?: any) => 
    secureApiService.getAnalyticsTrends(params),
  
  // Forecasting analytics
  getForecastingAnalytics: (params?: any) => 
    secureApiService.getForecastingAnalytics(params),
  
  // Export analytics
  exportAnalytics: (data: any) => 
    secureApiService.exportAnalytics(data),
  
  // Per-customer analytics
  getCustomerAnalytics: (customerId: string, params?: any) => 
    secureApiService.getCustomerAnalytics(customerId, params),
  
  // Customer performance
  getCustomerPerformance: (customerId: string) => 
    secureApiService.getCustomerPerformance(customerId),
  
  // Engagement analytics
  getEngagementAnalytics: (customerId: string, params?: any) => 
    secureApiService.getEngagementAnalytics(customerId, params),
  
  // Conversion analytics
  getConversionAnalytics: (customerId: string, params?: any) => 
    secureApiService.getConversionAnalytics(customerId, params),
  
  // Lifetime value analytics
  getLifetimeValueAnalytics: (customerId: string, params?: any) => 
    secureApiService.getLifetimeValueAnalytics(customerId, params),
};

// ======================
// CUSTOMER DOCUMENTS API
// ======================
export const documentsApi = {
  // Get customer documents
  getCustomerDocuments: (customerId: string) => 
    secureApiService.getCustomerDocuments(customerId),
  
  // Upload document
  uploadDocument: (customerId: string, data: any) => 
    secureApiService.uploadCustomerDocument(customerId, data),
  
  // Get document analytics
  getDocumentAnalytics: () => 
    secureApiService.getDocumentAnalytics(),
};

// ======================
// CUSTOMER TASKS API
// ======================
export const tasksApi = {
  // Get customer tasks
  getCustomerTasks: (customerId: string, params?: any) => 
    secureApiService.getCustomerTasks(customerId, params),
  
  // Create task
  createTask: (customerId: string, data: any) => 
    secureApiService.createCustomerTask(customerId, data),
  
  // Get task dashboard
  getTaskDashboard: (params?: any) => 
    secureApiService.getTaskDashboard(params),
};

// ======================
// CUSTOMER AUTOMATIONS API
// ======================
export const automationsApi = {
  // Get customer automations
  getCustomerAutomations: (customerId: string) => 
    secureApiService.getCustomerAutomations(customerId),
  
  // Create automation
  createAutomation: (customerId: string, data: any) => 
    secureApiService.createCustomerAutomation(customerId, data),
  
  // Get automation templates
  getAutomationTemplates: () => 
    secureApiService.getAutomationTemplates(),
};

// ======================
// CUSTOMER COLLABORATIONS API
// ======================
export const collaborationsApi = {
  // Get customer collaborations
  getCustomerCollaborations: (customerId: string) => 
    secureApiService.getCustomerCollaborations(customerId),
  
  // Create collaboration
  createCollaboration: (customerId: string, data: any) => 
    secureApiService.createCustomerCollaboration(customerId, data),
  
  // Get collaboration feed
  getCollaborationFeed: () => 
    secureApiService.getCollaborationFeed(),
};

// ======================
// BULK OPERATIONS API - REMOVED (NOT IMPLEMENTED IN BACKEND)
// ======================
export const bulkApi = {
  // These endpoints are not implemented in the backend yet
  // bulkCreateCustomers: (data: any) => 
  //   apiService.post('/customers/bulk/create', data),
  
  // bulkUpdateCustomers: (data: any) => 
  //   apiService.post('/customers/bulk/update', data),
  
  // bulkDeleteCustomers: (data: any) => 
  //   apiService.post('/customers/bulk/delete', data),
};

// ======================
// IMPORT/EXPORT API - REMOVED (NOT IMPLEMENTED IN BACKEND)
// ======================
export const importExportApi = {
  // These endpoints are not implemented in the backend yet
  // exportCustomers: (params?: any) => 
  //   apiService.get('/customers/export', { params }),
  
  // importCustomers: (data: any) => 
  //   apiService.post('/customers/import', data),
};

// ======================
// CUSTOMER REPORTS API
// ======================
export const reportsApi = {
  // Get customer reports
  getCustomerReports: (params?: any) => 
    secureApiService.getCustomerReports(params),
  
  // Get customer comparisons
  getCustomerComparisons: (params?: any) => 
    secureApiService.getCustomerComparisons(params),
  
  // Get customer dashboard
  getCustomerDashboard: (customerId: string) => 
    secureApiService.getCustomerDashboard(customerId),
};

// ======================
// CUSTOMER SUGGESTIONS API
// ======================
export const suggestionsApi = {
  // Get customer suggestions
  getCustomerSuggestions: (params?: any) => 
    secureApiService.getCustomerSuggestions(params),
  
  // Get customer ID suggestion
  getCustomerIdSuggestion: (params?: any) => 
    secureApiService.getCustomerIdSuggestion(params),
};

// ======================
// CACHE MANAGEMENT API - REMOVED (NOT IMPLEMENTED IN BACKEND)
// ======================
export const cacheApi = {
  // These endpoints are not implemented in the backend yet
  // clearCache: (params?: any) => 
  //   apiService.post('/customers/cache/clear', params),
  
  // getCacheStats: () => 
  //   apiService.get('/customers/cache/stats'),
}; 
