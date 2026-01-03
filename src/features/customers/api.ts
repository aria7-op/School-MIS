// src/api/client.ts
import secureApiService from '../../services/secureApiService';

// ======================
// CUSTOMER API FUNCTIONS
// ======================

// Core Customer CRUD Operations
export const customerApi = {
  // Get all customers with filters
  getCustomers: (params?: any) => secureApiService.getCustomers(params),
  
  // Get customer by ID
  getCustomerById: (id: string, params?: any) => secureApiService.getCustomerById(id, params),
  
  // Create new customer
  createCustomer: (data: any) => secureApiService.createCustomer(data),
  
  // Update customer
  updateCustomer: (id: string, data: any) => secureApiService.updateCustomer(id, data),
  
  // Partial update customer
  partialUpdateCustomer: (id: string, data: any) => secureApiService.partialUpdateCustomer(id, data),
  
  // Delete customer
  deleteCustomer: (id: string) => secureApiService.deleteCustomer(id),
};

// Customer Analytics
export const customerAnalyticsApi = {
  // Get analytics dashboard
  getAnalyticsDashboard: (params?: any) => secureApiService.getCustomerAnalytics(params),
  
  // Get analytics reports
  getAnalyticsReports: (params?: any) => secureApiService.getAnalyticsReports(params),
  
  // Get analytics trends
  getAnalyticsTrends: (params?: any) => secureApiService.getAnalyticsTrends(params),
  
  // Get forecasting analytics
  getForecastingAnalytics: (params?: any) => secureApiService.getForecastingAnalytics(params),
  
  // Export analytics
  exportAnalytics: (data: any) => secureApiService.exportAnalytics(data),
  
  // Per customer analytics
  getCustomerAnalytics: (id: string) => secureApiService.getCustomerAnalytics(),
  getCustomerPerformance: (id: string) => secureApiService.getCustomerAnalytics(),
  getCustomerEngagement: (id: string) => secureApiService.getCustomerAnalytics(),
  getCustomerConversion: (id: string) => secureApiService.getCustomerAnalytics(),
  getCustomerLifetimeValue: (id: string) => secureApiService.getCustomerAnalytics(),
};

// Customer Interactions
export const customerInteractionsApi = {
  // Get customer interactions
  getCustomerInteractions: (customerId: string, params?: any) => secureApiService.get(`/customers/${customerId}/interactions`, { params }),
  
  // Create interaction
  createInteraction: (customerId: string, data: any) => secureApiService.post(`/customers/${customerId}/interactions`, data),
  
  // Get specific interaction
  getInteractionById: (id: string, interactionId: string) => secureApiService.get(`/customers/${id}/interactions/${interactionId}`),
  
  // Update interaction
  updateInteraction: (customerId: string, interactionId: string, data: any) => secureApiService.put(`/customers/${customerId}/interactions/${interactionId}`, data),
  
  // Delete interaction
  deleteInteraction: (customerId: string, interactionId: string) => secureApiService.delete(`/customers/${customerId}/interactions/${interactionId}`),
  
  // Get interaction analytics
  getInteractionAnalytics: () => secureApiService.get('/customers/interactions/analytics'),
  
  // Get interaction timeline
  getInteractionTimeline: () => secureApiService.get('/customers/interactions/timeline'),
  
  // Bulk create interactions
  bulkCreateInteractions: (data: any) => secureApiService.post('/customers/interactions/bulk', data),
};

// Customer Documents
export const customerDocumentsApi = {
  // Get customer documents
  getCustomerDocuments: (customerId: string) => secureApiService.getCustomerDocuments(customerId),
  
  // Upload document
  uploadDocument: (customerId: string, data: any) => secureApiService.uploadDocument(customerId, data),
  
  // Get document analytics
  getDocumentAnalytics: () => secureApiService.getDocumentAnalytics(),
};

// Customer Tickets
export const customerTicketsApi = {
  // Get customer tickets
  getCustomerTickets: (customerId: string, params?: any) => secureApiService.get(`/customers/${customerId}/tickets`, { params }),
  
  // Create ticket
  createTicket: (customerId: string, data: any) => secureApiService.post(`/customers/${customerId}/tickets`, data),
  
  // Get specific ticket
  getTicketById: (id: string, ticketId: string) => secureApiService.get(`/customers/${id}/tickets/${ticketId}`),
  
  // Update ticket
  updateTicket: (customerId: string, ticketId: string, data: any) => secureApiService.put(`/customers/${customerId}/tickets/${ticketId}`, data),
  
  // Delete ticket
  deleteTicket: (customerId: string, ticketId: string) => secureApiService.delete(`/customers/${customerId}/tickets/${ticketId}`),
  
  // Assign ticket
  assignTicket: (id: string, ticketId: string, data: any) => secureApiService.post(`/customers/${id}/tickets/${ticketId}/assign`, data),
  
  // Resolve ticket
  resolveTicket: (id: string, ticketId: string) => secureApiService.post(`/customers/${id}/tickets/${ticketId}/resolve`),
  
  // Escalate ticket
  escalateTicket: (id: string, ticketId: string) => secureApiService.post(`/customers/${id}/tickets/${ticketId}/escalate`),
  
  // Get ticket dashboard
  getTicketDashboard: () => secureApiService.get('/customers/tickets/dashboard'),
  
  // Get ticket analytics
  getTicketAnalytics: () => secureApiService.get('/customers/tickets/analytics'),
  
  // Bulk update tickets
  bulkUpdateTickets: (data: any) => secureApiService.put('/customers/tickets/bulk', data),
  
  // Get ticket timeline
  getTicketTimeline: () => secureApiService.get('/customers/tickets/timeline'),
};

// Customer Communications
export const customerCommunicationsApi = {
  // Get customer communications
  getCustomerCommunications: (customerId: string, params?: any) => secureApiService.get(`/customers/${customerId}/communications`, { params }),
  
  // Send communication
  sendCommunication: (customerId: string, data: any) => secureApiService.post(`/customers/${customerId}/communications`, data),
  
  // Get communication templates
  getCommunicationTemplates: () => secureApiService.get('/customers/communications/templates'),
  
  // Get communication analytics
  getCommunicationAnalytics: () => secureApiService.get('/customers/communications/analytics'),
  
  // Bulk send communications
  bulkSendCommunications: (data: any) => secureApiService.post('/customers/communications/bulk', data),
};

// Customer Surveys
export const customerSurveysApi = {
  // Get customer surveys
  getCustomerSurveys: (customerId: string, params?: any) => secureApiService.get(`/customers/${customerId}/surveys`, { params }),
  
  // Create survey response
  createSurveyResponse: (id: string, data: any) => secureApiService.post(`/customers/${id}/surveys`, data),
  
  // Get survey analytics
  getSurveyAnalytics: () => secureApiService.get('/customers/surveys/analytics'),
  
  // Get survey templates
  getSurveyTemplates: () => secureApiService.get('/customers/surveys/templates'),
};

// Customer Preferences
export const customerPreferencesApi = {
  // Get customer preferences
  getCustomerPreferences: (customerId: string) => secureApiService.get(`/customers/${customerId}/preferences`),
  
  // Update customer preferences
  updateCustomerPreferences: (customerId: string, data: any) => secureApiService.put(`/customers/${customerId}/preferences`, data),
  
  // Get preference analytics
  getPreferenceAnalytics: () => secureApiService.get('/customers/preferences/analytics'),
};

// Customer Segmentation
export const customerSegmentationApi = {
  // Get customer segments
  getCustomerSegments: (params?: any) => secureApiService.get('/customers/segments', { params }),
  
  // Create customer segment
  createCustomerSegment: (data: any) => secureApiService.post('/customers/segments', data),
  
  // Update customer segment
  updateCustomerSegment: (segmentId: string, data: any) => secureApiService.put(`/customers/segments/${segmentId}`, data),
  
  // Delete customer segment
  deleteCustomerSegment: (segmentId: string) => secureApiService.delete(`/customers/segments/${segmentId}`),
  
  // Get segment analytics
  getSegmentAnalytics: () => secureApiService.get('/customers/segments/analytics'),
  
  // Assign customer to segment
  assignCustomerToSegment: (customerId: string, segmentId: string) => secureApiService.post(`/customers/${customerId}/segments/${segmentId}`),
  
  // Remove customer from segment
  removeCustomerFromSegment: (customerId: string, segmentId: string) => secureApiService.delete(`/customers/${customerId}/segments/${segmentId}`),
};

// Customer Import/Export
export const customerImportExportApi = {
  // Export customers
  exportCustomers: (params?: any) => secureApiService.get('/customers/export', { params }),
  
  // Import customers
  importCustomers: (data: any) => secureApiService.post('/customers/import', data),
  
  // Get import status
  getImportStatus: (importId: string) => secureApiService.get(`/customers/import/${importId}/status`),
  
  // Get import template
  getImportTemplate: () => secureApiService.get('/customers/import/template'),
  
  // Validate import data
  validateImportData: (data: any) => secureApiService.post('/customers/import/validate', data),
};

// Customer Bulk Operations
export const customerBulkApi = {
  // Bulk update customers
  bulkUpdateCustomers: (data: any) => secureApiService.put('/customers/bulk', data),
  
  // Bulk delete customers
  bulkDeleteCustomers: (data: any) => secureApiService.delete('/customers/bulk', { data }),
  
  // Bulk create customers
  bulkCreateCustomers: (data: any) => secureApiService.post('/customers/bulk', data),
  
  // Get bulk operation status
  getBulkOperationStatus: (operationId: string) => secureApiService.get(`/customers/bulk/${operationId}/status`),
};

// Customer Search
export const customerSearchApi = {
  // Search customers
  searchCustomers: (query: string, params?: any) => secureApiService.get('/customers/search', { 
    params: { q: query, ...params } 
  }),
  
  // Advanced search
  advancedSearch: (params: any) => secureApiService.advancedSearch(params),
  
  // Get search suggestions
  getSearchSuggestions: (query: string, limit?: number) => secureApiService.getSearchSuggestions(query, limit),
  
  // Get search analytics
  getSearchAnalytics: () => secureApiService.get('/customers/search/analytics'),
};

// Customer Dashboard
export const customerDashboardApi = {
  // Get dashboard overview
  getDashboardOverview: () => secureApiService.get('/customers/dashboard/overview'),
  
  // Get dashboard metrics
  getDashboardMetrics: (params?: any) => secureApiService.get('/customers/dashboard/metrics', { params }),
  
  // Get dashboard charts
  getDashboardCharts: (params?: any) => secureApiService.get('/customers/dashboard/charts', { params }),
  
  // Get dashboard widgets
  getDashboardWidgets: () => secureApiService.get('/customers/dashboard/widgets'),
  
  // Update dashboard layout
  updateDashboardLayout: (data: any) => secureApiService.put('/customers/dashboard/layout', data),
};

// Customer Settings
export const customerSettingsApi = {
  // Get customer settings
  getCustomerSettings: () => secureApiService.get('/customers/settings'),
  
  // Update customer settings
  updateCustomerSettings: (data: any) => secureApiService.put('/customers/settings', data),
  
  // Get field configurations
  getFieldConfigurations: () => secureApiService.get('/customers/settings/fields'),
  
  // Update field configurations
  updateFieldConfigurations: (data: any) => secureApiService.put('/customers/settings/fields', data),
  
  // Get workflow configurations
  getWorkflowConfigurations: () => secureApiService.get('/customers/settings/workflows'),
  
  // Update workflow configurations
  updateWorkflowConfigurations: (data: any) => secureApiService.put('/customers/settings/workflows', data),
};

// Health check and status functions
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await secureApiService.healthCheck();
    return response.success;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export const getApiStatus = async (): Promise<{ isOnline: boolean; message: string }> => {
  try {
    const response = await secureApiService.healthCheck();
    return {
      isOnline: response.success,
      message: response.message || 'API is online'
    };
  } catch (error: any) {
    return {
      isOnline: false,
      message: error.message || 'API is offline'
    };
  }
};
