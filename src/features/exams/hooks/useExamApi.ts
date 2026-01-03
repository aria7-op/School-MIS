import { useState, useEffect, useCallback } from 'react';
import examApi, { Exam, ExamFilters, CreateExamData, UpdateExamData, ExamStats, ExamAnalytics } from '../services/examApi';

export const useExamApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    loadingState: boolean = true
  ): Promise<T | null> => {
    try {
      if (loadingState) setLoading(true);
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('API Error:', err);
      return null;
    } finally {
      if (loadingState) setLoading(false);
    }
  }, []);

  // ======================
  // CRUD OPERATIONS
  // ======================

  const getExams = useCallback(async (filters: ExamFilters = {}) => {
    return handleApiCall(() => examApi.getExams(filters));
  }, [handleApiCall]);

  const getExamById = useCallback(async (id: string, include?: string) => {
    return handleApiCall(() => examApi.getExamById(id, include));
  }, [handleApiCall]);

  const createExam = useCallback(async (data: CreateExamData) => {
    return handleApiCall(() => examApi.createExam(data));
  }, [handleApiCall]);

  const updateExam = useCallback(async (id: string, data: UpdateExamData) => {
    return handleApiCall(() => examApi.updateExam(id, data));
  }, [handleApiCall]);

  const deleteExam = useCallback(async (id: string) => {
    return handleApiCall(() => examApi.deleteExam(id));
  }, [handleApiCall]);

  const restoreExam = useCallback(async (id: string) => {
    return handleApiCall(() => examApi.restoreExam(id));
  }, [handleApiCall]);

  // ======================
  // ANALYTICS & REPORTING
  // ======================

  const getExamStats = useCallback(async (id: string) => {
    return handleApiCall(() => examApi.getExamStats(id));
  }, [handleApiCall]);

  const getExamAnalytics = useCallback(async (id: string, period: string = '30d') => {
    return handleApiCall(() => examApi.getExamAnalytics(id, period));
  }, [handleApiCall]);

  const getExamPerformance = useCallback(async (id: string) => {
    return handleApiCall(() => examApi.getExamPerformance(id));
  }, [handleApiCall]);

  // ======================
  // BULK OPERATIONS
  // ======================

  const bulkCreateExams = useCallback(async (exams: CreateExamData[], skipDuplicates: boolean = false) => {
    return handleApiCall(() => examApi.bulkCreateExams(exams, skipDuplicates));
  }, [handleApiCall]);

  const bulkUpdateExams = useCallback(async (updates: { id: string; data: UpdateExamData }[]) => {
    return handleApiCall(() => examApi.bulkUpdateExams(updates));
  }, [handleApiCall]);

  const bulkDeleteExams = useCallback(async (examIds: string[]) => {
    return handleApiCall(() => examApi.bulkDeleteExams(examIds));
  }, [handleApiCall]);

  // ======================
  // SEARCH & FILTER
  // ======================

  const searchExams = useCallback(async (query: string, include?: string) => {
    return handleApiCall(() => examApi.searchExams(query, include), false);
  }, [handleApiCall]);

  // ======================
  // UTILITY ENDPOINTS
  // ======================

  const getExamsByClass = useCallback(async (classId: string, include?: string) => {
    return handleApiCall(() => examApi.getExamsByClass(classId, include));
  }, [handleApiCall]);

  const getExamsBySubject = useCallback(async (subjectId: string, include?: string) => {
    return handleApiCall(() => examApi.getExamsBySubject(subjectId, include));
  }, [handleApiCall]);

  const getUpcomingExams = useCallback(async (days: number = 30, include?: string) => {
    return handleApiCall(() => examApi.getUpcomingExams(days, include));
  }, [handleApiCall]);

  // ======================
  // REPORTING
  // ======================

  const generateExamReport = useCallback(async (filters: ExamFilters = {}) => {
    return handleApiCall(() => examApi.generateExamReport(filters));
  }, [handleApiCall]);

  // ======================
  // IMPORT/EXPORT
  // ======================

  const exportExams = useCallback(async (format: 'csv' | 'json' = 'csv', filters: ExamFilters = {}) => {
    return handleApiCall(() => examApi.exportExams(format, filters));
  }, [handleApiCall]);

  const importExams = useCallback(async (exams: CreateExamData[]) => {
    return handleApiCall(() => examApi.importExams(exams));
  }, [handleApiCall]);

  // ======================
  // CACHE MANAGEMENT
  // ======================

  const getCacheStats = useCallback(async () => {
    return handleApiCall(() => examApi.getCacheStats());
  }, [handleApiCall]);

  const warmCache = useCallback(async (examId?: string) => {
    return handleApiCall(() => examApi.warmCache(examId));
  }, [handleApiCall]);

  const clearCache = useCallback(async (all: boolean = false) => {
    return handleApiCall(() => examApi.clearCache(all));
  }, [handleApiCall]);

  return {
    loading,
    error,
    setError,
    
    // CRUD Operations
    getExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    restoreExam,
    
    // Analytics & Reporting
    getExamStats,
    getExamAnalytics,
    getExamPerformance,
    
    // Bulk Operations
    bulkCreateExams,
    bulkUpdateExams,
    bulkDeleteExams,
    
    // Search & Filter
    searchExams,
    
    // Utility Endpoints
    getExamsByClass,
    getExamsBySubject,
    getUpcomingExams,
    
    // Reporting
    generateExamReport,
    
    // Import/Export
    exportExams,
    importExams,
    
    // Cache Management
    getCacheStats,
    warmCache,
    clearCache
  };
};

// ======================
// SPECIALIZED HOOKS
// ======================

export const useExams = (filters: ExamFilters = {}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const { getExams, loading, error } = useExamApi();

  const loadExams = useCallback(async (newFilters: ExamFilters = {}) => {
    const result = await getExams({ ...filters, ...newFilters });
    if (result && result.data) {
      // Handle the nested response structure: result.data.exams and result.data.pagination
      setExams(result.data.exams || result.data || []);
      setPagination(result.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } else {
      // Ensure exams is always an array even if API fails
      setExams([]);
    }
  }, [getExams, filters]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  return {
    exams,
    pagination,
    loading,
    error,
    loadExams,
    refetch: () => loadExams()
  };
};

export const useExam = (id: string, include?: string) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const { getExamById, loading, error } = useExamApi();

  const loadExam = useCallback(async () => {
    if (id) {
      const result = await getExamById(id, include);
      if (result) {
        setExam(result);
      }
    }
  }, [getExamById, id, include]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  return {
    exam,
    loading,
    error,
    refetch: loadExam
  };
};

export const useExamStats = (id: string) => {
  const [stats, setStats] = useState<ExamStats | null>(null);
  const { getExamStats, loading, error } = useExamApi();

  const loadStats = useCallback(async () => {
    if (id) {
      const result = await getExamStats(id);
      if (result) {
        setStats(result);
      }
    }
  }, [getExamStats, id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
};

export const useExamAnalytics = (id: string, period: string = '30d') => {
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const { getExamAnalytics, loading, error } = useExamApi();

  const loadAnalytics = useCallback(async () => {
    if (id) {
      const result = await getExamAnalytics(id, period);
      if (result) {
        setAnalytics(result);
      }
    }
  }, [getExamAnalytics, id, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: loadAnalytics
  };
};