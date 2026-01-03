import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';

interface Staff {
  id: string;
  uuid: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  salary?: {
    basicSalary?: number;
    allowances?: number;
  };
}

interface Teacher {
  id: string;
  uuid: string;
  employeeId?: string;
  department?: string;
  subject?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  salary?: {
    basicSalary?: number;
    allowances?: number;
  };
}

interface UseStaffTeachersDataOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export const useStaffTeachersData = (options: UseStaffTeachersDataOptions = {}) => {
  const { enabled = true, staleTime = 10 * 60 * 1000, cacheTime = 15 * 60 * 1000 } = options;
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all staff with aggressive caching
  const { data: allStaff = [], isLoading: loadingStaff, error: staffError } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: async (): Promise<Staff[]> => {
      const response = await secureApiService.get('/staff', {
        params: { limit: 100 }
      });
      return response.data?.data || response.data || [];
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Fetch all teachers with aggressive caching
  const { data: allTeachers = [], isLoading: loadingTeachers, error: teachersError } = useQuery({
    queryKey: ['teachers', 'all'],
    queryFn: async (): Promise<Teacher[]> => {
      const response = await secureApiService.get('/teachers', {
        params: { limit: 100 }
      });
      return response.data?.data || response.data || [];
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Memoized filtered staff based on search term
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) {
      return allStaff;
    }

    const searchLower = searchTerm.toLowerCase();
    return allStaff.filter((staff) => {
      const fullName = `${staff.user?.firstName || ''} ${staff.user?.lastName || ''}`.toLowerCase();
      const employeeId = staff.employeeId?.toLowerCase() || '';
      const phone = staff.user?.phone || '';
      const email = staff.user?.email?.toLowerCase() || '';
      const designation = staff.designation?.toLowerCase() || '';
      const department = staff.department?.toLowerCase() || '';

      return (
        fullName.includes(searchLower) ||
        employeeId.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        designation.includes(searchLower) ||
        department.includes(searchLower)
      );
    });
  }, [allStaff, searchTerm]);

  // Memoized filtered teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) {
      return allTeachers;
    }

    const searchLower = searchTerm.toLowerCase();
    return allTeachers.filter((teacher) => {
      const fullName = `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.toLowerCase();
      const employeeId = teacher.employeeId?.toLowerCase() || '';
      const phone = teacher.user?.phone || '';
      const email = teacher.user?.email?.toLowerCase() || '';
      const department = teacher.department?.toLowerCase() || '';
      const subject = teacher.subject?.toLowerCase() || '';

      return (
        fullName.includes(searchLower) ||
        employeeId.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        department.includes(searchLower) ||
        subject.includes(searchLower)
      );
    });
  }, [allTeachers, searchTerm]);

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

  // Get staff by ID
  const getStaffById = useCallback(
    (id: string): Staff | undefined => {
      return allStaff.find(staff => staff.id === id);
    },
    [allStaff]
  );

  // Get teacher by ID
  const getTeacherById = useCallback(
    (id: string): Teacher | undefined => {
      return allTeachers.find(teacher => teacher.id === id);
    },
    [allTeachers]
  );

  // Get employee by ID (checks both staff and teachers)
  const getEmployeeById = useCallback(
    (id: string): Staff | Teacher | undefined => {
      return getStaffById(id) || getTeacherById(id);
    },
    [getStaffById, getTeacherById]
  );

  return {
    // Staff data
    staff: filteredStaff,
    allStaff,
    isLoadingStaff: loadingStaff,
    staffError,
    
    // Teachers data
    teachers: filteredTeachers,
    allTeachers,
    isLoadingTeachers: loadingTeachers,
    teachersError,
    
    // Combined loading state
    isLoading: loadingStaff || loadingTeachers,
    
    // Search functionality
    searchTerm,
    setSearchTerm: debouncedSetSearch,
    clearSearch,
    
    // Helper functions
    getStaffById,
    getTeacherById,
    getEmployeeById,
    
    // Counts
    totalStaffCount: allStaff.length,
    totalTeachersCount: allTeachers.length,
    filteredStaffCount: filteredStaff.length,
    filteredTeachersCount: filteredTeachers.length,
  };
};