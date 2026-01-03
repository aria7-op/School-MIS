import { useState, useCallback } from 'react';
import { customerAnalyticsApi } from '../../../services/api/client';

const useCustomerAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [trends, setTrends] = useState<any | null>(null);
  const [forecasting, setForecasting] = useState<any | null>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<any | null>(null);

  // Get analytics dashboard
  const getAnalyticsDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getAnalyticsDashboard();
      const analyticsData = response.data;
      setDashboard(analyticsData);
      return analyticsData;
    } catch (err: any) {
      
      setError(err.message || 'Failed to fetch analytics dashboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pipeline analytics (the endpoint you want)
  const getPipelineAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getPipelineAnalytics();
      setDashboard(response);
      return response;
    } catch (err: any) {
      
      setError(err.message || 'Failed to fetch pipeline analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get analytics reports
  const getAnalyticsReports = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getAnalyticsReports(params);
      const reportsData = response.data;
      setReports(reportsData);
      return reportsData;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics reports');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get analytics trends
  const getAnalyticsTrends = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getAnalyticsTrends(params);
      const trendsData = response.data;
      setTrends(trendsData);
      return trendsData;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics trends');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get forecasting analytics
  const getForecastingAnalytics = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getForecastingAnalytics(params);
      const forecastingData = response.data;
      setForecasting(forecastingData);
      return forecastingData;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch forecasting analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export analytics
  const exportAnalytics = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.exportAnalytics(data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to export analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer analytics
  const getCustomerAnalytics = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getCustomerAnalytics(id);
      const customerAnalyticsData = response.data;
      setCustomerAnalytics(customerAnalyticsData);
      return customerAnalyticsData;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer analytics');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer performance
  const getCustomerPerformance = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getCustomerPerformance(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer performance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer engagement
  const getCustomerEngagement = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getCustomerEngagement(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer engagement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer conversion
  const getCustomerConversion = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getCustomerConversion(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer conversion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer lifetime value
  const getCustomerLifetimeValue = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerAnalyticsApi.getCustomerLifetimeValue(id);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer lifetime value');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    dashboard,
    reports,
    trends,
    forecasting,
    customerAnalytics,
    getAnalyticsDashboard,
    getPipelineAnalytics,
    getAnalyticsReports,
    getAnalyticsTrends,
    getForecastingAnalytics,
    exportAnalytics,
    getCustomerAnalytics,
    getCustomerPerformance,
    getCustomerEngagement,
    getCustomerConversion,
    getCustomerLifetimeValue,
  };
};

export default useCustomerAnalytics; 
