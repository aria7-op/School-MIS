// copy/src/features/classes/hooks/useClassesPagination.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import secureApiService, { ApiResponse } from '../../../services/secureApiService';
import { Class, ClassSearchParams, PaginationMeta } from '../types/classes';

interface UseClassesPaginationResult {
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

export const useClassesPagination = (baseParams: ClassSearchParams = {}): UseClassesPaginationResult => {
  const [currentPage, setCurrentPage] = useState(1);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

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

  // Fetch limited pages function (max 3 pages)
  const fetchLimitedPages = useCallback(async () => {
    if (isLoadingAll) return;
    
    setIsLoadingAll(true);
    try {
      // Reset all classes when context changes
      setAllClasses([]);
      
      // First, get the first page to know total pages
      const firstPageResponse = await secureApiService.get<Class[]>('/classes', {
        params: {
          ...baseParams,
          page: 1,
          limit: 20
        }
      });

      if (!firstPageResponse.success || !firstPageResponse.meta?.pagination) {
        throw new Error('Failed to get pagination info');
      }

      const totalPages = firstPageResponse.meta.pagination.totalPages;
      const allClassesData: Class[] = [...(firstPageResponse.data || [])];

      // Only fetch up to 3 pages maximum to avoid rate limiting
      const maxPagesToFetch = Math.min(totalPages, 3);
      
      if (maxPagesToFetch > 1) {
        const remainingPages = Array.from({ length: maxPagesToFetch - 1 }, (_, i) => i + 2);
        
        // Add delay between requests to avoid rate limiting
        for (let i = 0; i < remainingPages.length; i++) {
          const page = remainingPages[i];
          try {
            const response = await secureApiService.get<Class[]>('/classes', {
              params: {
                ...baseParams,
                page,
                limit: 20
              }
            });
            
            if (response.success && response.data) {
              allClassesData.push(...response.data);
            }
            
            // Add small delay between requests
            if (i < remainingPages.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.warn(`Failed to fetch page ${page}:`, error);
            // Continue with other pages even if one fails
          }
        }
      }

      setAllClasses(allClassesData);
      setPagination(firstPageResponse.meta.pagination);
    } catch (error) {
      console.error('Error fetching pages:', error);
      // Fallback to just the current page data
      if (currentPageData?.success && currentPageData.data) {
        setAllClasses(currentPageData.data);
        if (currentPageData.meta?.pagination) {
          setPagination(currentPageData.meta.pagination);
        }
      }
    } finally {
      setIsLoadingAll(false);
    }
  }, [baseParams, isLoadingAll, currentPageData, contextKey.schoolId, contextKey.branchId, contextKey.courseId]);

  // Load limited pages on mount and when context changes
  useEffect(() => {
    fetchLimitedPages();
  }, [fetchLimitedPages, contextKey.schoolId, contextKey.branchId, contextKey.courseId]);

  // Reset page when context changes
  useEffect(() => {
    setCurrentPage(1);
  }, [contextKey.schoolId, contextKey.branchId, contextKey.courseId]);

  // Update current page data when it changes
  useEffect(() => {
    if (currentPageData?.success && currentPageData.data) {
      setAllClasses(prev => {
        const newClasses = [...prev];
        const startIndex = (currentPage - 1) * 20;
        const endIndex = startIndex + 20;
        
        // Replace the current page data
        newClasses.splice(startIndex, 20, ...currentPageData.data);
        return newClasses;
      });
      
      if (currentPageData.meta?.pagination) {
        setPagination(currentPageData.meta.pagination);
      }
    }
  }, [currentPageData, currentPage]);

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination]);

  const nextPage = useCallback(() => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pagination]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const refetch = useCallback(() => {
    refetchCurrentPage();
    fetchLimitedPages();
  }, [refetchCurrentPage, fetchLimitedPages]);

  // Get current page classes
  const currentPageClasses = allClasses.slice((currentPage - 1) * 20, currentPage * 20);

  return {
    classes: currentPageClasses,
    loading: currentPageLoading || isLoadingAll,
    error: currentPageError ? String(currentPageError) : null,
    pagination,
    currentPage,
    totalPages: pagination?.totalPages || 1,
    hasNextPage: pagination ? currentPage < pagination.totalPages : false,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    refetch,
  };
};