import { useState, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';

// Simplified types
export interface CreateAutomationData {
  name: string;
  description?: string;
  type: string;
  priority?: string;
  isActive?: boolean;
  triggers: any[];
  actions: any[];
}

export interface CreateCollaborationData {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  dueDate?: string;
  participants?: string[];
  isPublic?: boolean;
}

export interface CreateDocumentData {
  title: string;
  description?: string;
  type: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isConfidential?: boolean;
  expiryDate?: string;
  file: any;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  type: string;
  category?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  assignedTo?: string;
  tags?: string[];
  subtasks?: Array<{
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    assignedTo?: string;
  }>;
}

const useCustomerApiSimple = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================
  // AUTOMATION METHODS
  // ======================
  const getCustomerAutomations = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getCustomerAutomations(customerId);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get automations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAutomation = useCallback(async (customerId: string, data: CreateAutomationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createAutomation(customerId, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create automation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAutomation = useCallback(async (customerId: string, automationId: string, data: Partial<CreateAutomationData>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updateAutomation(customerId, automationId, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update automation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAutomation = useCallback(async (customerId: string, automationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deleteAutomation(customerId, automationId);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete automation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAutomationTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getAutomationTemplates();
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get automation templates');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // COLLABORATION METHODS
  // ======================
  const getCustomerCollaborations = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getCustomerCollaborations(customerId);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get collaborations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollaboration = useCallback(async (customerId: string, data: CreateCollaborationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createCollaboration(customerId, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCollaboration = useCallback(async (customerId: string, collaborationId: string, data: Partial<CreateCollaborationData>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.updateCollaboration(customerId, collaborationId, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCollaboration = useCallback(async (customerId: string, collaborationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.deleteCollaboration(customerId, collaborationId);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCollaborationFeed = useCallback(async (page?: number, limit?: number) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      
      const response = await secureApiService.getCollaborationFeed(params);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get collaboration feed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // DOCUMENT METHODS
  // ======================
  const getCustomerDocuments = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getCustomerDocuments(customerId);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get documents');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (customerId: string, data: CreateDocumentData) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'file') {
          formData.append('file', value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      
      const response = await secureApiService.uploadDocument(customerId, formData);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentAnalytics = useCallback(async (period?: string, customerId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (customerId) params.append('customerId', customerId);
      
      const response = await secureApiService.getDocumentAnalytics(params);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get document analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================
  // TASK METHODS
  // ======================
  const getCustomerTasks = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.getCustomerTasks(customerId);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (customerId: string, data: CreateTaskData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await secureApiService.createTask(customerId, data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskDashboard = useCallback(async (period?: string, customerId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (customerId) params.append('customerId', customerId);
      
      const response = await secureApiService.getTaskDashboard(params);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get task dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    // Automation methods
    getCustomerAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    getAutomationTemplates,
    // Collaboration methods
    getCustomerCollaborations,
    createCollaboration,
    updateCollaboration,
    deleteCollaboration,
    getCollaborationFeed,
    // Document methods
    getCustomerDocuments,
    uploadDocument,
    getDocumentAnalytics,
    // Task methods
    getCustomerTasks,
    createTask,
    getTaskDashboard,
  };
};

export default useCustomerApiSimple; 
