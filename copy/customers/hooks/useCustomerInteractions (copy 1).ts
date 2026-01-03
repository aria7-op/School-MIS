import { useState, useCallback } from 'react';
import { customerInteractionsApi } from '../../../services/api/client';

const useCustomerInteractions = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [interaction, setInteraction] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Get customer interactions
  const getCustomerInteractions = useCallback(async (id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.getCustomerInteractions(targetId);
      setInteractions(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interactions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Create interaction
  const createInteraction = useCallback(async (data: any, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.createInteraction(targetId, data);
      await getCustomerInteractions(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create interaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerInteractions]);

  // Get specific interaction
  const getInteractionById = useCallback(async (interactionId: string, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.getInteractionById(targetId, interactionId);
      setInteraction(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Update interaction
  const updateInteraction = useCallback(async (interactionId: string, data: any, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.updateInteraction(targetId, interactionId, data);
      await getCustomerInteractions(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update interaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerInteractions]);

  // Delete interaction
  const deleteInteraction = useCallback(async (interactionId: string, id?: string) => {
    const targetId = id || customerId;
    if (!targetId) {
      setError('Customer ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.deleteInteraction(targetId, interactionId);
      await getCustomerInteractions(targetId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete interaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [customerId, getCustomerInteractions]);

  // Get interaction analytics
  const getInteractionAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.getInteractionAnalytics();
      setAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interaction analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get interaction timeline
  const getInteractionTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.getInteractionTimeline();
      setTimeline(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interaction timeline');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk create interactions
  const bulkCreateInteractions = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerInteractionsApi.bulkCreateInteractions(data);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to bulk create interactions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    interactions,
    interaction,
    analytics,
    timeline,
    getCustomerInteractions,
    createInteraction,
    getInteractionById,
    updateInteraction,
    deleteInteraction,
    getInteractionAnalytics,
    getInteractionTimeline,
    bulkCreateInteractions,
  };
};

export default useCustomerInteractions; 
