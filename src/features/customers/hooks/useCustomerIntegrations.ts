import { useState, useCallback } from 'react';
import { customerIntegrationsApi } from '../../../services/api/client';

const useCustomerIntegrations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [integration, setIntegration] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Get integrations
  const getIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.getIntegrations();
      setIntegrations(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch integrations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create integration
  const createIntegration = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.createIntegration(data);
      await getIntegrations();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create integration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getIntegrations]);

  // Get integration by ID
  const getIntegrationById = useCallback(async (integrationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.getIntegrationById(integrationId);
      setIntegration(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch integration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update integration
  const updateIntegration = useCallback(async (integrationId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.updateIntegration(integrationId, data);
      await getIntegrations();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update integration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getIntegrations]);

  // Delete integration
  const deleteIntegration = useCallback(async (integrationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.deleteIntegration(integrationId);
      await getIntegrations();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete integration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getIntegrations]);

  // Sync integration
  const syncIntegration = useCallback(async (integrationId: string, data?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.syncIntegration(integrationId, data);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to sync integration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get integration analytics
  const getIntegrationAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerIntegrationsApi.getIntegrationAnalytics();
      setAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch integration analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    integrations,
    integration,
    analytics,
    getIntegrations,
    createIntegration,
    getIntegrationById,
    updateIntegration,
    deleteIntegration,
    syncIntegration,
    getIntegrationAnalytics,
  };
};

export default useCustomerIntegrations; 
