import { useState, useCallback } from 'react';
import { 
  staffApi, 
  analyticsApi, 
  bulkApi, 
  searchApi, 
  utilityApi, 
  advancedApi, 
  cacheApi,
  collaborationApi,
  documentsApi,
  tasksApi
} from '../services/staffApi';

// ======================
// TYPES
// ======================

export interface StaffCollaboration {
  id: string;
  type: 'PROJECT' | 'TEAM' | 'MEETING';
  title: string;
  description: string;
  participants: string[];
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface StaffDocument {
  id: string;
  title: string;
  type: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  uploadDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING_VERIFICATION';
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  completedAt?: string;
  tags: string[];
}

export interface BulkOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}

// ======================
// COLLABORATION HOOKS
// ======================
export const useStaffCollaboration = () => {
  const [collaborations, setCollaborations] = useState<StaffCollaboration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborations = useCallback(async (staffId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await collaborationApi.getStaffCollaboration(staffId);
      setCollaborations(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaborations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollaboration = useCallback(async (staffId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await collaborationApi.createStaffCollaboration(staffId, data);
      setCollaborations(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCollaboration = useCallback(async (staffId: string, collaborationId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await collaborationApi.updateStaffCollaboration(staffId, collaborationId, data);
      setCollaborations(prev => prev.map(c => c.id === collaborationId ? response.data : c));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCollaboration = useCallback(async (staffId: string, collaborationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await collaborationApi.deleteStaffCollaboration(staffId, collaborationId);
      setCollaborations(prev => prev.filter(c => c.id !== collaborationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collaboration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    collaborations,
    loading,
    error,
    fetchCollaborations,
    createCollaboration,
    updateCollaboration,
    deleteCollaboration,
  };
};

// ======================
// DOCUMENTS HOOKS
// ======================
export const useStaffDocuments = () => {
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (staffId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.getStaffDocuments(staffId);
      setDocuments(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (staffId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.uploadStaffDocument(staffId, data);
      setDocuments(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (staffId: string, documentId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.updateStaffDocument(staffId, documentId, data);
      setDocuments(prev => prev.map(d => d.id === documentId ? response.data : d));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (staffId: string, documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await documentsApi.deleteStaffDocument(staffId, documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyDocument = useCallback(async (staffId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.verifyStaffDocument(staffId, data);
      setDocuments(prev => prev.map(d => d.id === data.documentId ? response.data : d));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    verifyDocument,
  };
};

// ======================
// TASKS HOOKS
// ======================
export const useStaffTasks = () => {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (staffId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.getStaffTasks(staffId);
      setTasks(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (staffId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.createStaffTask(staffId, data);
      setTasks(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (staffId: string, taskId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.updateStaffTask(staffId, taskId, data);
      setTasks(prev => prev.map(t => t.id === taskId ? response.data : t));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (staffId: string, taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      await tasksApi.deleteStaffTask(staffId, taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTask = useCallback(async (staffId: string, taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.completeStaffTask(staffId, taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? response.data : t));
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
};

// ======================
// BULK OPERATIONS HOOKS
// ======================
export const useStaffBulkOperations = () => {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkCreateStaff = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bulkApi.bulkCreateStaff(data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk create staff');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStaff = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bulkApi.bulkUpdateStaff(data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update staff');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteStaff = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bulkApi.bulkDeleteStaff(data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete staff');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    operations,
    loading,
    error,
    bulkCreateStaff,
    bulkUpdateStaff,
    bulkDeleteStaff,
  };
};

// ======================
// ANALYTICS HOOKS
// ======================
export const useStaffAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (staffId: string, params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.getStaffAnalytics(staffId, params);
      setAnalytics(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPerformance = useCallback(async (staffId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.getStaffPerformance(staffId);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async (staffId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.getStaffDashboard(staffId);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    fetchPerformance,
    fetchDashboard,
  };
};

// ======================
// CACHE MANAGEMENT HOOKS
// ======================
export const useStaffCacheManagement = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCacheStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cacheApi.getCacheStats();
      setCacheStats(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cache stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const warmCache = useCallback(async (data?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cacheApi.warmCache(data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to warm cache');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cacheApi.clearCache(params);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cacheStats,
    loading,
    error,
    getCacheStats,
    warmCache,
    clearCache,
  };
};

// ======================
// COMPREHENSIVE EXPORT
// ======================
export default {
  useStaffCollaboration,
  useStaffDocuments,
  useStaffTasks,
  useStaffBulkOperations,
  useStaffAnalytics,
  useStaffCacheManagement,
}; 
