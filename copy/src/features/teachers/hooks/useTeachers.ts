import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '../services/teacherService';
import {
  Teacher,
  TeachersResponse,
  TeacherSearchParams,
  TeacherFilters,
  TeacherSortOptions,
  BulkCreateRequest,
  BulkUpdateRequest,
  BulkDeleteRequest,
  BulkOperationResult,
  ExportRequest,
  ImportRequest,
  ImportResult,
  TeacherStats,
  TeacherAnalytics,
  DepartmentStats,
  ExperienceStats,
  TeacherInsights,
  PerformancePrediction,
  BehavioralAnalysis,
  TeacherNotification,
  TeacherFormData,
  TeacherValidationErrors
} from '../types/teacher';

// Query Keys
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (params: TeacherSearchParams) => [...teacherKeys.lists(), params] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
  stats: () => [...teacherKeys.all, 'stats'] as const,
  analytics: (id: string, period?: string) => [...teacherKeys.all, 'analytics', id, period] as const,
  performance: (id: string) => [...teacherKeys.all, 'performance', id] as const,
  departmentStats: () => [...teacherKeys.all, 'departmentStats'] as const,
  experienceStats: () => [...teacherKeys.all, 'experienceStats'] as const,
  insights: (id: string) => [...teacherKeys.all, 'insights', id] as const,
  predictions: (id: string, period: string) => [...teacherKeys.all, 'predictions', id, period] as const,
  analysis: (id: string) => [...teacherKeys.all, 'analysis', id] as const,
  notifications: (id: string) => [...teacherKeys.all, 'notifications', id] as const,
};

// ======================
// QUERY HOOKS
// ======================

/**
 * Get teachers with pagination and filters
 */
export const useTeachers = (params?: TeacherSearchParams) => {
  return useQuery({
    queryKey: teacherKeys.list(params || {}),
    queryFn: () => teacherService.getTeachers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get teacher by ID
 */
export const useTeacher = (id: string, include?: string[]) => {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: () => teacherService.getTeacherById(id, include),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Search teachers
 */
export const useSearchTeachers = (params: TeacherSearchParams) => {
  return useQuery({
    queryKey: teacherKeys.list({ ...params, search: true }),
    queryFn: () => teacherService.searchTeachers(params),
    enabled: !!params.query || Object.keys(params.filters || {}).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get teacher statistics
 */
export const useTeacherStats = (id: string) => {
  return useQuery({
    queryKey: teacherKeys.stats(),
    queryFn: () => teacherService.getTeacherStats(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get overall teacher statistics
 */
export const useOverallTeacherStats = () => {
  return useQuery({
    queryKey: teacherKeys.stats(),
    queryFn: () => teacherService.getOverallStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get teacher analytics
 */
export const useTeacherAnalytics = (id: string, period: string = '30d') => {
  return useQuery({
    queryKey: teacherKeys.analytics(id, period),
    queryFn: () => teacherService.getTeacherAnalytics(id, period),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Get teacher performance
 */
export const useTeacherPerformance = (id: string) => {
  return useQuery({
    queryKey: teacherKeys.performance(id),
    queryFn: () => teacherService.getTeacherPerformance(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Get department statistics
 */
export const useDepartmentStats = (schoolId?: string) => {
  return useQuery({
    queryKey: teacherKeys.departmentStats(),
    queryFn: () => teacherService.getTeacherCountByDepartment(schoolId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get experience statistics
 */
export const useExperienceStats = (schoolId?: string) => {
  return useQuery({
    queryKey: teacherKeys.experienceStats(),
    queryFn: () => teacherService.getTeacherCountByExperience(schoolId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get teachers by school
 */
export const useTeachersBySchool = (schoolId: string, include?: string[]) => {
  return useQuery({
    queryKey: [...teacherKeys.all, 'bySchool', schoolId, include],
    queryFn: () => teacherService.getTeachersBySchool(schoolId, include),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Get teachers by department
 */
export const useTeachersByDepartment = (departmentId: string, include?: string[]) => {
  return useQuery({
    queryKey: [...teacherKeys.all, 'byDepartment', departmentId, include],
    queryFn: () => teacherService.getTeachersByDepartment(departmentId, include),
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Get teacher insights
 */
export const useTeacherInsights = (teacherId: string) => {
  return useQuery({
    queryKey: teacherKeys.insights(teacherId),
    queryFn: () => teacherService.getTeacherInsights(teacherId),
    enabled: !!teacherId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get performance prediction
 */
export const usePerformancePrediction = (teacherId: string, period: string) => {
  return useQuery({
    queryKey: teacherKeys.predictions(teacherId, period),
    queryFn: () => teacherService.getPerformancePrediction(teacherId, period),
    enabled: !!teacherId && !!period,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Get behavioral analysis
 */
export const useBehavioralAnalysis = (teacherId: string) => {
  return useQuery({
    queryKey: teacherKeys.analysis(teacherId),
    queryFn: () => teacherService.getBehavioralAnalysis(teacherId),
    enabled: !!teacherId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Get teacher notifications
 */
export const useTeacherNotifications = (teacherId: string) => {
  return useQuery({
    queryKey: teacherKeys.notifications(teacherId),
    queryFn: () => teacherService.getTeacherNotifications(teacherId),
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ======================
// MUTATION HOOKS
// ======================

/**
 * Create teacher mutation
 */
export const useCreateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherData: Partial<Teacher>) => teacherService.createTeacher(teacherData),
    onSuccess: () => {
      // Invalidate and refetch teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Update teacher mutation
 */
export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      teacherService.updateTeacher(id, data),
    onSuccess: (data, variables) => {
      // Update the specific teacher in cache
      queryClient.setQueryData(teacherKeys.detail(variables.id), data);
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Delete teacher mutation
 */
export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: (_, id) => {
      // Remove teacher from cache
      queryClient.removeQueries({ queryKey: teacherKeys.detail(id) });
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Restore teacher mutation
 */
export const useRestoreTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teacherService.restoreTeacher(id),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Bulk create teachers mutation
 */
export const useBulkCreateTeachers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCreateRequest) => teacherService.bulkCreateTeachers(data),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Bulk update teachers mutation
 */
export const useBulkUpdateTeachers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateRequest) => teacherService.bulkUpdateTeachers(data),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Bulk delete teachers mutation
 */
export const useBulkDeleteTeachers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkDeleteRequest) => teacherService.bulkDeleteTeachers(data),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Export teachers mutation
 */
export const useExportTeachers = () => {
  return useMutation({
    mutationFn: (request: ExportRequest) => teacherService.exportTeachers(request),
  });
};

/**
 * Import teachers mutation
 */
export const useImportTeachers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ImportRequest) => teacherService.importTeachers(request),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.stats() });
    },
  });
};

/**
 * Upload teacher photo mutation
 */
export const useUploadTeacherPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, file }: { teacherId: string; file: File }) =>
      teacherService.uploadTeacherPhoto(teacherId, file),
    onSuccess: (data, variables) => {
      // Update teacher in cache
      queryClient.setQueryData(teacherKeys.detail(variables.teacherId), (old: Teacher) => ({
        ...old,
        photo: data,
      }));
    },
  });
};

/**
 * Upload teacher documents mutation
 */
export const useUploadTeacherDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, files }: { teacherId: string; files: File[] }) =>
      teacherService.uploadTeacherDocuments(teacherId, files),
    onSuccess: (data, variables) => {
      // Update teacher in cache
      queryClient.setQueryData(teacherKeys.detail(variables.teacherId), (old: Teacher) => ({
        ...old,
        documents: [...(old.documents || []), ...data.map(url => ({
          id: `doc_${Date.now()}`,
          teacherId: variables.teacherId,
          type: 'Other' as const,
          name: 'Uploaded Document',
          url,
          uploadedAt: new Date().toISOString(),
        }))],
      }));
    },
  });
};

/**
 * Mark notification as read mutation
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => teacherService.markNotificationAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Update notification in cache
      queryClient.setQueriesData(
        { queryKey: teacherKeys.all, predicate: (query) => query.queryKey.includes('notifications') },
        (old: TeacherNotification[] | undefined) => {
          if (!old) return old;
          return old.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          );
        }
      );
    },
  });
};

/**
 * Validate teacher data mutation
 */
export const useValidateTeacherData = () => {
  return useMutation({
    mutationFn: (data: TeacherFormData) => teacherService.validateTeacherData(data),
  });
};

/**
 * Generate code suggestions mutation
 */
export const useGenerateCodeSuggestions = () => {
  return useMutation({
    mutationFn: ({ name, schoolId }: { name: string; schoolId: string }) =>
      teacherService.generateCodeSuggestions(name, schoolId),
  });
};
