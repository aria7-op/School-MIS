import apiClient from '../../../services/api/client';

// Safe token wrapper - use localStorage for web, AsyncStorage for mobile
const getAuthToken = async (): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Web environment
      const token = localStorage.getItem('authToken');
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

// Types for advanced customer features
export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  name: string;
  type: 'contract' | 'invoice' | 'proposal' | 'receipt' | 'other';
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  isPublic: boolean;
}

export interface CustomerTicket {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo?: string;
  slaDeadline?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CustomerTask {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CustomerAutomation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCollaboration {
  id: string;
  customerId: string;
  type: 'comment' | 'mention' | 'share';
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWorkflow {
  id: string;
  name: string;
  description: string;
  steps: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerIntegration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'calendar' | 'payment' | 'other';
  config: any;
  isActive: boolean;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNotification {
  id: string;
  customerId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: any[];
  customerCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPipeline {
  id: string;
  name: string;
  description: string;
  stages: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  score: number;
  highlights: any;
}

export interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt?: string;
}

export interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  lastCleanup: string;
}

// Advanced Customer API Service
class CustomerAdvancedApiService {
  // ===== INTERACTIONS =====
  // These endpoints are not implemented in the backend yet
  // async getCustomerInteractions(customerId: string, filters?: any): Promise<CustomerInteraction[]> {
  //   const token = await getAuthToken();
  //   const response = await apiClient.get(`/customers/${customerId}/interactions`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //     params: filters
  //   });
  //   return response.data;
  // }

  // ===== DOCUMENTS =====
  async getCustomerDocuments(customerId: string, filters?: any): Promise<CustomerDocument[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async uploadCustomerDocument(customerId: string, file: any, metadata: Partial<CustomerDocument>): Promise<CustomerDocument> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await apiClient.post(`/customers/${customerId}/documents/upload`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async deleteCustomerDocument(documentId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-documents/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== TICKETS =====
  async getCustomerTickets(customerId: string, filters?: any): Promise<CustomerTicket[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/tickets`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerTicket(customerId: string, data: Partial<CustomerTicket>): Promise<CustomerTicket> {
    const token = await getAuthToken();
    const response = await apiClient.post(`/customers/${customerId}/tickets`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerTicket(ticketId: string, data: Partial<CustomerTicket>): Promise<CustomerTicket> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-tickets/${ticketId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerTicket(ticketId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== TASKS =====
  async getCustomerTasks(customerId: string, filters?: any): Promise<CustomerTask[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerTask(customerId: string, data: Partial<CustomerTask>): Promise<CustomerTask> {
    const token = await getAuthToken();
    const response = await apiClient.post(`/customers/${customerId}/tasks`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerTask(taskId: string, data: Partial<CustomerTask>): Promise<CustomerTask> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-tasks/${taskId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerTask(taskId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== AUTOMATIONS =====
  async getCustomerAutomations(filters?: any): Promise<CustomerAutomation[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/automations', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerAutomation(data: Partial<CustomerAutomation>): Promise<CustomerAutomation> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customer-automations', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerAutomation(automationId: string, data: Partial<CustomerAutomation>): Promise<CustomerAutomation> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-automations/${automationId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerAutomation(automationId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-automations/${automationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== COLLABORATIONS =====
  async getCustomerCollaborations(customerId: string, filters?: any): Promise<CustomerCollaboration[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/collaborations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerCollaboration(customerId: string, data: Partial<CustomerCollaboration>): Promise<CustomerCollaboration> {
    const token = await getAuthToken();
    const response = await apiClient.post(`/customers/${customerId}/collaborations`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // ===== WORKFLOWS =====
  async getCustomerWorkflows(filters?: any): Promise<CustomerWorkflow[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customer-workflows', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerWorkflow(data: Partial<CustomerWorkflow>): Promise<CustomerWorkflow> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customer-workflows', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerWorkflow(workflowId: string, data: Partial<CustomerWorkflow>): Promise<CustomerWorkflow> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-workflows/${workflowId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerWorkflow(workflowId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-workflows/${workflowId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== INTEGRATIONS =====
  async getCustomerIntegrations(filters?: any): Promise<CustomerIntegration[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customer-integrations', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerIntegration(data: Partial<CustomerIntegration>): Promise<CustomerIntegration> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customer-integrations', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerIntegration(integrationId: string, data: Partial<CustomerIntegration>): Promise<CustomerIntegration> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-integrations/${integrationId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerIntegration(integrationId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-integrations/${integrationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async syncCustomerIntegration(integrationId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.post(`/customer-integrations/${integrationId}/sync`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== NOTIFICATIONS =====
  async getCustomerNotifications(customerId: string, filters?: any): Promise<CustomerNotification[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async sendCustomerNotification(customerId: string, data: Partial<CustomerNotification>): Promise<CustomerNotification> {
    const token = await getAuthToken();
    const response = await apiClient.post(`/customers/${customerId}/notifications/send`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateNotificationSettings(customerId: string, settings: any): Promise<void> {
    const token = await getAuthToken();
    await apiClient.put(`/customers/${customerId}/notification-settings`, settings, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== SEGMENTS =====
  async getCustomerSegments(filters?: any): Promise<CustomerSegment[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customer-segments', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerSegment(data: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customer-segments', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerSegment(segmentId: string, data: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-segments/${segmentId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerSegment(segmentId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-segments/${segmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async getSegmentCustomers(segmentId: string, filters?: any): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customer-segments/${segmentId}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  // ===== PIPELINE =====
  async getCustomerPipelines(filters?: any): Promise<CustomerPipeline[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customer-pipelines', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createCustomerPipeline(data: Partial<CustomerPipeline>): Promise<CustomerPipeline> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customer-pipelines', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerPipeline(pipelineId: string, data: Partial<CustomerPipeline>): Promise<CustomerPipeline> {
    const token = await getAuthToken();
    const response = await apiClient.put(`/customer-pipelines/${pipelineId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async deleteCustomerPipeline(pipelineId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.delete(`/customer-pipelines/${pipelineId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async moveCustomerToStage(customerId: string, pipelineId: string, stageId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.put(`/customers/${customerId}/pipeline-stage`, {
      pipelineId,
      stageId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== SEARCH =====
  async searchCustomers(query: string, filters?: any): Promise<CustomerSearchResult[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, ...filters }
    });
    return response.data;
  }

  async searchAdvanced(filters: any): Promise<CustomerSearchResult[]> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customers/search/advanced', filters, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/search/suggestions', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query }
    });
    return response.data;
  }

  // ===== BULK OPERATIONS =====
  async getBulkOperations(filters?: any): Promise<BulkOperation[]> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customer-bulk-operations', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async createBulkOperation(type: string, data: any): Promise<BulkOperation> {
    const token = await getAuthToken();
    const response = await apiClient.post('/customer-bulk-operations', { type, ...data }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getBulkOperationStatus(operationId: string): Promise<BulkOperation> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customer-bulk-operations/${operationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async cancelBulkOperation(operationId: string): Promise<void> {
    const token = await getAuthToken();
    await apiClient.post(`/customer-bulk-operations/${operationId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== IMPORT/EXPORT =====
  async importCustomers(file: any, options?: any): Promise<BulkOperation> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }
    
    const response = await apiClient.post('/customers/import', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async exportCustomers(filters?: any, format?: string): Promise<string> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/export', {
      headers: { Authorization: `Bearer ${token}` },
      params: { ...filters, format }
    });
    return response.data.downloadUrl;
  }

  async getImportTemplate(): Promise<string> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/import/template', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.downloadUrl;
  }

  // ===== CACHE MANAGEMENT =====
  async getCacheStats(): Promise<CacheStats> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customer-cache/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async clearCustomerCache(customerId?: string): Promise<void> {
    const token = await getAuthToken();
    const url = customerId ? `/customer-cache/clear/${customerId}` : '/customer-cache/clear';
    await apiClient.post(url, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async warmCustomerCache(customerId?: string): Promise<void> {
    const token = await getAuthToken();
    const url = customerId ? `/customer-cache/warm/${customerId}` : '/customer-cache/warm';
    await apiClient.post(url, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // ===== ANALYTICS =====
  async getCustomerAnalytics(filters?: any): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async getCustomerMetrics(filters?: any): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/analytics/reports', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  async getCustomerReports(filters?: any): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get('/customers/analytics/trends', {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  }

  // ===== SCHOOL-SPECIFIC ERP FEATURES =====
  async getCustomerClasses(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerAssignments(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerGrades(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/grades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerAttendance(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerExams(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/exams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerTimetable(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/timetable`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerPayments(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerFees(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/fees`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerTransport(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/transport`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerLibrary(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/library`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerHostel(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/hostel`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerInventory(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerMaintenance(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/maintenance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerEvents(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/events`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerAnnouncements(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerResources(customerId: string): Promise<any[]> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/resources`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async getCustomerSettings(customerId: string): Promise<any> {
    const token = await getAuthToken();
    const response = await apiClient.get(`/customers/${customerId}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async updateCustomerSettings(customerId: string, settings: any): Promise<void> {
    const token = await getAuthToken();
    await apiClient.put(`/customers/${customerId}/settings`, settings, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

export const customerAdvancedApi = new CustomerAdvancedApiService();
