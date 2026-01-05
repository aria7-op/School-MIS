import { useState, useEffect, useCallback } from 'react';
import { getTeacherClasses } from '../services/teacherDashboardService';

export interface TeacherClass {
  id: string;
  uuid: string;
  name: string;
  code: string;
  level: number;
  section: string | null;
  roomNumber: string | null;
  capacity: number;
  classTeacherId: string | null;
  schoolId: string;
  studentCount?: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  school: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    students: number;
    subjects: number;
    timetables: number;
    exams: number;
  };
}

export interface TeacherClassesPayload {
  isAdmin?: boolean;
  classes?: TeacherClass[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  meta?: {
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      hasNext?: boolean;
      hasPrev?: boolean;
    };
  };
}

export interface TeacherClassesResponse {
  success: boolean;
  data: TeacherClass[] | TeacherClassesPayload;
  message: string;
  meta: {
    timestamp: string;
    source: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    teacherId: number;
  };
}

export interface UseTeacherClassesReturn {
  classes: TeacherClass[];
  isLoading: boolean;
  error: string | null;
  refreshClasses: () => Promise<void>;
  filters: {
    schoolId?: string;
    level?: number;
    search?: string;
    page: number;
    limit: number;
  };
  setFilters: (filters: Partial<UseTeacherClassesReturn['filters']>) => void;
  pagination: {
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    currentPage: number;
  };
}

export const useTeacherClasses = (teacherId: string): UseTeacherClassesReturn => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    currentPage: 1,
  });

  const fetchClasses = useCallback(async () => {
    if (!teacherId) {
      console.warn('⚠️ NO TEACHER ID PROVIDED');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 FETCHING TEACHER CLASSES:', { teacherId, filters });
      
      const response = await getTeacherClasses(teacherId, filters) as TeacherClassesResponse;
      
      console.log('📥 RAW RESPONSE:', response);
      console.log('📥 RESPONSE TYPE:', typeof response);
      console.log('📥 RESPONSE SUCCESS:', response?.success);
      console.log('📥 RESPONSE DATA:', response?.data);
      
      if (response && response.success === true) {
        // API returns data either as an array or wrapped in { classes: [] }
        const responseData = response.data;
        const classList = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.classes)
            ? responseData.classes
            : [];

        setClasses(classList);

        const paginationSource =
          response.meta?.pagination ||
          (responseData as TeacherClassesPayload)?.pagination ||
          (responseData as TeacherClassesPayload)?.meta?.pagination ||
          null;

        if (paginationSource) {
          setPagination({
            total: paginationSource.total ?? classList.length,
            totalPages: paginationSource.totalPages ?? 1,
            hasNext: Boolean(paginationSource.hasNext),
            hasPrev: Boolean(paginationSource.hasPrev),
            currentPage: paginationSource.page ?? filters.page,
          });
          console.log('✅ TEACHER CLASSES FETCHED:', classList.length);
          console.log('📊 PAGINATION INFO:', paginationSource);
        } else {
          console.warn('⚠️ NO PAGINATION INFO IN RESPONSE');
          setPagination({
            total: classList.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
            currentPage: filters.page,
          });
        }

        console.log('✅ SUCCESS: API call completed successfully');
      } else {
        const errorMessage = response?.message || 'Failed to fetch classes';
        console.error('❌ API RETURNED FAILURE:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ ERROR FETCHING TEACHER CLASSES:', error);
      console.error('❌ ERROR TYPE:', typeof error);
      console.error('❌ ERROR CONSTRUCTOR:', error.constructor.name);
      
      let errorMessage = 'Failed to fetch teacher classes';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.statusText) {
        errorMessage = `Network error: ${error.response.statusText}`;
      }
      
      setError(errorMessage);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId, filters]);

  const refreshClasses = useCallback(async () => {
    await fetchClasses();
  }, [fetchClasses]);

  const setFilters = useCallback((newFilters: Partial<UseTeacherClassesReturn['filters']>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    isLoading,
    error,
    refreshClasses,
    filters,
    setFilters,
    pagination,
  };
};
