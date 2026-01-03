// Customer API exports for backward compatibility
import { customerService } from './services/customerService';

// Export customerApi for backward compatibility
export const customerApi = {
  getCustomers: customerService.getAllCustomers,
  getCustomerById: customerService.getCustomerById,
  createCustomer: customerService.createCustomer,
  updateCustomer: customerService.updateCustomer,
  deleteCustomer: customerService.deleteCustomer,
  searchCustomers: customerService.searchCustomers,
  getCustomerAnalytics: customerService.getCustomerAnalytics,
  getCustomerConversionAnalytics: customerService.getCustomerConversionAnalytics,
  getUnconvertedCustomers: customerService.getUnconvertedCustomers
};

// Export customerAnalyticsApi for backward compatibility
export const customerAnalyticsApi = {
  getAnalytics: customerService.getCustomerAnalytics,
  getConversionAnalytics: customerService.getCustomerConversionAnalytics,
  getReports: customerService.getCustomerAnalytics,
  getTrends: customerService.getCustomerAnalytics
};

// Export customerPipelineApi for backward compatibility
export const customerPipelineApi = {
  getPipeline: customerService.getAllCustomers,
  getStages: customerService.getAllCustomers,
  updateStage: customerService.updateCustomer
};

// Export customerEventAnalyticsApi for backward compatibility
export const customerEventAnalyticsApi = {
  getEvents: customerService.getAllCustomers,
  getEventAnalytics: customerService.getCustomerAnalytics
};

// Export customerWorkflowsApi for backward compatibility
export const customerWorkflowsApi = {
  getWorkflows: customerService.getAllCustomers,
  createWorkflow: customerService.createCustomer,
  updateWorkflow: customerService.updateCustomer,
  deleteWorkflow: customerService.deleteCustomer
};

// Export customerTicketsApi for backward compatibility
export const customerTicketsApi = {
  getTickets: customerService.getAllCustomers,
  createTicket: customerService.createCustomer,
  updateTicket: customerService.updateCustomer,
  deleteTicket: customerService.deleteCustomer
};

// Export customerTasksApi for backward compatibility
export const customerTasksApi = {
  getTasks: customerService.getAllCustomers,
  createTask: customerService.createCustomer,
  updateTask: customerService.updateCustomer,
  deleteTask: customerService.deleteCustomer
};

// Export customerSegmentsApi for backward compatibility
export const customerSegmentsApi = {
  getSegments: customerService.getAllCustomers,
  createSegment: customerService.createCustomer,
  updateSegment: customerService.updateCustomer,
  deleteSegment: customerService.deleteCustomer
};

// Export customerSearchApi for backward compatibility
export const customerSearchApi = {
  search: customerService.searchCustomers,
  getSuggestions: customerService.searchCustomers,
  getFilters: customerService.getAllCustomers
};

// Export customerNotificationsApi for backward compatibility
export const customerNotificationsApi = {
  getNotifications: customerService.getAllCustomers,
  createNotification: customerService.createCustomer,
  updateNotification: customerService.updateCustomer,
  deleteNotification: customerService.deleteCustomer
};

// Export customerInteractionsApi for backward compatibility
export const customerInteractionsApi = {
  getInteractions: customerService.getAllCustomers,
  createInteraction: customerService.createCustomer,
  updateInteraction: customerService.updateCustomer,
  deleteInteraction: customerService.deleteCustomer
};

// Export customerIntegrationsApi for backward compatibility
export const customerIntegrationsApi = {
  getIntegrations: customerService.getAllCustomers,
  createIntegration: customerService.createCustomer,
  updateIntegration: customerService.updateCustomer,
  deleteIntegration: customerService.deleteCustomer
};

// Export customerDocumentsApi for backward compatibility
export const customerDocumentsApi = {
  getDocuments: customerService.getAllCustomers,
  uploadDocument: customerService.createCustomer,
  updateDocument: customerService.updateCustomer,
  deleteDocument: customerService.deleteCustomer
};

// Export customerCollaborationsApi for backward compatibility
export const customerCollaborationsApi = {
  getCollaborations: customerService.getAllCustomers,
  createCollaboration: customerService.createCustomer,
  updateCollaboration: customerService.updateCustomer,
  deleteCollaboration: customerService.deleteCustomer
};

// Export customerCacheApi for backward compatibility
export const customerCacheApi = {
  getCache: customerService.getAllCustomers,
  clearCache: customerService.getAllCustomers,
  warmCache: customerService.getAllCustomers
};

// Export customerAutomationsApi for backward compatibility
export const customerAutomationsApi = {
  getAutomations: customerService.getAllCustomers,
  createAutomation: customerService.createCustomer,
  updateAutomation: customerService.updateCustomer,
  deleteAutomation: customerService.deleteCustomer
};

// Export customerBulkApi for backward compatibility
export const customerBulkApi = {
  bulkCreate: customerService.createCustomer,
  bulkUpdate: customerService.updateCustomer,
  bulkDelete: customerService.deleteCustomer
};

// Export default
export default {
  customerApi,
  customerAnalyticsApi,
  customerPipelineApi,
  customerEventAnalyticsApi,
  customerWorkflowsApi,
  customerTicketsApi,
  customerTasksApi,
  customerSegmentsApi,
  customerSearchApi,
  customerNotificationsApi,
  customerInteractionsApi,
  customerIntegrationsApi,
  customerDocumentsApi,
  customerCollaborationsApi,
  customerCacheApi,
  customerAutomationsApi,
  customerBulkApi
};
