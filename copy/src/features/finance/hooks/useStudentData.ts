import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import secureApiService from '../../../services/secureApiService';

interface Student {
  id: string;
  uuid: string;
  admissionNo?: string;
  rollNo?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  class?: {
    id: string;
    name: string;
    code: string;
  };
  parent?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  };
}

interface UseStudentDataOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export const useStudentData = (options: UseStudentDataOptions = {}) => {
  const { enabled = true, staleTime = 10 * 60 * 1000, cacheTime = 15 * 60 * 1000 } = options;
  const { managedContext } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const PAGE_SIZE = 100;

  // Server-side, paginated fetch with optional search and context filtering
  const query = useInfiniteQuery({
    queryKey: ['students', 'infinite', { searchTerm, managedContext }],
    queryFn: async ({ pageParam = 1 }): Promise<Student[]> => {
      try {
        const params: any = { page: pageParam, limit: PAGE_SIZE };
        
        // Add search parameters
        if (searchTerm && searchTerm.trim()) {
          // Most backends accept either `search` or `q`; pass both defensively
          params.search = searchTerm.trim();
          params.q = searchTerm.trim();
        }
        
        // Add context filtering - if course is selected, only send courseId
        if (managedContext?.courseId) {
          console.log('🔍 useStudentData: Filtering by courseId:', managedContext.courseId);
          params.courseId = managedContext.courseId;
        } else if (managedContext?.branchId) {
          console.log('🔍 useStudentData: Filtering by branchId:', managedContext.branchId);
          params.branchId = managedContext.branchId;
        }
        // schoolId is handled by backend from auth token
        
        console.log('🔍 useStudentData: API params:', params);
        const response = await secureApiService.getStudents(params);
        const students = response.data?.data || response.data || [];
        console.log('🔍 useStudentData: Found students:', students.length);
        return Array.isArray(students) ? students : [];
      } catch (error) {
        console.error('🔍 useStudentData: API error:', error);
        throw error as Error;
      }
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If received fewer than PAGE_SIZE items, assume no more pages
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length + 1; // next page number
    },
  });

  const allStudents = useMemo(() => (query.data?.pages || []).flat(), [query.data]);
  const isLoading = query.isLoading;
  const error = query.error as any;

  // With server-side search, just return accumulated students
  const filteredStudents = useMemo(() => allStudents, [allStudents]);

  // Debounced search function
  const debouncedSetSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchTerm(value);
        }, 300); // 300ms debounce
      };
    })(),
    []
  );

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Get student by ID
  const getStudentById = useCallback(
    (id: string): Student | undefined => {
      return allStudents.find(student => student.id === id);
    },
    [allStudents]
  );

  return {
    students: filteredStudents,
    allStudents,
    isLoading,
    error,
    searchTerm,
    setSearchTerm: debouncedSetSearch,
    clearSearch,
    getStudentById,
    totalCount: allStudents.length,
    filteredCount: filteredStudents.length,
    // pagination helpers
    loadMore: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};