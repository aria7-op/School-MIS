import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTeachers, useBulkDeleteTeachers, useBulkUpdateTeachers, useExportTeachers } from './useTeachers';
import {
  Teacher,
  TeacherSearchParams,
  TeacherFilters,
  TeacherSortOptions,
  BulkOperationResult,
  UseTeacherListReturn
} from '../types/teacher';

export interface UseTeacherListOptions {
  initialFilters?: TeacherFilters;
  initialSort?: TeacherSortOptions;
  pageSize?: number;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export const useTeacherList = (options: UseTeacherListOptions = {}): UseTeacherListReturn => {
  const {
    initialFilters = {},
    initialSort = { field: 'name', order: 'asc' },
    pageSize = 20,
    enableAutoRefresh = false,
    refreshInterval = 30000
  } = options;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TeacherFilters>(initialFilters);
  const [sortBy, setSortBy] = useState(initialSort.field);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSort.order);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());

  // Query parameters
  const queryParams: TeacherSearchParams = useMemo(() => ({
    query: searchQuery || undefined,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  }), [searchQuery, filters, sortBy, sortOrder, page, limit]);

  // Queries
  const { data: teachersResponse, isLoading, error, refetch } = useTeachers(queryParams);
  const bulkDeleteMutation = useBulkDeleteTeachers();
  const bulkUpdateMutation = useBulkUpdateTeachers();
  const exportMutation = useExportTeachers();

  // Computed values
  const teachers = teachersResponse?.data || [];
  const total = teachersResponse?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const selectedCount = selectedTeachers.size;
  const isAllSelected = teachers.length > 0 && selectedTeachers.size === teachers.length;
  const isPartiallySelected = selectedTeachers.size > 0 && selectedTeachers.size < teachers.length;

  // Auto refresh effect
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, refetch]);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  }, []);

  const handleFilters = useCallback((newFilters: Partial<TeacherFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filtering
  }, []);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1); // Reset to first page when sorting
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  // Selection handlers
  const toggleTeacherSelection = useCallback((teacherId: string) => {
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  }, []);

  const selectAllTeachers = useCallback(() => {
    setSelectedTeachers(new Set(teachers.map(t => t.id)));
  }, [teachers]);

  const clearSelection = useCallback(() => {
    setSelectedTeachers(new Set());
  }, []);

  // Bulk operations
  const bulkDelete = useCallback(async (): Promise<BulkOperationResult> => {
    if (selectedTeachers.size === 0) {
      throw new Error('No teachers selected');
    }

    const result = await bulkDeleteMutation.mutateAsync({
      teacherIds: Array.from(selectedTeachers),
      softDelete: true
    });

    clearSelection();
    return result;
  }, [selectedTeachers, bulkDeleteMutation, clearSelection]);

  const bulkActivate = useCallback(async (): Promise<BulkOperationResult> => {
    if (selectedTeachers.size === 0) {
      throw new Error('No teachers selected');
    }

    const result = await bulkUpdateMutation.mutateAsync({
      updates: Array.from(selectedTeachers).map(id => ({
        id,
        data: { status: 'Active' as const }
      }))
    });

    clearSelection();
    return result;
  }, [selectedTeachers, bulkUpdateMutation, clearSelection]);

  const bulkDeactivate = useCallback(async (): Promise<BulkOperationResult> => {
    if (selectedTeachers.size === 0) {
      throw new Error('No teachers selected');
    }

    const result = await bulkUpdateMutation.mutateAsync({
      updates: Array.from(selectedTeachers).map(id => ({
        id,
        data: { status: 'Inactive' as const }
      }))
    });

    clearSelection();
    return result;
  }, [selectedTeachers, bulkUpdateMutation, clearSelection]);

  const bulkExport = useCallback(async (format: string): Promise<void> => {
    if (selectedTeachers.size === 0) {
      throw new Error('No teachers selected');
    }

    await exportMutation.mutateAsync({
      format: format as 'json' | 'csv' | 'xlsx' | 'pdf',
      filters: {
        ...filters,
        // Add filter to only export selected teachers
      }
    });
  }, [selectedTeachers, exportMutation, filters]);

  const bulkUpdate = useCallback(async (updates: any[]): Promise<BulkOperationResult> => {
    if (selectedTeachers.size === 0) {
      throw new Error('No teachers selected');
    }

    const updateData = Array.from(selectedTeachers).map(id => ({
      id,
      data: updates.find(u => u.id === id) || {}
    }));

    const result = await bulkUpdateMutation.mutateAsync({
      updates: updateData
    });

    clearSelection();
    return result;
  }, [selectedTeachers, bulkUpdateMutation, clearSelection]);

  // Refresh function
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage) return;
    setPage(prev => prev + 1);
  }, [isLoading, hasNextPage]);

  // Real-time updates (placeholder)
  const subscribeToUpdates = useCallback(() => {
    // Implementation for real-time updates
    console.log('Subscribing to teacher updates');
  }, []);

  const unsubscribeFromUpdates = useCallback(() => {
    // Implementation for unsubscribing from updates
    console.log('Unsubscribing from teacher updates');
  }, []);

  return {
    // State
    teachers,
    filteredTeachers: teachers, // In this implementation, filtering is done server-side
    selectedTeachers,
    loading: isLoading,
    refreshing: false, // Could be implemented with a separate refreshing state
    error: error?.message || null,
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    pagination: {
      page,
      limit,
      total,
    },
    
    // Computed values
    totalPages,
    hasNextPage,
    hasPreviousPage,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    
    // Actions
    setSearchQuery: handleSearch,
    setFilters: handleFilters,
    setSortBy: (field: string) => handleSort(field, sortOrder),
    setSortOrder: (order: 'asc' | 'desc') => handleSort(sortBy, order),
    setPage: handlePageChange,
    setLimit: handleLimitChange,
    toggleTeacherSelection,
    selectAllTeachers,
    clearSelection,
    refresh,
    loadMore,
    
    // Bulk operations
    bulkDelete,
    bulkActivate,
    bulkDeactivate,
    bulkExport,
    bulkUpdate,
    
    // Real-time updates
    subscribeToUpdates,
    unsubscribeFromUpdates,
  };
};
