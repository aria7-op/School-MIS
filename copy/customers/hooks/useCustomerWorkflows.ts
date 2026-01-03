import { useState, useCallback } from 'react';
import { customerWorkflowsApi } from '../../../services/api/client';

const useCustomerWorkflows = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Get all workflows
  const getWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.getWorkflows();
      setWorkflows(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflows');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get workflow by ID
  const getWorkflowById = useCallback(async (workflowId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.getWorkflowById(workflowId);
      setWorkflow(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create workflow
  const createWorkflow = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.createWorkflow(data);
      await getWorkflows();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWorkflows]);

  // Update workflow
  const updateWorkflow = useCallback(async (workflowId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.updateWorkflow(workflowId, data);
      await getWorkflows();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWorkflows]);

  // Delete workflow
  const deleteWorkflow = useCallback(async (workflowId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.deleteWorkflow(workflowId);
      await getWorkflows();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWorkflows]);

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string, data?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.executeWorkflow(workflowId, data);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to execute workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get workflow analytics
  const getWorkflowAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerWorkflowsApi.getWorkflowAnalytics();
      setAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    workflows,
    workflow,
    analytics,
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowAnalytics,
  };
};

export default useCustomerWorkflows; 
