import { useState, useCallback, useEffect } from 'react';
import classService from '../services/classService';
import { ClassAnalyticsParams, ClassStats, ClassAnalytics, ClassPerformance } from '../types';

interface UseClassAnalyticsState {
  stats: ClassStats | null;
  analytics: ClassAnalytics | null;
  performance: ClassPerformance | null;
  loading: boolean;
  error: string | null;
  filters: ClassAnalyticsParams;
  chartData: any;
  trends: any;
  comparisons: any;
}

interface UseClassAnalyticsReturn extends UseClassAnalyticsState {
  loadStats: (params?: ClassAnalyticsParams) => Promise<void>;
  loadAnalytics: (params?: ClassAnalyticsParams) => Promise<void>;
  loadPerformance: (id: number, params?: any) => Promise<void>;
  updateFilters: (filters: Partial<ClassAnalyticsParams>) => void;
  clearFilters: () => void;
  generateChartData: (type: string, data: any) => any;
  exportAnalytics: (format: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshAnalytics: (classId?: number) => Promise<void>;
}

const initialState: UseClassAnalyticsState = {
  stats: null,
  analytics: null,
  performance: null,
  loading: false,
  error: null,
  filters: {
    period: '30d', // Backend expects '7d', '30d', '90d', '1y', 'all'
    groupBy: 'level', // Backend allows 'day', 'week', 'month', 'quarter', 'year', 'level', 'section'
    metrics: 'registration,activity,performance',
  },
  chartData: null,
  trends: null,
  comparisons: null,
};

export const useClassAnalytics = (): UseClassAnalyticsReturn => {
  const [state, setState] = useState<UseClassAnalyticsState>(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const handleApiError = useCallback((error: any, operation: string) => {
    
    const errorMessage = error.message || `Failed to ${operation} analytics`;
    setError(errorMessage);
  }, [setError]);

  // ======================
  // CHART DATA GENERATION
  // ======================
  
  const generateChartData = useCallback((type: string, data: any) => {
    switch (type) {
      case 'analytics':
        return {
          labels: data.data?.map((item: any) => item.date) || [],
          datasets: [
            {
              data: data.data?.map((item: any) => item.totalClasses) || [],
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              strokeWidth: 2,
            },
            {
              data: data.data?.map((item: any) => item.totalStudents) || [],
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      
      case 'stats':
        return {
          labels: data.levelDistribution?.map((item: any) => `Level ${item.level}`) || [],
          data: data.levelDistribution?.map((item: any) => item.count) || [],
          colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        };
      
      case 'performance':
        return {
          labels: ['Attendance', 'Grades', 'Completion', 'Satisfaction'],
          data: [
            data.metrics?.attendanceRate || 0,
            data.metrics?.averageGrade || 0,
            data.metrics?.completionRate || 0,
            data.metrics?.studentSatisfaction || 0,
          ],
          colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        };
      
      default:
        return null;
    }
  }, []);

  const generateTrendsData = useCallback((analytics: any) => {
    if (!analytics?.trends) return null;
    
    return {
      classGrowth: {
        value: analytics.trends.classGrowth,
        label: 'Class Growth',
        color: analytics.trends.classGrowth > 0 ? '#4BC0C0' : '#FF6384',
        icon: analytics.trends.classGrowth > 0 ? 'trending-up' : 'trending-down',
      },
      studentGrowth: {
        value: analytics.trends.studentGrowth,
        label: 'Student Growth',
        color: analytics.trends.studentGrowth > 0 ? '#36A2EB' : '#FF6384',
        icon: analytics.trends.studentGrowth > 0 ? 'trending-up' : 'trending-down',
      },
      attendanceTrend: {
        value: analytics.trends.attendanceTrend,
        label: 'Attendance Trend',
        color: analytics.trends.attendanceTrend > 0 ? '#FFCE56' : '#FF6384',
        icon: analytics.trends.attendanceTrend > 0 ? 'trending-up' : 'trending-down',
      },
    };
  }, []);

  const generateComparisonsData = useCallback((analytics: any) => {
    if (!analytics?.comparisons) return null;
    
    return {
      schoolAverage: {
        value: analytics.comparisons.schoolAverage,
        label: 'School Average',
        color: '#9966FF',
      },
      levelAverage: {
        value: analytics.comparisons.levelAverage,
        label: 'Level Average',
        color: '#FF9F40',
      },
      previousPeriod: {
        value: analytics.comparisons.previousPeriod,
        label: 'Previous Period',
        color: '#FF6384',
      },
    };
  }, []);

  // ======================
  // ANALYTICS LOADING
  // ======================
  
  const loadStats = useCallback(async (params?: ClassAnalyticsParams) => {
    setLoading(true);
    setError(null);
    
    // Get current filters from state at call time
    const searchParams = { ...state.filters, ...params };
    
    try {
      // Use the enhanced stats method that includes student and attendance data
      const stats = await classService.getEnhancedClassStats(searchParams);
      
      setState(prev => ({
        ...prev,
        stats,
        filters: searchParams,
      }));
    } catch (error) {
      handleApiError(error, 'load stats');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const loadAnalytics = useCallback(async (params?: ClassAnalyticsParams) => {
    setLoading(true);
    setError(null);
    
    // Get current filters from state at call time
    const searchParams = { ...state.filters, ...params };
    
    try {
      const analytics = await classService.getClassAnalytics(searchParams);
      
      // Generate chart data from analytics
      const chartData = generateChartData('analytics', analytics);
      const trends = generateTrendsData(analytics);
      const comparisons = generateComparisonsData(analytics);
      
      setState(prev => ({
        ...prev,
        analytics,
        chartData,
        trends,
        comparisons,
        filters: searchParams,
      }));
    } catch (error) {
      handleApiError(error, 'load analytics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, generateChartData, generateTrendsData, generateComparisonsData]);

  const loadPerformance = useCallback(async (id: number, params?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const performance = await classService.getClassPerformance(id, params);
      
      setState(prev => ({
        ...prev,
        performance,
      }));
    } catch (error) {
      handleApiError(error, 'load performance');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  // ======================
  // FILTER MANAGEMENT
  // ======================
  
  const updateFilters = useCallback((filters: Partial<ClassAnalyticsParams>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: initialState.filters,
    }));
  }, []);

  // ======================
  // EXPORT FUNCTIONALITY
  // ======================
  
  const exportAnalytics = useCallback(async (format: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...state.filters,
        format,
        includeCharts: true,
        includeTrends: true,
      };
      
      const blob = await classService.exportClasses(params);
      
      // Handle file download (platform specific)
      if (format === 'pdf') {
        // Handle PDF download

      } else if (format === 'excel') {
        // Handle Excel download

      } else if (format === 'csv') {
        // Handle CSV download

      }
    } catch (error) {
      handleApiError(error, 'export');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  // ======================
  // REFRESH ALL
  // ======================
  
  const refreshAnalytics = useCallback(async (classId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      if (classId) {
        // Load analytics for specific class
        const performance = await classService.getClassPerformance(classId);
        const chartData = generateChartData('performance', performance);
        
        setState(prev => ({
          ...prev,
          performance,
          chartData,
        }));
      } else {
        // Refresh all analytics
        await refreshAll();
      }
    } catch (error) {
      handleApiError(error, 'refresh analytics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, generateChartData]);

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all analytics data
      await Promise.all([
        loadStats(),
        loadAnalytics(),
      ]);
    } catch (error) {
      handleApiError(error, 'refresh all');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadStats, loadAnalytics]);

  // ======================
  // EFFECTS
  // ======================
  
  useEffect(() => {
    // Load initial analytics only once
    loadStats();
    loadAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    loadStats,
    loadAnalytics,
    loadPerformance,
    updateFilters,
    clearFilters,
    generateChartData,
    exportAnalytics,
    refreshAll,
    refreshAnalytics,
  };
}; 
