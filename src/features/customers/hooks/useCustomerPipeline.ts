import { useState, useCallback } from 'react';
import { customerPipelineApi } from '../../../services/api/client';

const useCustomerPipeline = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<any | null>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [customersByStage, setCustomersByStage] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any | null>(null);

  // Get pipeline
  const getPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.getPipeline();
      setPipeline(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipeline');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pipeline stages
  const getPipelineStages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.getPipelineStages();
      setStages(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipeline stages');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customers by stage
  const getCustomersByStage = useCallback(async (stageId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.getCustomersByStage(stageId);
      setCustomersByStage(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers by stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Move customer to stage
  const moveCustomerToStage = useCallback(async (stageId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.moveCustomerToStage(stageId, data);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to move customer to stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pipeline analytics
  const getPipelineAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.getPipelineAnalytics();
      setAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipeline analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pipeline forecast
  const getPipelineForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.getPipelineForecast();
      setForecast(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipeline forecast');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create pipeline stage
  const createPipelineStage = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.createPipelineStage(data);
      await getPipelineStages();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create pipeline stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPipelineStages]);

  // Update pipeline stage
  const updatePipelineStage = useCallback(async (stageId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.updatePipelineStage(stageId, data);
      await getPipelineStages();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update pipeline stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPipelineStages]);

  // Delete pipeline stage
  const deletePipelineStage = useCallback(async (stageId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerPipelineApi.deletePipelineStage(stageId);
      await getPipelineStages();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete pipeline stage');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPipelineStages]);

  return {
    loading,
    error,
    pipeline,
    stages,
    customersByStage,
    analytics,
    forecast,
    getPipeline,
    getPipelineStages,
    getCustomersByStage,
    moveCustomerToStage,
    getPipelineAnalytics,
    getPipelineForecast,
    createPipelineStage,
    updatePipelineStage,
    deletePipelineStage,
  };
};

export default useCustomerPipeline; 
