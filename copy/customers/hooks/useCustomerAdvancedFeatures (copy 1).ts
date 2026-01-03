import { useState, useEffect, useCallback } from 'react';
import { customerAdvancedApi, 
  CustomerInteraction, 
  CustomerDocument, 
  CustomerTicket, 
  CustomerTask, 
  CustomerAutomation, 
  CustomerCollaboration, 
  CustomerWorkflow, 
  CustomerIntegration, 
  CustomerNotification, 
  CustomerSegment, 
  CustomerPipeline, 
  CustomerSearchResult, 
  BulkOperation, 
  CacheStats } from '../services/customerAdvancedApi';

// ===== INTERACTIONS HOOKS =====
export const useCustomerInteractions = () => {
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async (customerId: string, filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Customer interactions are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer interactions are not implemented');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInteraction = useCallback(async (customerId: string, data: Partial<CustomerInteraction>) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Customer interactions are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer interactions are not implemented');
      throw err;
    }
  }, []);

  const updateInteraction = useCallback(async (interactionId: string, data: Partial<CustomerInteraction>) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Customer interactions are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer interactions are not implemented');
      throw err;
    }
  }, []);

  const deleteInteraction = useCallback(async (interactionId: string) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Customer interactions are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Customer interactions are not implemented');
      throw err;
    }
  }, []);

  return {
    interactions,
    loading,
    error,
    fetchInteractions,
    createInteraction,
    updateInteraction,
    deleteInteraction
  };
};

// ===== DOCUMENTS HOOKS =====
export const useCustomerDocuments = (customerId: string) => {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerDocuments(customerId, filters);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const uploadDocument = useCallback(async (file: any, metadata: Partial<CustomerDocument>) => {
    try {
      const newDocument = await customerAdvancedApi.uploadCustomerDocument(customerId, file, metadata);
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      throw err;
    }
  }, [customerId]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerDocument(documentId);
      setDocuments(prev => prev.filter(item => item.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  };
};

// ===== TICKETS HOOKS =====
export const useCustomerTickets = (customerId: string) => {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerTickets(customerId, filters);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const createTicket = useCallback(async (data: Partial<CustomerTicket>) => {
    try {
      const newTicket = await customerAdvancedApi.createCustomerTicket(customerId, data);
      setTickets(prev => [...prev, newTicket]);
      return newTicket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      throw err;
    }
  }, [customerId]);

  const updateTicket = useCallback(async (ticketId: string, data: Partial<CustomerTicket>) => {
    try {
      const updatedTicket = await customerAdvancedApi.updateCustomerTicket(ticketId, data);
      setTickets(prev => prev.map(item => item.id === ticketId ? updatedTicket : item));
      return updatedTicket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
      throw err;
    }
  }, []);

  const deleteTicket = useCallback(async (ticketId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerTicket(ticketId);
      setTickets(prev => prev.filter(item => item.id !== ticketId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ticket');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket
  };
};

// ===== TASKS HOOKS =====
export const useCustomerTasks = (customerId: string) => {
  const [tasks, setTasks] = useState<CustomerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerTasks(customerId, filters);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const createTask = useCallback(async (data: Partial<CustomerTask>) => {
    try {
      const newTask = await customerAdvancedApi.createCustomerTask(customerId, data);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  }, [customerId]);

  const updateTask = useCallback(async (taskId: string, data: Partial<CustomerTask>) => {
    try {
      const updatedTask = await customerAdvancedApi.updateCustomerTask(taskId, data);
      setTasks(prev => prev.map(item => item.id === taskId ? updatedTask : item));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerTask(taskId);
      setTasks(prev => prev.filter(item => item.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask
  };
};

// ===== AUTOMATIONS HOOKS =====
export const useCustomerAutomations = () => {
  const [automations, setAutomations] = useState<CustomerAutomation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerAutomations(filters);
      setAutomations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch automations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAutomation = useCallback(async (data: Partial<CustomerAutomation>) => {
    try {
      const newAutomation = await customerAdvancedApi.createCustomerAutomation(data);
      setAutomations(prev => [...prev, newAutomation]);
      return newAutomation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create automation');
      throw err;
    }
  }, []);

  const updateAutomation = useCallback(async (automationId: string, data: Partial<CustomerAutomation>) => {
    try {
      const updatedAutomation = await customerAdvancedApi.updateCustomerAutomation(automationId, data);
      setAutomations(prev => prev.map(item => item.id === automationId ? updatedAutomation : item));
      return updatedAutomation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update automation');
      throw err;
    }
  }, []);

  const deleteAutomation = useCallback(async (automationId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerAutomation(automationId);
      setAutomations(prev => prev.filter(item => item.id !== automationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete automation');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return {
    automations,
    loading,
    error,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation
  };
};

// ===== COLLABORATIONS HOOKS =====
export const useCustomerCollaborations = (customerId: string) => {
  const [collaborations, setCollaborations] = useState<CustomerCollaboration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborations = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerCollaborations(customerId, filters);
      setCollaborations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collaborations');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const createCollaboration = useCallback(async (data: Partial<CustomerCollaboration>) => {
    try {
      const newCollaboration = await customerAdvancedApi.createCustomerCollaboration(customerId, data);
      setCollaborations(prev => [...prev, newCollaboration]);
      return newCollaboration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collaboration');
      throw err;
    }
  }, [customerId]);

  useEffect(() => {
    fetchCollaborations();
  }, [fetchCollaborations]);

  return {
    collaborations,
    loading,
    error,
    fetchCollaborations,
    createCollaboration
  };
};

// ===== WORKFLOWS HOOKS =====
export const useCustomerWorkflows = () => {
  const [workflows, setWorkflows] = useState<CustomerWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerWorkflows(filters);
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (data: Partial<CustomerWorkflow>) => {
    try {
      const newWorkflow = await customerAdvancedApi.createCustomerWorkflow(data);
      setWorkflows(prev => [...prev, newWorkflow]);
      return newWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      throw err;
    }
  }, []);

  const updateWorkflow = useCallback(async (workflowId: string, data: Partial<CustomerWorkflow>) => {
    try {
      const updatedWorkflow = await customerAdvancedApi.updateCustomerWorkflow(workflowId, data);
      setWorkflows(prev => prev.map(item => item.id === workflowId ? updatedWorkflow : item));
      return updatedWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
      throw err;
    }
  }, []);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerWorkflow(workflowId);
      setWorkflows(prev => prev.filter(item => item.id !== workflowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
};

// ===== INTEGRATIONS HOOKS =====
export const useCustomerIntegrations = () => {
  const [integrations, setIntegrations] = useState<CustomerIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerIntegrations(filters);
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createIntegration = useCallback(async (data: Partial<CustomerIntegration>) => {
    try {
      const newIntegration = await customerAdvancedApi.createCustomerIntegration(data);
      setIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration');
      throw err;
    }
  }, []);

  const updateIntegration = useCallback(async (integrationId: string, data: Partial<CustomerIntegration>) => {
    try {
      const updatedIntegration = await customerAdvancedApi.updateCustomerIntegration(integrationId, data);
      setIntegrations(prev => prev.map(item => item.id === integrationId ? updatedIntegration : item));
      return updatedIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
      throw err;
    }
  }, []);

  const deleteIntegration = useCallback(async (integrationId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerIntegration(integrationId);
      setIntegrations(prev => prev.filter(item => item.id !== integrationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete integration');
      throw err;
    }
  }, []);

  const syncIntegration = useCallback(async (integrationId: string) => {
    try {
      await customerAdvancedApi.syncCustomerIntegration(integrationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync integration');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    loading,
    error,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    syncIntegration
  };
};

// ===== NOTIFICATIONS HOOKS =====
export const useCustomerNotifications = (customerId: string) => {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerNotifications(customerId, filters);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const sendNotification = useCallback(async (data: Partial<CustomerNotification>) => {
    try {
      const newNotification = await customerAdvancedApi.sendCustomerNotification(customerId, data);
      setNotifications(prev => [...prev, newNotification]);
      return newNotification;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
      throw err;
    }
  }, [customerId]);

  const updateNotificationSettings = useCallback(async (settings: any) => {
    try {
      await customerAdvancedApi.updateNotificationSettings(customerId, settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
      throw err;
    }
  }, [customerId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    sendNotification,
    updateNotificationSettings
  };
};

// ===== SEGMENTS HOOKS =====
export const useCustomerSegments = () => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSegments = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerSegments(filters);
      setSegments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch segments');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSegment = useCallback(async (data: Partial<CustomerSegment>) => {
    try {
      const newSegment = await customerAdvancedApi.createCustomerSegment(data);
      setSegments(prev => [...prev, newSegment]);
      return newSegment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create segment');
      throw err;
    }
  }, []);

  const updateSegment = useCallback(async (segmentId: string, data: Partial<CustomerSegment>) => {
    try {
      const updatedSegment = await customerAdvancedApi.updateCustomerSegment(segmentId, data);
      setSegments(prev => prev.map(item => item.id === segmentId ? updatedSegment : item));
      return updatedSegment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update segment');
      throw err;
    }
  }, []);

  const deleteSegment = useCallback(async (segmentId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerSegment(segmentId);
      setSegments(prev => prev.filter(item => item.id !== segmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete segment');
      throw err;
    }
  }, []);

  const getSegmentCustomers = useCallback(async (segmentId: string, filters?: any) => {
    try {
      return await customerAdvancedApi.getSegmentCustomers(segmentId, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch segment customers');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return {
    segments,
    loading,
    error,
    fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    getSegmentCustomers
  };
};

// ===== PIPELINE HOOKS =====
export const useCustomerPipelines = () => {
  const [pipelines, setPipelines] = useState<CustomerPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerPipelines(filters);
      setPipelines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPipeline = useCallback(async (data: Partial<CustomerPipeline>) => {
    try {
      const newPipeline = await customerAdvancedApi.createCustomerPipeline(data);
      setPipelines(prev => [...prev, newPipeline]);
      return newPipeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
      throw err;
    }
  }, []);

  const updatePipeline = useCallback(async (pipelineId: string, data: Partial<CustomerPipeline>) => {
    try {
      const updatedPipeline = await customerAdvancedApi.updateCustomerPipeline(pipelineId, data);
      setPipelines(prev => prev.map(item => item.id === pipelineId ? updatedPipeline : item));
      return updatedPipeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pipeline');
      throw err;
    }
  }, []);

  const deletePipeline = useCallback(async (pipelineId: string) => {
    try {
      await customerAdvancedApi.deleteCustomerPipeline(pipelineId);
      setPipelines(prev => prev.filter(item => item.id !== pipelineId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pipeline');
      throw err;
    }
  }, []);

  const moveCustomerToStage = useCallback(async (customerId: string, pipelineId: string, stageId: string) => {
    try {
      await customerAdvancedApi.moveCustomerToStage(customerId, pipelineId, stageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move customer to stage');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  return {
    pipelines,
    loading,
    error,
    fetchPipelines,
    createPipeline,
    updatePipeline,
    deletePipeline,
    moveCustomerToStage
  };
};

// ===== SEARCH HOOKS =====
export const useCustomerSearch = () => {
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCustomers = useCallback(async (query: string, filters?: any) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.searchCustomers(query, filters);
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchAdvanced = useCallback(async (filters: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.searchAdvanced(filters);
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform advanced search');
    } finally {
      setLoading(false);
    }
  }, []);

  const getSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    try {
      const data = await customerAdvancedApi.getSearchSuggestions(query);
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get search suggestions');
    }
  }, []);

  return {
    searchResults,
    suggestions,
    loading,
    error,
    searchCustomers,
    searchAdvanced,
    getSearchSuggestions
  };
};

// ===== BULK OPERATIONS HOOKS =====
export const useCustomerBulkOperations = () => {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBulkOperation = useCallback(async (type: string, data: any) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
      throw err;
    }
  }, []);

  const getOperationStatus = useCallback(async (operationId: string) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
      throw err;
    }
  }, []);

  const cancelOperation = useCallback(async (operationId: string) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
      throw err;
    }
  }, []);

  const importCustomers = useCallback(async (file: any, options?: any) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
      throw err;
    }
  }, []);

  const exportCustomers = useCallback(async (filters?: any, format?: string) => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
      throw err;
    }
  }, []);

  const getImportTemplate = useCallback(async () => {
    try {
      // These endpoints are not implemented in the backend yet
      throw new Error('Bulk operations are not implemented in the backend yet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operations are not implemented');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  return {
    operations,
    loading,
    error,
    fetchOperations,
    createBulkOperation,
    getOperationStatus,
    cancelOperation,
    importCustomers,
    exportCustomers,
    getImportTemplate
  };
};

// ===== CACHE MANAGEMENT HOOKS =====
export const useCustomerCache = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCacheStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCacheStats();
      setCacheStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async (customerId?: string) => {
    try {
      await customerAdvancedApi.clearCustomerCache(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      throw err;
    }
  }, []);

  const warmCache = useCallback(async (customerId?: string) => {
    try {
      await customerAdvancedApi.warmCustomerCache(customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to warm cache');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  return {
    cacheStats,
    loading,
    error,
    fetchCacheStats,
    clearCache,
    warmCache
  };
};

// ===== ANALYTICS HOOKS =====
export const useCustomerAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerAnalytics(filters);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerMetrics(filters);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerReports(filters);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    metrics,
    reports,
    loading,
    error,
    fetchAnalytics,
    fetchMetrics,
    fetchReports
  };
};

// ===== SCHOOL-SPECIFIC ERP HOOKS =====
export const useCustomerSchoolFeatures = (customerId: string) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [transport, setTransport] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [hostel, setHostel] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerClasses(customerId);
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerAssignments(customerId);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerGrades(customerId);
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerAttendance(customerId);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerExams(customerId);
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerTimetable(customerId);
      setTimetable(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerPayments(customerId);
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerFees(customerId);
      setFees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchTransport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerTransport(customerId);
      setTransport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transport');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerLibrary(customerId);
      setLibrary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch library');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchHostel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerHostel(customerId);
      setHostel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hostel');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerInventory(customerId);
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchMaintenance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerMaintenance(customerId);
      setMaintenance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch maintenance');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerEvents(customerId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerAnnouncements(customerId);
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerResources(customerId);
      setResources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerAdvancedApi.getCustomerSettings(customerId);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const updateSettings = useCallback(async (newSettings: any) => {
    try {
      await customerAdvancedApi.updateCustomerSettings(customerId, newSettings);
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, [customerId]);

  return {
    classes,
    assignments,
    grades,
    attendance,
    exams,
    timetable,
    payments,
    fees,
    transport,
    library,
    hostel,
    inventory,
    maintenance,
    events,
    announcements,
    resources,
    settings,
    loading,
    error,
    fetchClasses,
    fetchAssignments,
    fetchGrades,
    fetchAttendance,
    fetchExams,
    fetchTimetable,
    fetchPayments,
    fetchFees,
    fetchTransport,
    fetchLibrary,
    fetchHostel,
    fetchInventory,
    fetchMaintenance,
    fetchEvents,
    fetchAnnouncements,
    fetchResources,
    fetchSettings,
    updateSettings
  };
}; 
