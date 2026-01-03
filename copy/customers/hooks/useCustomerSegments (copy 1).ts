import { useState, useCallback } from 'react';
import { customerSegmentsApi } from '../../../services/api/client';

const useCustomerSegments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [segment, setSegment] = useState<any | null>(null);
  const [customersInSegment, setCustomersInSegment] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Get all segments
  const getSegments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.getSegments();
      setSegments(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch segments');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create segment
  const createSegment = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.createSegment(data);
      await getSegments();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getSegments]);

  // Get segment by ID
  const getSegmentById = useCallback(async (segmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.getSegmentById(segmentId);
      setSegment(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update segment
  const updateSegment = useCallback(async (segmentId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.updateSegment(segmentId, data);
      await getSegments();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getSegments]);

  // Delete segment
  const deleteSegment = useCallback(async (segmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.deleteSegment(segmentId);
      await getSegments();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getSegments]);

  // Get customers in segment
  const getCustomersInSegment = useCallback(async (segmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.getCustomersInSegment(segmentId);
      setCustomersInSegment(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers in segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add customer to segment
  const addCustomerToSegment = useCallback(async (segmentId: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.addCustomerToSegment(segmentId, data);
      await getCustomersInSegment(segmentId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to add customer to segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCustomersInSegment]);

  // Remove customer from segment
  const removeCustomerFromSegment = useCallback(async (segmentId: string, customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.removeCustomerFromSegment(segmentId, customerId);
      await getCustomersInSegment(segmentId);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to remove customer from segment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getCustomersInSegment]);

  // Get segment analytics
  const getSegmentAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.getSegmentAnalytics();
      setAnalytics(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch segment analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto segment customers
  const autoSegmentCustomers = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSegmentsApi.autoSegmentCustomers(data);
      await getSegments();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to auto segment customers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getSegments]);

  return {
    loading,
    error,
    segments,
    segment,
    customersInSegment,
    analytics,
    getSegments,
    createSegment,
    getSegmentById,
    updateSegment,
    deleteSegment,
    getCustomersInSegment,
    addCustomerToSegment,
    removeCustomerFromSegment,
    getSegmentAnalytics,
    autoSegmentCustomers,
  };
};

export default useCustomerSegments; 
