import { useState, useEffect, useCallback, useRef } from 'react';
import teacherDashboardService, { TeacherDashboardData } from '../services/teacherDashboardService';

export interface UseTeacherDashboardReturn {
  // Data
  dashboardData: TeacherDashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  refreshDashboard: () => Promise<void>;
  refreshCache: () => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Specific data getters
  getClassPerformance: (classId: string) => Promise<any>;
  getClassStudentPerformance: (classId: string) => Promise<any>;
  getUpcomingAssignments: () => Promise<any>;
  getPendingSubmissions: () => Promise<any>;
  getAttendanceTrends: (period: string) => Promise<any>;
}

export const useTeacherDashboard = (): UseTeacherDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const data = await teacherDashboardService.getTeacherDashboard();
      setDashboardData(data);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to fetch dashboard data');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Force clear cache and get fresh data
      const data = await teacherDashboardService.forceClearCacheAndRefresh();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error refreshing dashboard:', error);
      setError(error.message || 'Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refresh cache
  const refreshCache = useCallback(async () => {
    try {
      await teacherDashboardService.clearCache();
      await fetchDashboardData(true);
    } catch (error: any) {
      console.error('Error refreshing cache:', error);
      setError('Failed to refresh cache');
    }
  }, [fetchDashboardData]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await teacherDashboardService.clearCache();
      setDashboardData(null);
    } catch (error: any) {
      console.error('Error clearing cache:', error);
      setError('Failed to clear cache');
    }
  }, []);

  // Get class performance
  const getClassPerformance = useCallback(async (classId: string) => {
    try {
      return await teacherDashboardService.getClassPerformance(classId);
    } catch (error: any) {
      console.error('Error fetching class performance:', error);
      throw error;
    }
  }, []);

  // Get class student performance
  const getClassStudentPerformance = useCallback(async (classId: string) => {
    try {
      return await teacherDashboardService.getClassStudentPerformance(classId);
    } catch (error: any) {
      console.error('Error fetching class student performance:', error);
      throw error;
    }
  }, []);

  // Get upcoming assignments
  const getUpcomingAssignments = useCallback(async () => {
    try {
      return await teacherDashboardService.getUpcomingAssignments();
    } catch (error: any) {
      console.error('Error fetching upcoming assignments:', error);
      throw error;
    }
  }, []);

  // Get pending submissions
  const getPendingSubmissions = useCallback(async () => {
    try {
      return await teacherDashboardService.getPendingSubmissions();
    } catch (error: any) {
      console.error('Error fetching pending submissions:', error);
      throw error;
    }
  }, []);

  // Get attendance trends
  const getAttendanceTrends = useCallback(async (period: string) => {
    try {
      return await teacherDashboardService.getAttendanceTrends(period);
    } catch (error: any) {
      console.error('Error fetching attendance trends:', error);
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Load dashboard data directly with timeout
    const loadDashboardWithTimeout = async () => {
      try {
        console.log('🚀 LOADING DASHBOARD DATA...');
        
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Dashboard loading timeout')), 30000); // 30 second timeout
        });
        
        // Race between dashboard loading and timeout
        await Promise.race([
          fetchDashboardData(),
          timeoutPromise
        ]);
        
        console.log('✅ DASHBOARD LOADED SUCCESSFULLY');
      } catch (error: any) {
        console.error('❌ ERROR loading dashboard:', error);
        if (error.message === 'Dashboard loading timeout') {
          setError('Dashboard is taking too long to load. Please refresh the page.');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
        // Set loading to false even on error
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    
    loadDashboardWithTimeout();
  }, [fetchDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Data
    dashboardData,
    isLoading,
    isRefreshing,
    error,
    
    // Actions
    refreshDashboard,
    refreshCache,
    clearCache,
    
    // Specific data getters
    getClassPerformance,
    getClassStudentPerformance,
    getUpcomingAssignments,
    getPendingSubmissions,
    getAttendanceTrends,
  };
}; 