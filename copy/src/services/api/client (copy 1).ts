// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'https://khwanzay.school/api';

// Create interface for your API client
interface ApiClient extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// Create axios instance with proper typing
const apiClient: ApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Safe AsyncStorage wrapper
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Check if we're in a web environment
    if (typeof window !== 'undefined' && window.localStorage) {
      // Prioritize userToken since that's where the token is actually stored
      const token = localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken') || 
                   localStorage.getItem('token');
      // return token;
    }
    // For React Native, use AsyncStorage
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.default.getItem('userToken');
  } catch (error) {
    // console.warn('Token storage not available:', error);
    return null;
  }
};

const removeAuthToken = async (): Promise<void> => {
  try {
    // Check if we're in a web environment
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      // } else {
      // For React Native, use AsyncStorage
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem('userToken');
    }
  } catch (error) {
    // console.warn('Token storage not available:', error);
  }
};

const setAuthToken = async (token: string): Promise<void> => {
  try {
    // Check if we're in a web environment
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userToken', token);
      localStorage.setItem('token', token);
      // } else {
      // For React Native, use AsyncStorage
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.setItem('userToken', token);
    }
  } catch (error) {
    // console.warn('Token storage not available:', error);
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        // + '...');
        
        // Add debugging for specific endpoints that are failing
        if (config.url && (config.url.includes('/customers') || config.url.includes('/classes') || config.url.includes('/assignments') || config.url.includes('/effective'))) {
          // // // );
          // }
      } else {
        // if (config.url && (config.url.includes('/customers') || config.url.includes('/classes') || config.url.includes('/assignments') || config.url.includes('/effective'))) {
          // // Additional debugging to see what's in localStorage
          if (typeof window !== 'undefined' && window.localStorage) {
            const authToken = localStorage.getItem('authToken');
            const userToken = localStorage.getItem('userToken');
            
            if (userToken) {
              // Token found, can be used for authentication
              console.log('User token found');
            }
          }
        }
      }
    } catch (error) {
      // Continue without token if there's an error
      console.error('Error accessing localStorage:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    // return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if the response contains an error message even with 200 status
    if (response.data && typeof response.data === 'object' && 'success' in response.data && !response.data.success) {
      const errorMessage = response.data.error || response.data.message || 'Request failed';
      return Promise.reject({
        message: errorMessage,
        status: response.status,
        data: response.data,
      });
    }
    return response.data; // Return only the data part of the response
  },
  async (error: AxiosError) => {
    // Enhanced error handling with specific network error detection
    let errorMessage = 'An unexpected error occurred';
    let isNetworkError = false;
    let shouldLogout = false;

    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout - server is not responding';
      isNetworkError = true;
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error - unable to connect to server';
      isNetworkError = true;
    } else if (error.code === 'ERR_BAD_OPTION') {
      errorMessage = 'Invalid request configuration';
    } else if (error.code === 'ERR_BAD_RESPONSE') {
      errorMessage = 'Invalid server response';
    } else if (error.code === 'ERR_BAD_REQUEST') {
      errorMessage = 'Bad request - check your input';
    } else if (error.response?.status === 0) {
      errorMessage = 'Server is not accessible - check if backend is running';
      isNetworkError = true;
    } else if (error.response?.status === 401) {
      errorMessage = 'Unauthorized - please login again';
      shouldLogout = true;
      // Handle unauthorized access
      try {
        await removeAuthToken();
        // Dispatch session expired event for web
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
      } catch (storageError) {
        
      }
    } else if (error.response?.status === 403) {
      errorMessage = 'Forbidden - insufficient permissions or account inactive';
      shouldLogout = true;
      // Handle forbidden access (inactive account)
      try {
        await removeAuthToken();
        // Dispatch session expired event for web
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
      } catch (storageError) {
        
      }
    } else if (error.response?.status === 404) {
      errorMessage = 'Resource not found';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error - please try again later';
    } else if (error.response?.status) {
      errorMessage = `HTTP ${error.response.status} - ${error.response.statusText}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Enhanced logging for debugging

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError,
      shouldLogout,
      code: error.code,
    });
  }
);

// ======================
// STAFF API FUNCTIONS
// ======================

// Core Staff CRUD Operations
export const staffApi = {
  // Get all staff with filters
  getStaff: (params?: any) => apiClient.get('/staff', { params }),
  
  // Get staff by ID
  getStaffById: (id: string, params?: any) => apiClient.get(`/staff/${id}`, { params }),
  
  // Create new staff
  createStaff: (data: any) => apiClient.post('/staff', data),
  
  // Update staff
  updateStaff: (id: string, data: any) => apiClient.put(`/staff/${id}`, data),
  
  // Delete staff
  deleteStaff: (id: string) => apiClient.delete(`/staff/${id}`),
  
  // Restore staff
  restoreStaff: (id: string) => apiClient.patch(`/staff/${id}/restore`),
  
  // Get staff stats
  getStaffStats: (id: string) => apiClient.get(`/staff/${id}/stats`),
  
  // Get staff analytics
  getStaffAnalytics: (id: string, params?: any) => apiClient.get(`/staff/${id}/analytics`, { params }),
  
  // Get staff performance
  getStaffPerformance: (id: string) => apiClient.get(`/staff/${id}/performance`),
  
  // Get staff dashboard
  getStaffDashboard: (id: string) => apiClient.get(`/staff/${id}/dashboard`),
  
  // Get staff by school
  getStaffBySchool: (schoolId: string, params?: any) => apiClient.get(`/staff/school/${schoolId}`, { params }),
  
  // Get staff by department
  getStaffByDepartment: (departmentId: string, params?: any) => apiClient.get(`/staff/department/${departmentId}`, { params }),
  
  // Get staff count by department
  getStaffCountByDepartment: (params?: any) => apiClient.get('/staff/stats/department', { params }),
  
  // Get staff count by designation
  getStaffCountByDesignation: (params?: any) => apiClient.get('/staff/stats/designation', { params }),
  
  // Search staff
  searchStaff: (params?: any) => apiClient.get('/staff/search/advanced', { params }),
  
  // Export staff
  exportStaff: (params?: any) => apiClient.get('/staff/export', { params }),
  
  // Import staff
  importStaff: (data: any) => apiClient.post('/staff/import', data),
  
  // Bulk operations
  bulkCreateStaff: (data: any) => apiClient.post('/staff/bulk/create', data),
  bulkUpdateStaff: (data: any) => apiClient.put('/staff/bulk/update', data),
  bulkDeleteStaff: (data: any) => apiClient.delete('/staff/bulk/delete', { data }),
  
  // Employee ID suggestions
  getEmployeeIdSuggestions: (params?: any) => apiClient.get('/staff/suggestions/employee-id', { params }),
  
  // Staff report
  getStaffReport: (params?: any) => apiClient.get('/staff/report', { params }),
  
  // Staff comparison
  getStaffComparison: (params?: any) => apiClient.get('/staff/comparison', { params }),
  
  // Cache management
  getCacheStats: () => apiClient.get('/staff/cache/stats'),
  warmCache: (data: any) => apiClient.post('/staff/cache/warm', data),
  clearCache: (params?: any) => apiClient.delete('/staff/cache/clear', { params }),
  
  // Collaboration
  getStaffCollaboration: (staffId: string) => apiClient.get(`/staff/${staffId}/collaboration`),
  createStaffCollaboration: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/collaboration`, data),
  updateStaffCollaboration: (staffId: string, collaborationId: string, data: any) => apiClient.put(`/staff/${staffId}/collaboration/${collaborationId}`, data),
  deleteStaffCollaboration: (staffId: string, collaborationId: string) => apiClient.delete(`/staff/${staffId}/collaboration/${collaborationId}`),
  getStaffProjects: (staffId: string) => apiClient.get(`/staff/${staffId}/collaboration/projects`),
  createStaffProject: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/collaboration/projects`, data),
  getStaffTeams: (staffId: string) => apiClient.get(`/staff/${staffId}/collaboration/teams`),
  assignStaffToTeam: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/collaboration/teams`, data),
  getStaffMeetings: (staffId: string) => apiClient.get(`/staff/${staffId}/collaboration/meetings`),
  scheduleStaffMeeting: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/collaboration/meetings`, data),
  
  // Documents
  getStaffDocuments: (staffId: string) => apiClient.get(`/staff/${staffId}/documents`),
  uploadStaffDocument: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/documents`, data),
  getStaffDocument: (staffId: string, documentId: string) => apiClient.get(`/staff/${staffId}/documents/${documentId}`),
  updateStaffDocument: (staffId: string, documentId: string, data: any) => apiClient.put(`/staff/${staffId}/documents/${documentId}`, data),
  deleteStaffDocument: (staffId: string, documentId: string) => apiClient.delete(`/staff/${staffId}/documents/${documentId}`),
  getDocumentCategories: (staffId: string) => apiClient.get(`/staff/${staffId}/documents/categories`),
  createDocumentCategory: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/documents/categories`, data),
  searchStaffDocuments: (staffId: string, params?: any) => apiClient.get(`/staff/${staffId}/documents/search`, { params }),
  verifyStaffDocument: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/documents/verify`, data),
  getExpiringDocuments: (staffId: string) => apiClient.get(`/staff/${staffId}/documents/expiring`),
  
  // Tasks
  getStaffTasks: (staffId: string) => apiClient.get(`/staff/${staffId}/tasks`),
  createStaffTask: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/tasks`, data),
  getStaffTask: (staffId: string, taskId: string) => apiClient.get(`/staff/${staffId}/tasks/${taskId}`),
  updateStaffTask: (staffId: string, taskId: string, data: any) => apiClient.put(`/staff/${staffId}/tasks/${taskId}`, data),
  deleteStaffTask: (staffId: string, taskId: string) => apiClient.delete(`/staff/${staffId}/tasks/${taskId}`),
  assignStaffTask: (staffId: string, taskId: string, data: any) => apiClient.post(`/staff/${staffId}/tasks/${taskId}/assign`, data),
  completeStaffTask: (staffId: string, taskId: string) => apiClient.post(`/staff/${staffId}/tasks/${taskId}/complete`),
  getOverdueTasks: (staffId: string) => apiClient.get(`/staff/${staffId}/tasks/overdue`),
  getCompletedTasks: (staffId: string) => apiClient.get(`/staff/${staffId}/tasks/completed`),
  getTaskStatistics: (staffId: string) => apiClient.get(`/staff/${staffId}/tasks/statistics`),
  bulkAssignTasks: (staffId: string, data: any) => apiClient.post(`/staff/${staffId}/tasks/bulk-assign`, data),
};

// ======================
// STUDENTS API FUNCTIONS
// ======================

// Core Students CRUD Operations
export const studentsApi = {
  // Get all students with filters
  getStudents: (params?: any) => apiClient.get('/students', { params }),
  
  // Get student by ID
  getStudentById: (id: string, params?: any) => apiClient.get(`/students/${id}`, { params }),
  
  // Create new student
  createStudent: (data: any) => apiClient.post('/students', data),
  
  // Update student
  updateStudent: (id: string, data: any) => apiClient.put(`/students/${id}`, data),
  
  // Delete student
  deleteStudent: (id: string) => apiClient.delete(`/students/${id}`),
  
  // Get student stats
  getStudentStats: (id: string) => apiClient.get(`/students/${id}/stats`),
  
  // Get student analytics
  getStudentAnalytics: (id: string, params?: any) => apiClient.get(`/students/${id}/analytics`, { params }),
  
  // Get student performance
  getStudentPerformance: (id: string) => apiClient.get(`/students/${id}/performance`),
  
  // Get student dashboard
  getStudentDashboard: (id: string) => apiClient.get(`/students/${id}/dashboard`),
  
  // Get students by class
  getStudentsByClass: (classId: string, params?: any) => apiClient.get(`/students/class/${classId}`, { params }),
  
  // Get students by school
  getStudentsBySchool: (schoolId: string, params?: any) => apiClient.get(`/students/school/${schoolId}`, { params }),
  
  // Get student count by class
  getStudentCountByClass: (params?: any) => apiClient.get('/students/stats/class', { params }),
  
  // Get student count by status
  getStudentCountByStatus: (params?: any) => apiClient.get('/students/stats/status', { params }),
  
  // Search students
  searchStudents: (params?: any) => apiClient.get('/students/search', { params }),
  
  // Export students
  exportStudents: (params?: any) => apiClient.get('/students/export', { params }),
  
  // Import students
  importStudents: (data: any) => apiClient.post('/students/import', data),
  
  // Bulk operations
  bulkCreateStudents: (data: any) => apiClient.post('/students/bulk/create', data),
  bulkUpdateStudents: (data: any) => apiClient.put('/students/bulk/update', data),
  bulkDeleteStudents: (data: any) => apiClient.delete('/students/bulk/delete', { data }),
};

// ======================
// CUSTOMER API FUNCTIONS
// ======================

// Core Customer CRUD Operations
export const customerApi = {
  // Get all customers with filters
  getCustomers: (params?: any) => apiClient.get('/customers', { params }),
  
  // Get customer by ID
  getCustomerById: (id: string, params?: any) => apiClient.get(`/customers/${id}`, { params }),
  
  // Create new customer
  createCustomer: (data: any) => apiClient.post('/customers', data),
  
  // Update customer
  updateCustomer: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
  
  // Partial update customer
  partialUpdateCustomer: (id: string, data: any) => apiClient.patch(`/customers/${id}`, data),
  
  // Delete customer
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),
};

// Customer Analytics
export const customerAnalyticsApi = {
  // Get analytics dashboard
  getAnalyticsDashboard: () => apiClient.get('/customers/analytics/dashboard'),
  
  // Get pipeline analytics (the endpoint you want)
  getPipelineAnalytics: () => apiClient.get('/customers/pipeline/analytics'),
  
  // Get analytics reports
  getAnalyticsReports: (params?: any) => apiClient.get('/customers/analytics/reports', { params }),
  
  // Get analytics trends
  getAnalyticsTrends: (params?: any) => apiClient.get('/customers/analytics/trends', { params }),
  
  // Get forecasting analytics
  getForecastingAnalytics: (params?: any) => apiClient.get('/customers/analytics/forecasting', { params }),
  
  // Export analytics
  exportAnalytics: (data: any) => apiClient.post('/customers/analytics/export', data),
  
  // Per customer analytics
  getCustomerAnalytics: (id: string) => apiClient.get(`/customers/${id}/analytics`),
  getCustomerPerformance: (id: string) => apiClient.get(`/customers/${id}/analytics/performance`),
  getCustomerEngagement: (id: string) => apiClient.get(`/customers/${id}/analytics/engagement`),
  getCustomerConversion: (id: string) => apiClient.get(`/customers/${id}/analytics/conversion`),
  getCustomerLifetimeValue: (id: string) => apiClient.get(`/customers/${id}/analytics/lifetime-value`),
};

// Customer Interactions
export const customerInteractionsApi = {
  // Get customer interactions
  getCustomerInteractions: (id: string) => apiClient.get(`/customers/${id}/interactions`),
  
  // Create interaction
  createInteraction: (id: string, data: any) => apiClient.post(`/customers/${id}/interactions`, data),
  
  // Get specific interaction
  getInteractionById: (id: string, interactionId: string) => apiClient.get(`/customers/${id}/interactions/${interactionId}`),
  
  // Update interaction
  updateInteraction: (id: string, interactionId: string, data: any) => apiClient.put(`/customers/${id}/interactions/${interactionId}`, data),
  
  // Delete interaction
  deleteInteraction: (id: string, interactionId: string) => apiClient.delete(`/customers/${id}/interactions/${interactionId}`),
  
  // Get interaction analytics
  getInteractionAnalytics: () => apiClient.get('/customers/interactions/analytics'),
  
  // Get interaction timeline
  getInteractionTimeline: () => apiClient.get('/customers/interactions/timeline'),
  
  // Bulk create interactions
  bulkCreateInteractions: (data: any) => apiClient.post('/customers/interactions/bulk', data),
};

// Customer Documents
export const customerDocumentsApi = {
  // Get customer documents
  getCustomerDocuments: (id: string) => apiClient.get(`/customers/${id}/documents`),
  
  // Upload document
  uploadDocument: (id: string, data: any) => apiClient.post(`/customers/${id}/documents`, data),
  
  // Get document analytics
  getDocumentAnalytics: () => apiClient.get('/customers/documents/analytics'),
};

// Customer Tickets
export const customerTicketsApi = {
  // Get customer tickets
  getCustomerTickets: (id: string) => apiClient.get(`/customers/${id}/tickets`),
  
  // Create ticket
  createTicket: (id: string, data: any) => apiClient.post(`/customers/${id}/tickets`, data),
  
  // Get specific ticket
  getTicketById: (id: string, ticketId: string) => apiClient.get(`/customers/${id}/tickets/${ticketId}`),
  
  // Update ticket
  updateTicket: (id: string, ticketId: string, data: any) => apiClient.put(`/customers/${id}/tickets/${ticketId}`, data),
  
  // Delete ticket
  deleteTicket: (id: string, ticketId: string) => apiClient.delete(`/customers/${id}/tickets/${ticketId}`),
  
  // Assign ticket
  assignTicket: (id: string, ticketId: string, data: any) => apiClient.post(`/customers/${id}/tickets/${ticketId}/assign`, data),
  
  // Resolve ticket
  resolveTicket: (id: string, ticketId: string) => apiClient.post(`/customers/${id}/tickets/${ticketId}/resolve`),
  
  // Escalate ticket
  escalateTicket: (id: string, ticketId: string) => apiClient.post(`/customers/${id}/tickets/${ticketId}/escalate`),
  
  // Get ticket dashboard
  getTicketDashboard: () => apiClient.get('/customers/tickets/dashboard'),
  
  // Get ticket analytics
  getTicketAnalytics: () => apiClient.get('/customers/tickets/analytics'),
  
  // Get SLA analytics
  getSLAAnalytics: () => apiClient.get('/customers/tickets/sla'),
};

// Customer Tasks
export const customerTasksApi = {
  // Get customer tasks
  getCustomerTasks: (id: string) => apiClient.get(`/customers/${id}/tasks`),
  
  // Create task
  createTask: (id: string, data: any) => apiClient.post(`/customers/${id}/tasks`, data),
  
  // Get task dashboard
  getTaskDashboard: () => apiClient.get('/customers/tasks/dashboard'),
};

// Customer Automations
export const customerAutomationsApi = {
  // Get customer automations
  getCustomerAutomations: (id: string) => apiClient.get(`/customers/${id}/automations`),
  
  // Create automation
  createAutomation: (id: string, data: any) => apiClient.post(`/customers/${id}/automations`, data),
  
  // Get automation templates
  getAutomationTemplates: () => apiClient.get('/customers/automations/templates'),
};

// Customer Collaborations
export const customerCollaborationsApi = {
  // Get customer collaborations
  getCustomerCollaborations: (id: string) => apiClient.get(`/customers/${id}/collaborations`),
  
  // Create collaboration
  createCollaboration: (id: string, data: any) => apiClient.post(`/customers/${id}/collaborations`, data),
  
  // Get collaboration feed
  getCollaborationFeed: () => apiClient.get('/customers/collaborations/feed'),
};

// Customer Segments
export const customerSegmentsApi = {
  // Get all segments
  getSegments: () => apiClient.get('/customers/segments'),
  
  // Create segment
  createSegment: (data: any) => apiClient.post('/customers/segments', data),
  
  // Get segment by ID
  getSegmentById: (segmentId: string) => apiClient.get(`/customers/segments/${segmentId}`),
  
  // Update segment
  updateSegment: (segmentId: string, data: any) => apiClient.put(`/customers/segments/${segmentId}`, data),
  
  // Delete segment
  deleteSegment: (segmentId: string) => apiClient.delete(`/customers/segments/${segmentId}`),
  
  // Get customers in segment
  getCustomersInSegment: (segmentId: string) => apiClient.get(`/customers/segments/${segmentId}/customers`),
  
  // Add customer to segment
  addCustomerToSegment: (segmentId: string, data: any) => apiClient.post(`/customers/segments/${segmentId}/customers`, data),
  
  // Remove customer from segment
  removeCustomerFromSegment: (segmentId: string, customerId: string) => apiClient.delete(`/customers/segments/${segmentId}/customers/${customerId}`),
  
  // Get segment analytics
  getSegmentAnalytics: () => apiClient.get('/customers/segments/analytics'),
  
  // Auto segment customers
  autoSegmentCustomers: (data: any) => apiClient.post('/customers/segments/auto-segment', data),
};

// Customer Pipeline
export const customerPipelineApi = {
  // Get pipeline
  getPipeline: () => apiClient.get('/customers/pipeline'),
  
  // Get pipeline stages
  getPipelineStages: () => apiClient.get('/customers/pipeline/stages'),
  
  // Get customers by stage
  getCustomersByStage: (stageId: string) => apiClient.get(`/customers/pipeline/${stageId}`),
  
  // Move customer to stage
  moveCustomerToStage: (stageId: string, data: any) => apiClient.post(`/customers/pipeline/${stageId}/move`, data),
  
  // Get pipeline analytics
  getPipelineAnalytics: () => apiClient.get('/customers/pipeline/analytics'),
  
  // Get pipeline forecast
  getPipelineForecast: () => apiClient.get('/customers/pipeline/forecast'),
  
  // Create pipeline stage
  createPipelineStage: (data: any) => apiClient.post('/customers/pipeline/stages', data),
  
  // Update pipeline stage
  updatePipelineStage: (stageId: string, data: any) => apiClient.put(`/customers/pipeline/stages/${stageId}`, data),
  
  // Delete pipeline stage
  deletePipelineStage: (stageId: string) => apiClient.delete(`/customers/pipeline/stages/${stageId}`),
};

// Customer Bulk Operations
export const customerBulkApi = {
  // Bulk create customers
  bulkCreateCustomers: (data: any) => apiClient.post('/customers/bulk/create', data),
  
  // Bulk update customers
  bulkUpdateCustomers: (data: any) => apiClient.post('/customers/bulk/update', data),
  
  // Bulk delete customers
  bulkDeleteCustomers: (data: any) => apiClient.post('/customers/bulk/delete', data),
  
  // Bulk import customers
  bulkImportCustomers: (data: any) => apiClient.post('/customers/bulk/import', data),
  
  // Bulk export customers
  bulkExportCustomers: (data: any) => apiClient.post('/customers/bulk/export', data),
  
  // Bulk merge customers
  bulkMergeCustomers: (data: any) => apiClient.post('/customers/bulk/merge', data),
  
  // Bulk duplicate customers
  bulkDuplicateCustomers: (data: any) => apiClient.post('/customers/bulk/duplicate', data),
  
  // Bulk assign customers
  bulkAssignCustomers: (data: any) => apiClient.post('/customers/bulk/assign', data),
  
  // Bulk tag customers
  bulkTagCustomers: (data: any) => apiClient.post('/customers/bulk/tag', data),
  
  // Get bulk job status
  getBulkJobStatus: (jobId: string) => apiClient.get(`/customers/bulk/status/${jobId}`),
};

// Customer Import/Export
export const customerImportExportApi = {
  // Export customers
  exportCustomers: (params?: any) => apiClient.get('/customers/export', { params }),
  
  // Import customers
  importCustomers: (data: any) => apiClient.post('/customers/import', data),
  
  // Get import templates
  getImportTemplates: () => apiClient.get('/customers/import/templates'),
  
  // Validate import
  validateImport: (data: any) => apiClient.post('/customers/import/validate', data),
  
  // Get import status
  getImportStatus: (jobId: string) => apiClient.get(`/customers/import/status/${jobId}`),
  
  // Get export formats
  getExportFormats: () => apiClient.get('/customers/export/formats'),
  
  // Schedule export
  scheduleExport: (data: any) => apiClient.post('/customers/export/schedule', data),
};

// Customer Search
export const customerSearchApi = {
  // Advanced search
  advancedSearch: (params?: any) => apiClient.get('/customers/search/advanced', { params }),
  
  // Get search suggestions
  getSearchSuggestions: (params?: any) => apiClient.get('/customers/search/suggestions', { params }),
  
  // Get autocomplete
  getAutocomplete: (params?: any) => apiClient.get('/customers/search/autocomplete', { params }),
  
  // Save search
  saveSearch: (data: any) => apiClient.post('/customers/search/save', data),
  
  // Get saved searches
  getSavedSearches: () => apiClient.get('/customers/search/saved'),
  
  // Delete saved search
  deleteSavedSearch: (searchId: string) => apiClient.delete(`/customers/search/saved/${searchId}`),
  
  // Get available filters
  getAvailableFilters: () => apiClient.get('/customers/filters'),
  
  // Create custom filter
  createCustomFilter: (data: any) => apiClient.post('/customers/filters/custom', data),
};

// Customer Cache Management
export const customerCacheApi = {
  // Get cache stats
  getCacheStats: () => apiClient.get('/customers/cache/stats'),
  
  // Clear cache
  clearCache: () => apiClient.post('/customers/cache/clear'),
  
  // Warm cache
  warmCache: (data: any) => apiClient.post('/customers/cache/warm', data),
  
  // Get cache keys
  getCacheKeys: () => apiClient.get('/customers/cache/keys'),
  
  // Delete cache keys
  deleteCacheKeys: (pattern: string) => apiClient.delete(`/customers/cache/keys/${pattern}`),
  
  // Optimize cache
  optimizeCache: () => apiClient.post('/customers/cache/optimize'),
};

// Customer Notifications
export const customerNotificationsApi = {
  // Get notifications
  getNotifications: () => apiClient.get('/customers/notifications'),
  
  // Mark notifications as read
  markNotificationsAsRead: (data: any) => apiClient.post('/customers/notifications/mark-read', data),
  
  // Update notification settings
  updateNotificationSettings: (data: any) => apiClient.post('/customers/notifications/settings', data),
  
  // Get notification settings
  getNotificationSettings: () => apiClient.get('/customers/notifications/settings'),
  
  // Test notification
  testNotification: (data: any) => apiClient.post('/customers/notifications/test', data),
};

// Customer Workflows
export const customerWorkflowsApi = {
  // Get workflows
  getWorkflows: () => apiClient.get('/customers/workflows'),
  
  // Create workflow
  createWorkflow: (data: any) => apiClient.post('/customers/workflows', data),
  
  // Get workflow by ID
  getWorkflowById: (workflowId: string) => apiClient.get(`/customers/workflows/${workflowId}`),
  
  // Update workflow
  updateWorkflow: (workflowId: string, data: any) => apiClient.put(`/customers/workflows/${workflowId}`, data),
  
  // Delete workflow
  deleteWorkflow: (workflowId: string) => apiClient.delete(`/customers/workflows/${workflowId}`),
  
  // Execute workflow
  executeWorkflow: (workflowId: string, data: any) => apiClient.post(`/customers/workflows/${workflowId}/execute`, data),
  
  // Get workflow analytics
  getWorkflowAnalytics: () => apiClient.get('/customers/workflows/analytics'),
};

// Customer Integrations
export const customerIntegrationsApi = {
  // Get integrations
  getIntegrations: () => apiClient.get('/customers/integrations'),
  
  // Create integration
  createIntegration: (data: any) => apiClient.post('/customers/integrations', data),
  
  // Get integration by ID
  getIntegrationById: (integrationId: string) => apiClient.get(`/customers/integrations/${integrationId}`),
  
  // Update integration
  updateIntegration: (integrationId: string, data: any) => apiClient.put(`/customers/integrations/${integrationId}`, data),
  
  // Delete integration
  deleteIntegration: (integrationId: string) => apiClient.delete(`/customers/integrations/${integrationId}`),
  
  // Sync integration
  syncIntegration: (integrationId: string, data: any) => apiClient.post(`/customers/integrations/${integrationId}/sync`, data),
  
  // Get integration analytics
  getIntegrationAnalytics: () => apiClient.get('/customers/integrations/analytics'),
};

// Add a helper function to check API connectivity
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    // console.warn('API health check failed:', error);
    return false;
  }
};

// Add a helper function to get API status
export const getApiStatus = async (): Promise<{ isOnline: boolean; message: string }> => {
  try {
    await checkApiHealth();
    return { isOnline: true, message: 'API is accessible' };
  } catch (error) {
    return { 
      isOnline: false, 
      message: 'API is not accessible - using dummy data' 
    };
  }
};

// ======================
// DEBUG FUNCTIONS
// ======================

// Debug function to check token status
export const debugTokenStatus = async () => {
  try {
    const token = await getAuthToken();
    // // // // + '...' : 'None');
    
    // Check storage directly
    if (typeof window !== 'undefined' && window.localStorage) {
      const authToken = localStorage.getItem('authToken');
      const userToken = localStorage.getItem('userToken');
      const tokenKey = localStorage.getItem('token');
    } else {
      // For React Native, check AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const reactNativeUserToken = await AsyncStorage.default.getItem('userToken');
    }
    
    return {
      success: true,
      tokenExists: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'None'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Debug function to test API call
export const debugApiCall = async (endpoint: string = '/customers') => {
  try {
    const response = await apiClient.get(endpoint);
    return {
      success: true,
      data: response
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      status: error.status
    };
  }
};

// Export the token functions for external use
export { getAuthToken, setAuthToken, removeAuthToken };

export default apiClient;

// Global debug functions for client.ts
if (typeof window !== 'undefined') {
  (window as any).debugClientTokenStatus = async () => {
    const result = await debugTokenStatus();
    // return result;
  };
  
  (window as any).debugClientApiCall = async (endpoint: string = '/customers') => {
    const result = await debugApiCall(endpoint);
    // return result;
  };
  
  (window as any).getClientStoredToken = async () => {
    const token = await getAuthToken();
    // + '...' : 'Not found');
    return token;
  };
}