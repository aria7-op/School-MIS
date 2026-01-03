// copy/src/features/classes/hooks/useClassesSimplePagination.ts
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import secureApiService, { ApiResponse } from '../../../services/secureApiService';
import { Class, ClassSearchParams, PaginationMeta } from '../types/classes';

interface UseClassesSimplePaginationResult {
  classes: Class[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => void;
}

export const useClassesSimplePagination = (baseParams: ClassSearchParams = {}): UseClassesSimplePaginationResult => {
  const [currentPage, setCurrentPage] = useState(1);

  // Get managed context for query key
  const managedContext = secureApiService.getManagedContext();
  const contextKey = {
    schoolId: managedContext.schoolId || null,
    branchId: managedContext.branchId || null,
    courseId: managedContext.courseId || null,
  };

  // Current page query
  const {
    data: currentPageData,
    isLoading: currentPageLoading,
    error: currentPageError,
    refetch: refetchCurrentPage
  } = useQuery({
    queryKey: ['classes', 'page', contextKey, currentPage, baseParams],
    queryFn: async () => {
      const response = await secureApiService.get<Class[]>('/classes', {
        params: {
          ...baseParams,
          // Explicitly scope by managed context as query params for servers that don't read headers
          ...(contextKey.schoolId ? { schoolId: contextKey.schoolId } : {}),
          ...(contextKey.branchId ? { branchId: contextKey.branchId } : {}),
          ...(contextKey.courseId ? { courseId: contextKey.courseId } : {}),
          page: currentPage,
          limit: 20
        }
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    console.log('goToPage called:', { page, currentPage, totalPages: currentPageData?.meta?.totalPages });
    if (currentPageData?.meta && page >= 1 && page <= currentPageData.meta.totalPages) {
      console.log('Setting page to:', page);
      setCurrentPage(page);
    } else {
      console.log('Cannot go to page - conditions not met');
    }
  }, [currentPageData]);

  const nextPage = useCallback(() => {
    console.log('nextPage called:', { currentPage, totalPages: currentPageData?.meta?.totalPages });
    if (currentPageData?.meta && currentPage < currentPageData.meta.totalPages) {
      console.log('Setting page to:', currentPage + 1);
      setCurrentPage(prev => prev + 1);
    } else {
      console.log('Cannot go to next page - conditions not met');
    }
  }, [currentPage, currentPageData]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const refetch = useCallback(() => {
    refetchCurrentPage();
  }, [refetchCurrentPage]);

  // Reset page when baseParams or managed context change
  useEffect(() => {
    setCurrentPage(1);
  }, [baseParams.search, baseParams.sortBy, baseParams.sortOrder, contextKey.schoolId, contextKey.branchId, contextKey.courseId]);

  // Debug: Log the actual API response structure
  console.log('API Response structure:', {
    currentPageData,
    meta: currentPageData?.meta,
    data: currentPageData?.data?.length
  });

  return {
    classes: currentPageData?.data || [],
    loading: currentPageLoading,
    error: currentPageError ? String(currentPageError) : null,
    pagination: currentPageData?.meta || null,
    currentPage,
    totalPages: currentPageData?.meta?.totalPages || 1,
    hasNextPage: currentPageData?.meta ? currentPage < currentPageData.meta.totalPages : false,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  };
};